// src/app/components/admin/admin.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Createevento } from '../createevento/createevento';
import { EventService, EventoDTO, UiEvent } from '../../../services/event.service';
import { InscripcionesService, InscripcionDTO } from '../../../services/inscripciones.service';
import { MetodoPagoEventoService } from '../../../services/metodo-pago-evento.service';
import { FechaeventoService } from '../../../services/fechaevento.service';
import { forkJoin, of, map, catchError, Observable } from 'rxjs';
import { EstudianteUpeuService } from '../../../services/estudiante-upeu.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Createevento],
  templateUrl: './admin.html'
})
export class Admin implements OnInit {
  searchQuery: string = '';
  activeTab: string = 'all-events';
  createDialogOpen: boolean = false;
  editingEvent: any = undefined;
  selectedEventForAttendance: any = null;
  selectedEventForReport: any = null;
  selectedEventForBulk: any = null;
  bulkCodesText: string = '';
  bulkMetodoPago: string = '';
  bulkNumeroOperacion: string = '';
  bulkValidCount: number = 0;
  bulkInvalidCodes: string[] = [];
  loadingCodes: boolean = false;
  userManagementOpen: boolean = false;

  events: UiEvent[] = [];
  deletingEventId: string | null = null;
  toasts: { text: string; type: 'success' | 'error' | 'info'; ts: number }[] = [];

  registrations: any[] = [
    {
      id: '1',
      eventId: '1',
      studentCode: '20240001',
      registeredAt: '2025-01-10',
      qrCode: 'QR-1-20240001',
      attended: true,
      attendedAt: '2025-01-15'
    }
  ];

  constructor(
    private eventService: EventService,
    private inscripcionesService: InscripcionesService,
    private metodoPagoEventoService: MetodoPagoEventoService,
    private fechaeventoService: FechaeventoService,
    private estudianteService: EstudianteUpeuService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.eventService.getEventos().subscribe({
      next: (items) => {
        this.events = items;
        this.loadRegistrations();
        this.loadPaymentMethods();
        this.loadSessions();
      }
    });
  }

  private loadRegistrations(): void {
    this.inscripcionesService.getInscripciones().subscribe({
      next: (regs) => {
        // Actualizar conteo de registros por evento
        const counts: Record<string, number> = {};
        regs.forEach(r => {
          const eid = r.eventoId != null ? String(r.eventoId) : '';
          if (eid) counts[eid] = (counts[eid] || 0) + 1;
        });
        this.events = this.events.map(e => ({
          ...e,
          registeredCount: counts[e.id] || 0
        }));

        // Mapear a estructura interna de registrations para métricas
        this.registrations = regs.map(r => ({
          id: String(r.id),
          eventId: r.eventoId != null ? String(r.eventoId) : '',
          studentCode: r.codigoEstudiante || '',
          registeredAt: r.fechaInscripcion || '',
          qrCode: '',
          attended: (r.estado || '').toUpperCase() === 'CONFIRMADO' || (r.estado || '').toUpperCase() === 'ASISTIO',
          attendedAt: r.fechaConfirmacion || ''
        }));
      }
    });
  }

  get filteredEvents(): any[] {
    return this.events.filter(event => {
      if (!this.searchQuery) return true;
      const query = this.searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query) ||
        event.faculty.toLowerCase().includes(query)
      );
    });
  }

  get totalEvents(): number {
    return this.events.length;
  }

  get totalRegistrations(): number {
    return this.registrations.length;
  }

  get totalAttendance(): number {
    return this.registrations.filter(r => r.attended).length;
  }

  get publishedEvents(): number {
    return this.events.filter(e => e.status === 'published').length;
  }

  get currentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getTabEvents(): any[] {
    switch (this.activeTab) {
      case 'published':
        return this.filteredEvents.filter(e => e.status === 'published');
      case 'draft':
        return this.filteredEvents.filter(e => e.status === 'draft');
      default:
        return this.filteredEvents;
    }
  }

  openCreateEvent(): void {
    this.editingEvent = undefined;
    this.createDialogOpen = true;
  }

  openBulk(event: any): void {
    this.selectedEventForBulk = event;
    this.bulkCodesText = '';
    this.bulkValidCount = 0;
    this.bulkInvalidCodes = [];
    this.bulkMetodoPago = '';
    this.bulkNumeroOperacion = '';
    this.loadAllStudentCodesForBulk();
  }

  editEvent(event: any): void {
    console.log('🔄 EDITANDO EVENTO:', event);

    this.editingEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      faculty: event.faculty,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      capacity: event.capacity,
      registeredCount: event.registeredCount,
      isPaid: event.isPaid,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
      school: event.school || '',
      targetCycles: event.targetCycles || [],
      imageUrl: event.imageUrl || '',
      isFree: event.isFree !== undefined ? event.isFree : true,
      price: event.price || 0,
      acceptedPaymentMethods: event.acceptedPaymentMethods || [],
      eventDates: event.eventDates || []
    };

    console.log('✅ EVENTO PREPARADO PARA EDICIÓN:', this.editingEvent);
    this.createDialogOpen = true;
  }

  handleCreateDialogChange(isOpen: boolean): void {
    console.log('📞 Diálogo cambió a:', isOpen);
    this.createDialogOpen = isOpen;

    if (!isOpen) {
      console.log('🧹 Limpiando evento de edición');
      this.editingEvent = undefined;
    }
  }

  handleSaveEvent(eventData: any): void {
    console.log('📨 [ADMIN] Recibiendo datos del createvento:', eventData);
    console.log('🖼️ [ADMIN] Imagen recibida:', eventData.imageUrl || 'NO HAY IMAGEN');

    if (this.editingEvent) {
      this.handleUpdateEvent(eventData);
    } else {
      this.handleCreateEvent(eventData);
    }
  }

  handleCreateEvent(eventData: any): void {
    const desiredPublished = eventData.status === 'published';
    const isPaidEvent = !eventData.isFree;
    if (isPaidEvent && (!eventData.acceptedPaymentMethods || eventData.acceptedPaymentMethods.length === 0)) {
      alert('Para eventos de pago, selecciona al menos un método de pago aceptado.');
      return;
    }
    const baseDto: EventoDTO = {
      nombre: eventData.title,
      descripcion: eventData.description,
      tipo: this.mapTypeToBackend(eventData.type),
      categoria: 'GENERAL',
      ubicacion: eventData.location,
      capacidad: eventData.capacity,
      esPago: !eventData.isFree,
      precio: eventData.price || 0,
      imagenUrl: eventData.imageUrl || '',
      estado: false,
      creadoPorId: this.currentUser?.id || undefined
    };
    this.eventService.createEvento(baseDto).subscribe({
      next: (created) => {
        const eid = Number(created.id || 0);
        const sessionCalls: any[] = [];
        if (eventData.startDate && eventData.endDate) {
          sessionCalls.push(this.fechaeventoService.create({
            eventoId: eid,
            fechaInicio: eventData.startDate,
            fechaFin: eventData.endDate,
            descripcion: eventData.description || ''
          }));
        }
        (eventData.eventDates || []).forEach((d: any) => {
          sessionCalls.push(this.fechaeventoService.create({
            eventoId: eid,
            fechaInicio: d.startDate,
            fechaFin: d.endDate,
            descripcion: d.location || ''
          }));
        });
        const methodCalls = (eventData.acceptedPaymentMethods || []).map((m: string) =>
          this.metodoPagoEventoService.create({
            nombreMetodo: m,
            descripcion: '',
            activo: true,
            eventoId: eid
          })
        );
        const allCalls = [...sessionCalls, ...methodCalls];
        const after$: Observable<any> = allCalls.length ? forkJoin(allCalls) : of(null);
        after$.subscribe({
          next: () => {
            if (desiredPublished) {
              const publishDto: EventoDTO = { ...baseDto, estado: true };
              this.eventService.updateEvento(eid, publishDto).subscribe({
                next: (updated) => {
                  this.events = [updated, ...this.events];
                  this.createDialogOpen = false;
                }
              });
            } else {
              this.events = [created, ...this.events];
              this.createDialogOpen = false;
            }
          }
        });
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || 'No se pudo crear el evento');
        this.showToast(msg, 'error');
      }
    });
  }

  // CORRECCIÓN: Agregar campos de imagen al actualizar evento
  handleUpdateEvent(eventData: any): void {
    if (!this.editingEvent) return;

    console.log('✏️ [ADMIN] Actualizando evento:', this.editingEvent.id);
    console.log('🖼️ [ADMIN] Nueva imagen:', eventData.imageUrl);

    const idNum = Number(this.editingEvent.id);
    const dto: EventoDTO = {
      nombre: eventData.title,
      descripcion: eventData.description,
      tipo: this.mapTypeToBackend(eventData.type),
      categoria: 'GENERAL',
      ubicacion: eventData.location,
      capacidad: eventData.capacity,
      esPago: !eventData.isFree,
      precio: eventData.price || 0,
      imagenUrl: eventData.imageUrl || '',
      estado: eventData.status === 'published',
      creadoPorId: this.currentUser?.id || 0
    };
    this.eventService.updateEvento(idNum, dto).subscribe({
      next: (updated) => {
        this.events = this.events.map(e => e.id === String(idNum) ? updated : e);
        this.fechaeventoService.getAll().subscribe({
          next: (all) => {
            const toDelete = all.filter(f => f.eventoId === idNum && f.id != null);
            const deletionCalls = toDelete.map(f => this.fechaeventoService.delete(f.id!));
            forkJoin(deletionCalls.length ? deletionCalls : [of(null)]).subscribe({
              next: () => {
                if (eventData.startDate && eventData.endDate) {
                  this.fechaeventoService.create({
                    eventoId: idNum,
                    fechaInicio: eventData.startDate,
                    fechaFin: eventData.endDate,
                    descripcion: eventData.description || ''
                  }).subscribe();
                }
                (eventData.eventDates || []).forEach((d: any) => {
                  this.fechaeventoService.create({
                    eventoId: idNum,
                    fechaInicio: d.startDate,
                    fechaFin: d.endDate,
                    descripcion: d.location || ''
                  }).subscribe();
                });
              }
            });
          }
        });
        (eventData.acceptedPaymentMethods || []).forEach((m: string) => {
          this.metodoPagoEventoService.create({
            nombreMetodo: m,
            descripcion: '',
            activo: true,
            eventoId: idNum
          }).subscribe();
        });
        this.createDialogOpen = false;
        this.editingEvent = undefined;
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || 'No se pudo actualizar el evento');
        this.showToast(msg, 'error');
      }
    });
  }

  handleBulkRegister(eventId: string, studentCodes: string[]): void {
    const eidNum = Number(eventId);
    const raw = studentCodes.map(c => (c || '').trim()).filter(Boolean);
    const formatted = Array.from(new Set(raw)).filter(code => /^\d{7,8}$/.test(code));
    if (formatted.length === 0) {
      this.selectedEventForBulk = null;
      return;
    }
    const isPaid = this.selectedEventForBulk && this.selectedEventForBulk.isPaid === true;
    if (isPaid) {
      if (!this.bulkMetodoPago || !this.bulkNumeroOperacion) {
        this.showToast('Selecciona método y número de operación para eventos de pago', 'error');
        return;
      }
      this.validateStudentCodes(formatted).subscribe({
        next: (validCodes) => {
          const calls = validCodes.map(code => this.inscripcionesService.createInscripcion({
            eventoId: eidNum,
            codigoEstudiante: code,
            esInscripcionMasiva: 'S',
            estado: 'CONFIRMADO',
            metodoPago: this.bulkMetodoPago,
            numeroOperacion: this.bulkNumeroOperacion
          }));
          if (calls.length === 0) {
            this.selectedEventForBulk = null;
            return;
          }
          forkJoin(calls).subscribe({
            next: () => {
              this.loadRegistrations();
              this.selectedEventForBulk = null;
              this.bulkMetodoPago = '';
              this.bulkNumeroOperacion = '';
            }
          });
        }
      });
    } else {
      this.inscripcionesService.bulkInscribir(eidNum, formatted).subscribe({
        next: () => {
          this.loadRegistrations();
          this.selectedEventForBulk = null;
          this.bulkValidCount = 0;
          this.bulkInvalidCodes = [];
        }
      });
    }
  }

  onBulkFileChange(e: any): void {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const name = String(file.name || '').toLowerCase();
    if (!name.endsWith('.csv')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const codes = this.parseCsvToCodes(text);
      this.bulkCodesText = codes.join('\n');
      this.computeBulkStats();
    };
    reader.readAsText(file);
  }

  parseCsvToCodes(text: string): string[] {
    const tokens = String(text || '').split(/[\r\n,;\t\s]+/);
    const codes = tokens.map(t => (t || '').trim()).filter(v => /^\d{7,8}$/.test(v));
    return Array.from(new Set(codes));
  }

  private parseBulkCodes(text: string): { valid: string[]; invalid: string[] } {
    const tokens = String(text || '').split(/[\r\n,;\t\s]+/);
    const trimmed = tokens.map(t => (t || '').trim()).filter(Boolean);
    const unique = Array.from(new Set(trimmed));
    const valid = unique.filter(v => /^\d{7,8}$/.test(v));
    const invalid = unique.filter(v => !/^\d{7,8}$/.test(v));
    return { valid, invalid };
  }

  computeBulkStats(): void {
    const { valid, invalid } = this.parseBulkCodes(this.bulkCodesText);
    this.bulkValidCount = valid.length;
    this.bulkInvalidCodes = invalid;
  }

  validateBulkCodes(): void {
    const allCodes = this.parseCsvToCodes(this.bulkCodesText);

    this.inscripcionesService.validarCodigos(allCodes).subscribe({
      next: (res) => {
        this.bulkValidCount = res.cantidadValidos;
        this.bulkInvalidCodes = res.invalidos;

        this.showToast(
          `Válidos: ${res.cantidadValidos}. Invalidos: ${res.invalidos.length}`,
          'info'
        );
      },
      error: () => {
        this.showToast('Error validando códigos', 'error');
      }
    });
  }


  downloadBulkTemplate(): void {
    const sample = ['20240001', '20241002', '20242003'].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-codigos.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  loadAllStudentCodesForBulk(): void {
    this.loadingCodes = true;
    this.estudianteService.getAll().subscribe({
      next: (items) => {
        const codes = (items || []).map(e => String(e.codigoEstudiante || '')).filter(v => v && /^\d{7,8}$/.test(v));
        const unique = Array.from(new Set(codes));
        this.bulkCodesText = unique.join('\n');
        this.computeBulkStats();
        console.log('[ADMIN] Cargados códigos de estudiantes-upeu:', unique.length);
        this.loadingCodes = false;
      },
      error: () => {
        this.showToast('No se pudo cargar códigos', 'error');
        this.loadingCodes = false;
      }
    });
  }

  validateStudentCodes(codes: string[]) {
    const tasks = codes.map(code => this.estudianteService.getByCodigo(code).pipe(
      map(() => code),
      catchError(() => of(null))
    ));
    return forkJoin(tasks).pipe(map(items => items.filter((v): v is string => !!v)));
  }

  attendanceForEvent: any[] = [];
  attendanceMode: 'qr' | 'manual' = 'qr';
  qrInput: string = '';
  attendanceSearch: string = '';
  recentAttendance: { codigoEstudiante: string; nombre: string; fecha: string }[] = [];
  attendanceInscritos: number = 0;
  attendanceAsistieron: number = 0;
  attendancePendientes: number = 0;

  openAttendance(event: any): void {
    this.selectedEventForAttendance = event;
    const idNum = Number(event.id);
    this.inscripcionesService.getByEventoId(idNum).subscribe({
      next: (regs) => {
        this.attendanceForEvent = regs.map(r => ({
          id: r.id,
          codigoEstudiante: r.codigoEstudiante || r.codigoAlumno || '',
          nombre: (r.nombreEstudiante || '') + (r.apellidosEstudiante ? ' ' + r.apellidosEstudiante : ''),
          asistio: (r.estado || '').toUpperCase() === 'ASISTIO'
        }));
        this.recomputeAttendanceStats();
      }
    });
  }

  deleteEvent(event: any): void {
    const idNum = Number(event?.id);
    if (isNaN(idNum)) return;
    const ok = confirm(`¿Eliminar el evento "${event.title}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    this.deletingEventId = String(idNum);
    const prev = [...this.events];
    this.events = this.events.filter(e => e.id !== String(idNum));
    this.eventService.deleteEvento(idNum).subscribe({
      next: () => {
        this.selectedEventForBulk = null;
        this.deletingEventId = null;
        this.loadRegistrations();
        this.showToast('Evento eliminado', 'success');
      },
      error: (err) => {
        this.events = prev;
        this.deletingEventId = null;
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || 'No se pudo eliminar el evento');
        this.showToast(msg, 'error');
      }
    });
  }

  private showToast(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const ts = Date.now();
    this.toasts = [...this.toasts, { text, type, ts }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.ts !== ts);
    }, 3000);
  }

  markAttendance(item: any, value: boolean): void {
    item.asistio = value;
  }

  saveAttendance(): void {
    const idNum = Number(this.selectedEventForAttendance?.id);
    const updates = this.attendanceForEvent.map(it => this.inscripcionesService.updateInscripcion(Number(it.id), {
      estado: it.asistio ? 'ASISTIO' : 'CONFIRMADO'
    }));
    forkJoin(updates).subscribe({
      next: () => {
        this.selectedEventForAttendance = null;
        this.loadRegistrations();
      }
    });
  }

  setAttendanceMode(mode: 'qr' | 'manual'): void {
    this.attendanceMode = mode;
    this.qrInput = '';
  }

  registerAttendance(): void {
    const raw = (this.qrInput || '').trim();
    if (!raw) return;
    const code = this.attendanceMode === 'qr' ? this.parseQrToCode(raw) : raw;
    if (!/^\d{7,8}$/.test(code)) return;
    const item = this.attendanceForEvent.find(x => x.codigoEstudiante === code);
    if (!item) return;
    if (item.asistio) return;
    this.inscripcionesService.updateInscripcion(Number(item.id), { estado: 'ASISTIO' }).subscribe({
      next: () => {
        item.asistio = true;
        this.recomputeAttendanceStats();
        const fecha = new Date().toISOString();
        this.recentAttendance = [{ codigoEstudiante: item.codigoEstudiante, nombre: item.nombre, fecha }, ...this.recentAttendance].slice(0, 10);
        this.qrInput = '';
      }
    });
  }

  updateRowAttendance(item: any): void {
    if (!item || item.asistio) return;
    this.inscripcionesService.updateInscripcion(Number(item.id), { estado: 'ASISTIO' }).subscribe({
      next: () => {
        item.asistio = true;
        this.recomputeAttendanceStats();
        const fecha = new Date().toISOString();
        this.recentAttendance = [{ codigoEstudiante: item.codigoEstudiante, nombre: item.nombre, fecha }, ...this.recentAttendance].slice(0, 10);
      }
    });
  }

  parseQrToCode(value: string): string {
    const m = value.match(/\d{7,8}/);
    return m ? m[0] : '';
  }

  private recomputeAttendanceStats(): void {
    const total = this.attendanceForEvent.length;
    const asist = this.attendanceForEvent.filter(r => r.asistio).length;
    this.attendanceInscritos = total;
    this.attendanceAsistieron = asist;
    this.attendancePendientes = total - asist;
  }

  get filteredAttendance(): any[] {
    const q = (this.attendanceSearch || '').toLowerCase().trim();
    if (!q) return this.attendanceForEvent;
    return this.attendanceForEvent.filter(it =>
      String(it.codigoEstudiante || '').toLowerCase().includes(q) ||
      String(it.nombre || '').toLowerCase().includes(q)
    );
  }

  exportReport(event: any): void {
    const idNum = Number(event.id);
    this.inscripcionesService.getByEventoId(idNum).subscribe({
      next: (regs) => {
        const rows = [
          ['codigoEstudiante', 'nombre', 'apellidos', 'email', 'estado', 'fechaInscripcion', 'fechaConfirmacion']
        ];
        regs.forEach(r => rows.push([
          r.codigoEstudiante || r.codigoAlumno || '',
          r.nombreEstudiante || '',
          r.apellidosEstudiante || '',
          r.emailEstudiante || '',
          r.estado || '',
          r.fechaInscripcion || '',
          r.fechaConfirmacion || ''
        ]));
        const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '"')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_evento_${event.id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  sessionsByEvent: Record<string, { startDate: string; endDate: string; description: string }[]> = {};
  paymentMethodsByEvent: Record<string, string[]> = {};

  private loadSessions(): void {
    const ids = this.events.map(e => Number(e.id)).filter(n => !isNaN(n));
    ids.forEach(id => {
      this.fechaeventoService.getByEvento(id).subscribe({
        next: (items) => {
          const eid = String(id);
          this.sessionsByEvent[eid] = (items || []).map(d => ({
            startDate: d.fechaInicio,
            endDate: d.fechaFin,
            description: d.descripcion || ''
          }));
        }
      });
    });
  }

  private loadPaymentMethods(): void {
    const ids = this.events.map(e => Number(e.id)).filter(n => !isNaN(n));
    ids.forEach(id => {
      this.metodoPagoEventoService.getByEvento(id).subscribe({
        next: (items) => {
          const eid = String(id);
          const methods = (items || []).filter(m => m.activo).map(m => m.nombreMetodo);
          this.paymentMethodsByEvent[eid] = methods;
        },
        error: () => {
          const eid = String(id);
          this.paymentMethodsByEvent[eid] = [];
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    window.location.href = '/home';
  }

  // MEJORA: Mejorar la validación de imágenes
  getEventImage(event: any): string {
    console.log('🎯 [ADMIN] GetEventImage llamado para:', event.title);
    console.log('🎯 [ADMIN] Imagen del evento:', event.imageUrl);

    // SIEMPRE usar la imagen específica del evento
    if (event.imageUrl && event.imageUrl.trim() !== '' && event.imageUrl !== 'undefined') {
      console.log('✅ [ADMIN] Usando imagen específica del evento');
      return event.imageUrl;
    }

    console.log('⚠️ [ADMIN] Usando imagen por defecto');
    // Imagen por defecto diferente
    return 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400&h=200&fit=crop';
  }


  // MEJORA: Validación más robusta de URLs de imagen
  isValidImageUrl(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }

    // Verificar que sea una URL válida
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Verificar extensiones de imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasImageExtension = imageExtensions.some(ext =>
      url.toLowerCase().includes(ext)
    );

    // Verificar si es una URL de Unsplash
    const isUnsplashUrl = url.includes('unsplash.com');

    return hasImageExtension || isUnsplashUrl;
  }

  getDefaultEventImage(eventType: string): string {
    const defaultImages: { [key: string]: string } = {
      'academic': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
      'cultural': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop',
      'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop',
      'social': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop',
      'administrative': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=200&fit=crop'
    };
    return defaultImages[eventType] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop';
  }

  // En admin.ts - CORRIGE el método handleImageError
  handleImageError(event: any, eventItem: any) {
    console.log('❌ Error cargando imagen para:', eventItem.title, 'URL original:', eventItem.imageUrl);

    // Prevenir bucle infinito
    if (event.target.src.includes('default-event.jpg') || event.target.src.includes('1540575467063')) {
      console.log('🛑 Evitando bucle infinito - ya es imagen por defecto');
      return;
    }

    const defaultImage = this.getDefaultEventImage(eventItem.type);
    console.log('🔄 Cambiando a imagen por defecto:', defaultImage);

    // Cambiar la fuente solo si es diferente
    if (event.target.src !== defaultImage) {
      event.target.src = defaultImage;
    }
  }

  formatEventDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'ongoing': 'En curso',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }
  private mapTypeToBackend(type: string): string {
    const t = (type || '').toLowerCase();
    if (t === 'academic') return 'ACADEMICO';
    if (t === 'cultural') return 'CULTURAL';
    if (t === 'sports') return 'DEPORTIVO';
    if (t === 'administrative') return 'ADMINISTRATIVO';
    return 'SOCIAL';
  }
}

// src/app/components/student/student.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, UiEvent } from '../../../services/event.service';
import { InscripcionesService, InscripcionDTO } from '../../../services/inscripciones.service';
import { FechaeventoService } from '../../../services/fechaevento.service';
import { MetodoPagoEventoService } from '../../../services/metodo-pago-evento.service';
import { EstudianteUpeuService, EstudianteUpeuDTO } from '../../../services/estudiante-upeu.service';
import { PagosService } from '../../../services/pagos.service';

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  faculty: string;
  status: 'published' | 'draft';
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  isFree: boolean;
  price?: number;
  imageUrl?: string;
}

interface EventRegistration {
  id: string;
  eventId: string;
  studentCode: string;
  registeredAt: string;
  qrCode: string;
  attended: boolean;
  attendedAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentDate?: string;
}

interface StudentInfo {
  code: string;
  fullName: string;
  faculty: string;
  school: string;
  cycle: string;
  email: string;
}

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student.html'
})
export class Student implements OnInit {
  searchQuery: string = '';
  activeTab: string = 'available';
  qrDialogOpen: boolean = false;
  paymentDialogOpen: boolean = false;
  selectedQR: EventRegistration | null = null;
  selectedEventForPayment: Event | null = null;
  qrCodeDataUrl: string = '';
  selectedPaymentMethod: string = '';
  paymentReference: string = '';
  yapeNumber: string = '';
  profileDialogOpen: boolean = false;
  pendingEventForProfile: Event | null = null;

  private facultiesList: string[] = ['Ingeniería', 'Ciencias de la Salud', 'Ciencias Empresariales', 'Humanidades', 'Teología'];
  private schoolsByFaculty: { [key: string]: string[] } = {
    'Ingeniería': ['Ingeniería de Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial'],
    'Ciencias de la Salud': ['Medicina', 'Enfermería', 'Odontología'],
    'Ciencias Empresariales': ['Administración', 'Contabilidad', 'Marketing'],
    'Humanidades': ['Psicología', 'Educación', 'Comunicación'],
    'Teología': ['Teología', 'Música Sacra']
  };
  private cyclesList: string[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  student: StudentInfo = {
    code: '',
    fullName: '',
    faculty: '',
    school: '',
    cycle: '',
    email: ''
  };

  events: Event[] = [];

  registrations: EventRegistration[] = [];
  sessionsByEvent: Record<string, { startDate: string; endDate: string; description: string }[]> = {};

  get currentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  constructor(
    private eventService: EventService,
    private inscripcionesService: InscripcionesService,
    private fechaeventoService: FechaeventoService,
    private metodoPagoEventoService: MetodoPagoEventoService,
    private estudianteUpeuService: EstudianteUpeuService,
    private pagosService: PagosService
  ) {}

  ngOnInit(): void {
    const u = this.currentUser;
    this.student = {
      code: u?.codigoEstudiante ? String(u.codigoEstudiante) : '',
      fullName: u ? `${u.nombre} ${u.apellidos}` : '',
      faculty: '',
      school: '',
      cycle: '',
      email: u ? u.email : ''
    };
    this.ensureStudentProfile();
    this.loadStudentProfile();
    this.loadEvents();
    this.loadRegistrations();
    this.loadSessions();
    this.loadPaymentMethods();
    this.loadPagosConfig();
  }

  private loadStudentProfile(): void {
    const code = this.student.code;
    const email = this.student.email;
    if (code) {
      this.estudianteUpeuService.getByCodigo(code).subscribe({
        next: (match) => {
          if (match) {
            this.student = {
              code: match.codigoEstudiante || code,
              fullName: `${match.nombre || ''}${match.apellidos ? ' ' + match.apellidos : ''}`.trim(),
              faculty: match.facultad || '',
              school: match.escuelaProfesional || '',
              cycle: match.semestre || '',
              email: match.email || email
            };
          }
        },
        error: () => {}
      });
      return;
    }
    if (email) {
      this.estudianteUpeuService.getByEmail(email).subscribe({
        next: (match) => {
          if (match) {
            this.student = {
              code: match.codigoEstudiante || '',
              fullName: `${match.nombre || ''}${match.apellidos ? ' ' + match.apellidos : ''}`.trim(),
              faculty: match.facultad || '',
              school: match.escuelaProfesional || '',
              cycle: match.semestre || '',
              email: match.email || email
            };
          }
        },
        error: () => {}
      });
    }
  }

  private loadEvents(): void {
    this.eventService.getEventos().subscribe({
      next: (items) => {
        this.events = items.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.type,
          faculty: e.faculty,
          status: e.status === 'published' ? 'published' : 'draft',
          startDate: e.startDate,
          endDate: e.endDate,
          location: e.location,
          capacity: e.capacity,
          registeredCount: e.registeredCount,
          isFree: e.isFree,
          price: e.price,
          imageUrl: e.imageUrl
        }));
        this.loadPaymentMethods();
      }
    });
  }

  private loadRegistrations(): void {
    const uid = this.currentUser?.id;
    if (!uid) return;
    this.inscripcionesService.getByUsuarioId(uid).subscribe({
      next: (regs) => {
        this.registrations = regs.map(r => ({
          id: String(r.id),
          eventId: r.eventoId != null ? String(r.eventoId) : '',
          studentCode: r.codigoEstudiante || '',
          registeredAt: r.fechaInscripcion || '',
          qrCode: '',
          attended: (r.estado || '').toUpperCase() === 'ASISTIO',
          attendedAt: r.fechaConfirmacion || ''
        }));
        const counts: Record<string, number> = {};
        regs.forEach(r => {
          const eid = r.eventoId != null ? String(r.eventoId) : '';
          if (eid) counts[eid] = (counts[eid] || 0) + 1;
        });
        this.events = this.events.map(e => ({
          ...e,
          registeredCount: counts[e.id] || e.registeredCount
        }));
      }
    });
  }

  private loadSessions(): void {
    const ids = this.events.map(e => Number(e.id)).filter(n => !isNaN(n));
    const grouped: Record<string, { startDate: string; endDate: string; description: string }[]> = {};
    ids.forEach(id => {
      this.fechaeventoService.getByEvento(id).subscribe({
        next: (items) => {
          const eid = String(id);
          grouped[eid] = (items || []).map(d => ({
            startDate: d.fechaInicio,
            endDate: d.fechaFin,
            description: d.descripcion || ''
          }));
          this.sessionsByEvent = { ...this.sessionsByEvent, ...grouped };
        }
      });
    });
  }

  paymentMethodsByEvent: Record<string, string[]> = {};

  private loadPaymentMethods(): void {
    const ids = this.events.map(e => Number(e.id)).filter(n => !isNaN(n));
    ids.forEach(id => {
      this.metodoPagoEventoService.getByEvento(id).subscribe({
        next: (items) => {
          const eid = String(id);
          const methods = (items || []).filter(m => m.activo).map(m => m.nombreMetodo);
          this.paymentMethodsByEvent = { ...this.paymentMethodsByEvent, [eid]: methods };
        }
      });
    });
  }

  private ensurePaymentMethodsFor(eventId: string): void {
    const id = Number(eventId);
    if (isNaN(id)) return;
    this.metodoPagoEventoService.getByEvento(id).subscribe({
      next: (items) => {
        let methods = (items || []).filter(m => m.activo).map(m => m.nombreMetodo);
        if (!methods || methods.length === 0) {
          methods = ['efectivo'];
        }
        this.paymentMethodsByEvent = { ...this.paymentMethodsByEvent, [eventId]: methods };
        if (this.selectedEventForPayment && this.selectedEventForPayment.id === eventId) {
          this.selectedPaymentMethod = methods[0] || '';
        }
      }
    });
  }

  private loadPagosConfig(): void {
    this.pagosService.getConfig().subscribe({
      next: (cfg) => {
        this.yapeNumber = cfg.yapeNumber || '';
      }
    });
  }

  get myRegistrations(): EventRegistration[] {
    return this.registrations;
  }

  get myEventIds(): string[] {
    return this.registrations.map(r => r.eventId);
  }

  get filteredEvents(): Event[] {
    const q = (this.searchQuery || '').toLowerCase().trim();
    return this.events
      .filter(event => event.status === 'published')
      .map(e => {
        const sessions = this.getSessionsFor(e.id);
        if (sessions.length > 0) {
          const sorted = sessions
            .filter(s => !!s.startDate)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          const first = sorted[0];
          const lastEnd = sessions.reduce((acc, s) => {
            const t = new Date(s.endDate).getTime();
            return isNaN(t) ? acc : Math.max(acc, t);
          }, new Date(first?.startDate || e.startDate).getTime());
          return {
            ...e,
            startDate: first?.startDate || e.startDate,
            endDate: new Date(lastEnd).toISOString()
          };
        }
        return e;
      })
      .filter(e =>
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
  }

  get myEvents(): Event[] {
    return this.events.filter(e => this.myEventIds.includes(e.id));
  }

  get upcomingEvents(): Event[] {
    return this.myEvents.filter(e => new Date(e.startDate) > new Date());
  }

  get pastEvents(): Event[] {
    return this.myEvents.filter(e => new Date(e.startDate) <= new Date());
  }

  // Método para obtener registro de evento sin usar ! en template
  getRegistrationForEvent(eventId: string): EventRegistration | null {
    const registration = this.myRegistrations.find(r => r.eventId === eventId);
    return registration || null;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  handleRegister(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    if (event.registeredCount >= event.capacity) {
      console.log('El evento está lleno');
      return;
    }

    const needsProfile = !this.student.code || !this.student.faculty || !this.student.school || !this.student.cycle;
    if (needsProfile) {
      this.generateRandomStudentProfile();
      this.saveStudentProfile(() => {
        if (!event.isFree) {
          this.selectedEventForPayment = event;
          this.selectedPaymentMethod = '';
          this.paymentReference = '';
          this.paymentDialogOpen = true;
          this.ensurePaymentMethodsFor(eventId);
          return;
        }
        this.completeRegistration(eventId, event);
      });
      return;
    }

    if (!event.isFree) {
      this.selectedEventForPayment = event;
      this.selectedPaymentMethod = '';
      this.paymentReference = '';
      this.paymentDialogOpen = true;
      this.ensurePaymentMethodsFor(eventId);
      return;
    }

    this.completeRegistration(eventId, event);
  }

  completeRegistration(
    eventId: string,
    event: Event,
    paymentData?: {
      method: string;
      reference: string;
      amount: number;
    }
  ): void {
    const payload: Partial<InscripcionDTO> = {
      eventoId: Number(eventId),
      usuarioId: this.currentUser?.id,
      codigoAlumno: this.student.code || undefined,
      nombreEstudiante: this.student.fullName ? this.student.fullName.split(' ')[0] : undefined,
      apellidosEstudiante: this.student.fullName ? this.student.fullName.split(' ').slice(1).join(' ') : undefined,
      emailEstudiante: this.student.email || undefined,
      facultad: this.student.faculty || undefined,
      escuelaProfesional: this.student.school || undefined,
      semestre: this.student.cycle || undefined,
      metodoPago: paymentData?.method || undefined,
      numeroOperacion: paymentData?.reference || undefined
    };
    this.inscripcionesService.createInscripcion(payload).subscribe({
      next: (created) => {
        this.registrations = [
          ...this.registrations,
          {
            id: String(created.id),
            eventId: String(created.eventoId || eventId),
            studentCode: created.codigoEstudiante || '',
            registeredAt: created.fechaInscripcion || new Date().toISOString(),
            qrCode: '',
            attended: (created.estado || '').toUpperCase() === 'ASISTIO'
          }
        ];
        this.events = this.events.map(e =>
          e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
        );
      },
      error: (err) => {
        if (err?.status === 402) {
          alert(`Pago requerido. Número Yape: ${this.yapeNumber || 'N/D'}`);
        }
      }
    });
  }

  private generateRandomStudentProfile(): void {
    if (!this.student.code) {
      const year = new Date().getFullYear().toString();
      const rand = Math.floor(100000 + Math.random() * 900000).toString();
      this.student.code = year + rand.slice(0, 4);
    }
    if (!this.student.faculty || !this.student.school) {
      const f = this.facultiesList[Math.floor(Math.random() * this.facultiesList.length)];
      const schools = this.schoolsByFaculty[f] || [];
      const s = schools.length ? schools[Math.floor(Math.random() * schools.length)] : 'General';
      this.student.faculty = f;
      this.student.school = s;
    }
    if (!this.student.cycle) {
      this.student.cycle = this.cyclesList[Math.floor(Math.random() * this.cyclesList.length)];
    }
  }

  private ensureStudentProfile(): void {
    if (!this.student.code || !this.student.faculty || !this.student.school || !this.student.cycle) {
      this.generateRandomStudentProfile();
    }
  }

  confirmProfileAndProceed(): void {
    if (!this.student.faculty || !this.student.school || !this.student.cycle) { alert('Facultad, Escuela y Ciclo son obligatorios'); return; }
    const ev = this.pendingEventForProfile;
    if (!ev) { this.profileDialogOpen = false; return; }
    this.saveStudentProfile(() => {
      this.profileDialogOpen = false;
      if (!ev.isFree) {
        this.selectedEventForPayment = ev;
        this.selectedPaymentMethod = '';
        this.paymentReference = '';
        this.paymentDialogOpen = true;
        this.ensurePaymentMethodsFor(ev.id);
        return;
      }
      this.completeRegistration(ev.id, ev);
      this.pendingEventForProfile = null;
    });
  }

  private saveStudentProfile(onSuccess?: () => void): void {
    const nombre = (this.student.fullName || '').split(' ')[0] || 'Usuario';
    const apellidos = (this.student.fullName || '').split(' ').slice(1).join(' ') || '';
    const payload = {
      nombre,
      apellidos: apellidos || 'Estudiante',
      email: this.student.email || `user${Date.now()}@upeu.edu.pe`,
      facultad: this.student.faculty,
      escuelaProfesional: this.student.school,
      semestre: this.student.cycle,
      estado: true
    };

    const code = this.student.code;
    const obs = code && code.trim() !== ''
      ? this.estudianteUpeuService.update(code, payload)
      : this.estudianteUpeuService.create(payload);

    obs.subscribe({
      next: (res) => {
        this.student = {
          code: res.codigoEstudiante ? String(res.codigoEstudiante) : (this.student.code || ''),
          fullName: `${res.nombre || nombre}${res.apellidos ? ' ' + res.apellidos : ''}`.trim(),
          faculty: res.facultad || this.student.faculty,
          school: res.escuelaProfesional || this.student.school,
          cycle: res.semestre || this.student.cycle,
          email: res.email || this.student.email
        };
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        console.warn('No se pudo guardar el perfil de estudiante', err);
        if (onSuccess) onSuccess();
      }
    });
  }

  handlePaymentComplete(paymentData: {
    method: string;
    reference: string;
    amount: number;
  }): void {
    if (!this.selectedEventForPayment) return;
    if (!this.selectedPaymentMethod || !this.paymentReference) {
      alert('Método de pago y número de operación son obligatorios');
      return;
    }
    this.completeRegistration(this.selectedEventForPayment.id, this.selectedEventForPayment, {
      method: this.selectedPaymentMethod,
      reference: this.paymentReference,
      amount: this.selectedEventForPayment?.price || 0
    });
    this.selectedEventForPayment = null;
    this.paymentDialogOpen = false;
  }

  handleShowQR(registration: EventRegistration | null): void {
    if (!registration) return;

    this.selectedQR = registration;
    this.qrDialogOpen = true;

    // Simular generación de QR (en una app real usarías una librería QR)
    setTimeout(() => {
      this.qrCodeDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuKXj1FSIENvZGU8L3RleHQ+PC9zdmc+';
    }, 500);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSessionsFor(eventId: string): { startDate: string; endDate: string; description: string }[] {
    return this.sessionsByEvent[eventId] || [];
  }

  

  getPaymentMethodsFor(eventId: string): string[] {
    return this.paymentMethodsByEvent[eventId] || [];
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    window.location.href = '/home';
  }
}

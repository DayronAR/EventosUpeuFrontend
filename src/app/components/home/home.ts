// src/app/components/home/home.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService, UiEvent } from '../../../services/event.service';
import { FechaeventoService } from '../../../services/fechaevento.service';
import { InscripcionesService } from '../../../services/inscripciones.service';
import { MetodoPagoEventoService } from '../../../services/metodo-pago-evento.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  events: UiEvent[] = [];
  currentUser: any = null;
  searchQuery: string = '';
  typeFilter: string = 'all';
  activeTab: 'upcoming' | 'all' = 'upcoming';
  authDialogOpen: boolean = false;
  authTab: 'login' | 'register' = 'login';
  loginEmail: string = '';
  loginPassword: string = '';
  loginError: string = '';
  loginLoading: boolean = false;
  regNombreCompleto: string = '';
  regCodigoEstudiante: string = '';
  regEmail: string = '';
  regPassword: string = '';
  regConfirmPassword: string = '';
  regDni: string = '';
  regTelefono: string = '';
  regError: string = '';
  regLoading: boolean = false;
  detailOpen: boolean = false;
  detailEventId: string | null = null;

  constructor(
    private router: Router,
    private eventService: EventService,
    private authService: AuthService,
    private fechaeventoService: FechaeventoService,
    private inscripcionesService: InscripcionesService,
    private metodoPagoEventoService: MetodoPagoEventoService
  ) {}

  ngOnInit(): void {
    const u = localStorage.getItem('currentUser');
    this.currentUser = u ? JSON.parse(u) : null;
    this.eventService.getEventos().subscribe({
      next: (items) => {
        this.events = items.filter((e) => e.status === 'published');
        this.loadEventDates();
        this.loadCounts();
        this.loadPaymentMethods();
      },
    });
  }

  getDashboardRoute(): string {
    const rol = (this.currentUser?.rol || '').toUpperCase();
    if (rol.includes('ADMIN')) return '/admin';
    if (rol.includes('COORD')) return '/coordinator';
    return '/student';
  }

  getDashboardLabel(): string {
    const rol = (this.currentUser?.rol || '').toUpperCase();
    if (rol.includes('ADMIN')) return 'Ir a Admin';
    if (rol.includes('COORD')) return 'Ir a Coordinador';
    return 'Ir a Estudiante';
  }

  goToLogin() {
    this.router
      .navigate(['/login'])
      .then((success) => {
        if (!success) {
          this.tryAlternativeMethods();
        }
      })
      .catch((error) => {
        this.tryAlternativeMethods();
      });
  }

  private tryAlternativeMethods() {
    setTimeout(() => {
      this.router.navigateByUrl('/login').then((success) => {
        if (!success) {
          this.fallbackNavigation();
        }
      });
    }, 100);
  }

  private fallbackNavigation() {
    window.location.href = '/login';
  }

  private loadEventDates(): void {
    const ids = this.events.map((e) => Number(e.id)).filter((n) => !isNaN(n));
    ids.forEach((id) => {
      this.fechaeventoService.getByEvento(id).subscribe({
        next: (items) => {
          if (!items || items.length === 0) return;
          const sorted = items
            .filter((d) => !!d.fechaInicio)
            .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
          const start =
            sorted[0]?.fechaInicio || this.events.find((e) => e.id === String(id))?.startDate;
          const end = items.reduce((acc, d) => {
            const t = new Date(d.fechaFin).getTime();
            return isNaN(t) ? acc : Math.max(acc, t);
          }, new Date(start || new Date().toISOString()).getTime());
          this.events = this.events.map((e) =>
            e.id === String(id)
              ? {
                  ...e,
                  startDate: start || e.startDate,
                  endDate: new Date(end).toISOString(),
                  eventDates: items.map((d) => ({
                    startDate: d.fechaInicio,
                    endDate: d.fechaFin,
                    description: d.descripcion,
                  })),
                }
              : e
          );
        },
      });
    });
  }

  private loadCounts(): void {
    const ids = this.events.map((e) => Number(e.id)).filter((n) => !isNaN(n));
    ids.forEach((id) => {
      this.inscripcionesService.getByEventoId(id).subscribe({
        next: (regs) => {
          const count = (regs || []).length;
          this.events = this.events.map((e) =>
            e.id === String(id) ? { ...e, registeredCount: count } : e
          );
        },
      });
    });
  }

  paymentMethodsByEvent: Record<string, string[]> = {};

  private loadPaymentMethods(): void {
    const ids = this.events.map((e) => Number(e.id)).filter((n) => !isNaN(n));
    ids.forEach((id) => {
      this.metodoPagoEventoService.getByEvento(id).subscribe({
        next: (items) => {
          const eid = String(id);
          let methods = (items || []).filter((m) => m.activo).map((m) => m.nombreMetodo);
          if (!methods || methods.length === 0) {
            methods = ['Efectivo'];
          }
          this.paymentMethodsByEvent = { ...this.paymentMethodsByEvent, [eid]: methods };
        },
      });
    });
  }

  openDetail(eventId: string): void {
    this.detailEventId = eventId;
    this.detailOpen = true;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detailEventId = null;
  }

  get detailEvent(): UiEvent | null {
    if (!this.detailEventId) return null;
    return this.events.find((e) => e.id === this.detailEventId) || null;
  }

  get detailSessions(): any[] {
    const ev = this.detailEvent;
    return (ev?.eventDates || []) as any[];
  }

  get detailMethods(): string[] {
    const id = this.detailEventId;
    if (!id) return [];
    return this.paymentMethodsByEvent[id] || [];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) +
      ' ' +
      date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    );
  }

  formatRange(start?: string, end?: string): string {
    if (!start) return '';
    const s = new Date(start);
    const e = end ? new Date(end) : undefined;
    const sDate = s.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const sTime = s.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (!e) return `${sDate}, ${sTime}`;
    const eTime = e.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${sDate}, ${sTime}–${eTime}`;
  }

  getFirstSession(
    eventId: string
  ): { startDate: string; endDate: string; description: string } | null {
    const ev = this.events.find((e) => e.id === eventId);
    const arr: any[] = (ev?.eventDates || []) as any[];
    if (!arr || arr.length === 0) return null;
    return arr[0];
  }

  getSessionsCount(eventId: string): number {
    const ev = this.events.find((e) => e.id === eventId);
    const arr: any[] = (ev?.eventDates || []) as any[];
    return arr.length || 0;
  }

  openAuth(tab: 'login' | 'register') {
    this.authTab = tab;
    this.authDialogOpen = true;
    this.loginError = '';
    this.regError = '';
  }

  closeAuth() {
    this.authDialogOpen = false;
  }

  submitLogin(e: Event) {
    e.preventDefault();
    this.loginError = '';
    this.loginLoading = true;
    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (user) => {
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'coordinator':
            this.router.navigate(['/coordinator']);
            break;
          case 'student':
            this.router.navigate(['/student']);
            break;
          default:
            this.router.navigate(['/home']);
        }
        this.loginLoading = false;
        this.authDialogOpen = false;
      },
      error: (err) => {
        const msg =
          typeof err?.error === 'string' ? err.error : err?.error?.message || err?.message || '';
        this.loginError = msg || 'Credenciales incorrectas';
        this.loginLoading = false;
      },
    });
  }

  submitRegister(e: Event) {
    e.preventDefault();
    this.regError = '';
    if ((this.regPassword || '') !== (this.regConfirmPassword || '')) {
      this.regError = 'Las contraseñas no coinciden';
      return;
    }
    const nombreCompletoVal = (this.regNombreCompleto || '').trim();
    const codigoValStr = String(this.regCodigoEstudiante || '').trim();
    const emailVal = (this.regEmail || '').trim();
    const passwordVal = (this.regPassword || '').trim();
    if (!nombreCompletoVal || !codigoValStr || !emailVal || !passwordVal) {
      this.regError = 'Completa todos los campos obligatorios';
      return;
    }
    const codigoOk = /^\d{7,8}$/.test(codigoValStr);
    if (!codigoOk) {
      this.regError = 'Código de Estudiante debe tener 7-8 dígitos';
      return;
    }
    const emailOk = /@upeu\.edu\.pe$/i.test(emailVal);
    if (!emailOk) {
      this.regError = 'Usa tu correo institucional @upeu.edu.pe';
      return;
    }
    if ((passwordVal || '').length < 6) {
      this.regError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    this.regLoading = true;
    const nombreTrim = nombreCompletoVal.replace(/\s+/g, ' ');
    const parts = nombreTrim.split(' ');
    const nombre = parts.shift() || '';
    const apellidos = parts.join(' ');
    const apellidosOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,}$/.test(apellidos);
    if (!apellidosOk) {
      this.regError = 'Apellidos inválidos';
      this.regLoading = false;
      return;
    }
    const payload: any = {
      nombre,
      apellidos,
      codigoEstudiante: codigoValStr,
      email: emailVal,
      password: passwordVal,
      rol: 'ESTUDIANTE',
    };
    const dniVal = (this.regDni || '').trim();
    const telVal = (this.regTelefono || '').trim();
    if (dniVal) payload.dni = dniVal;
    if (telVal) payload.telefono = telVal;
    this.authService.register(payload).subscribe({
      next: (user) => {
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'coordinator':
            this.router.navigate(['/coordinator']);
            break;
          case 'student':
          default:
            this.router.navigate(['/student']);
        }
        this.regLoading = false;
        this.authDialogOpen = false;
      },
      error: (err) => {
        const msg =
          typeof err?.error === 'string' ? err.error : err?.error?.message || err?.message || '';
        this.regError = msg || 'No se pudo registrar';
        this.regLoading = false;
      },
    });
  }

  fillTest(role: 'admin' | 'student') {
    const credentials: any = {
      admin: { email: 'admin@upeu.edu.pe', password: 'admin123' },
      student: { email: '2020001@upeu.edu.pe', password: 'student123' },
    };
    this.loginEmail = credentials[role].email;
    this.loginPassword = credentials[role].password;
    this.loginError = '';
  }

  setActiveTab(tab: 'upcoming' | 'all') {
    this.activeTab = tab;
  }

  get filteredEvents(): UiEvent[] {
    const query = (this.searchQuery || '').toLowerCase();
    const type = (this.typeFilter || 'all').toLowerCase();
    return this.events
      .filter((e) => e.status === 'published')
      .filter((e) => (type === 'all' ? true : e.type.toLowerCase() === type))
      .filter((e) => {
        if (!query) return true;
        return (
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.type.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  get upcomingEvents(): UiEvent[] {
    const now = new Date();
    return this.filteredEvents.filter((e) => new Date(e.startDate) > now);
  }

  get displayEvents(): UiEvent[] {
    const list = this.activeTab === 'upcoming' ? this.upcomingEvents : this.filteredEvents;
    return list;
  }
}

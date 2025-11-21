// src/app/components/admin/create-event-dialog.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  faculty: string;
  school: string;
  targetCycles: string[];
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl: string;
  isFree: boolean;
  price: number;
  acceptedPaymentMethods: string[];
  eventDates?: EventDate[];
  createdAt: string;
  createdBy: string;
  registeredCount: number;
}

interface EventDate {
  id: string;
  startDate: string;
  endDate: string;
  location: string;
}

@Component({
  selector: 'app-create-event-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './createevento.html'
})
export class Createevento implements OnInit, OnChanges { // ← Agrega las interfaces
  @Input() open: boolean = false;
  @Input() event?: Event;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<any>();

  // Datos estáticos
  eventTypes = [
    { value: 'academic', label: 'Académico' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'administrative', label: 'Administrativo' },
    { value: 'sports', label: 'Deportivo' },
    { value: 'social', label: 'Social' }
  ];

  paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' }
  ];

  faculties = [
    'Ingeniería',
    'Ciencias de la Salud',
    'Ciencias Empresariales',
    'Humanidades',
    'Teología'
  ];

  schoolsByFaculty: { [key: string]: string[] } = {
    'Ingeniería': ['Ingeniería de Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial'],
    'Ciencias de la Salud': ['Medicina', 'Enfermería', 'Odontología'],
    'Ciencias Empresariales': ['Administración', 'Contabilidad', 'Marketing'],
    'Humanidades': ['Psicología', 'Educación', 'Comunicación'],
    'Teología': ['Teología', 'Música Sacra']
  };

  cycles = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  // Datos del formulario
  formData = {
    title: '',
    description: '',
    type: 'academic',
    faculty: '',
    school: '',
    targetCycles: [] as string[],
    startDate: '',
    endDate: '',
    location: '',
    capacity: 100,
    status: 'draft' as Event['status'],
    imageUrl: '',
    isFree: true,
    price: 0,
    acceptedPaymentMethods: [] as string[]
  };

  selectedFaculty: string = '';
  eventDates: EventDate[] = [];
  newEventDate = {
    startDate: '',
    endDate: '',
    location: ''
  };
  toasts: { text: string; type: 'success' | 'error' | 'info'; ts: number }[] = [];

  // En createevento.ts - MEJORA los métodos de ciclo de vida
  ngOnInit() {
    console.log('🎯 CreateEvento OnInit - Event recibido:', this.event);
    console.log('🎯 CreateEvento OnInit - Open:', this.open);

    if (this.event) {
      this.loadEventData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 CreateEvento OnChanges - Cambios detectados:', changes);
    console.log('🔄 CreateEvento OnChanges - Event actual:', this.event);
    console.log('🔄 CreateEvento OnChanges - Open actual:', this.open);

    if (changes['event']) {
      const previousEvent = changes['event'].previousValue;
      const currentEvent = changes['event'].currentValue;

      console.log('📊 Cambio en event - Anterior:', previousEvent);
      console.log('📊 Cambio en event - Actual:', currentEvent);

      if (currentEvent) {
        console.log('✅ Cargando datos del evento para editar');
        this.loadEventData();
      } else {
        console.log('🆕 Reseteando formulario para nuevo evento');
        this.resetForm();
      }
    }

    if (changes['open']) {
      console.log('🚪 Cambio en open:', changes['open'].currentValue);
    }
  }

  loadEventData() {
    if (!this.event) {
      console.log('❌ No hay evento para cargar');
      return;
    }

    console.log('📥 Cargando datos del evento:', this.event);

    this.formData = {
      title: this.event.title || '',
      description: this.event.description || '',
      type: this.event.type || 'academic',
      faculty: this.event.faculty || '',
      school: this.event.school || '',
      targetCycles: this.event.targetCycles ? [...this.event.targetCycles] : [],
      startDate: this.formatDateForInput(this.event.startDate),
      endDate: this.formatDateForInput(this.event.endDate),
      location: this.event.location || '',
      capacity: this.event.capacity || 100,
      status: this.event.status || 'draft',
      imageUrl: this.event.imageUrl || '',
      isFree: this.event.isFree ?? true,
      price: this.event.price || 0,
      acceptedPaymentMethods: this.event.acceptedPaymentMethods ? [...this.event.acceptedPaymentMethods] : []
    };

    this.selectedFaculty = this.event.faculty || '';
    this.eventDates = this.event.eventDates ? [...this.event.eventDates] : [];
    this.newEventDate = { startDate: '', endDate: '', location: '' };

    console.log('✅ Formulario cargado:', this.formData);
    console.log('✅ Faculty seleccionada:', this.selectedFaculty);
    console.log('✅ Event dates cargadas:', this.eventDates);
  }

  private formatDateForInput(isoDate: string): string {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  }

  resetForm() {
    console.log('Reseteando formulario para nuevo evento');
    this.formData = {
      title: '',
      description: '',
      type: 'academic',
      faculty: '',
      school: '',
      targetCycles: [],
      startDate: '',
      endDate: '',
      location: '',
      capacity: 100,
      status: 'draft',
      imageUrl: '',
      isFree: true,
      price: 0,
      acceptedPaymentMethods: []
    };
    this.selectedFaculty = '';
    this.eventDates = [];
    this.newEventDate = { startDate: '', endDate: '', location: '' };
  }

  // En createevento.ts - REEMPLAZA el método handleSubmit
  handleSubmit(e: any) {
    e.preventDefault();

    if (!this.formData.title || !this.formData.faculty || !this.formData.school ||
      !this.formData.startDate || !this.formData.endDate) {
      this.showToast('Completa todos los campos obligatorios', 'error');
      return;
    }

    if (this.formData.targetCycles.length === 0) {
      this.showToast('Selecciona al menos un ciclo objetivo', 'error');
      return;
    }

    if (!this.formData.isFree && (!this.formData.price || this.formData.price <= 0)) {
      this.showToast('Para eventos de pago, el precio debe ser mayor a 0', 'error');
      return;
    }

    // DEBUG: Verificar la imagen antes de enviar
    console.log('🔍 [CREATEVENTO] Imagen en formulario:', this.formData.imageUrl);
    console.log('🔍 [CREATEVENTO] Todos los datos:', this.formData);

    const eventData = {
      ...this.formData,
      startDate: new Date(this.formData.startDate).toISOString(),
      endDate: new Date(this.formData.endDate).toISOString(),
      eventDates: this.eventDates.length > 0 ? this.eventDates : undefined
    };

    console.log('🚀 [CREATEVENTO] Enviando al admin:', eventData);

    this.onSave.emit(eventData);
  }

  handleAddEventDate() {
    if (!this.newEventDate.startDate || !this.newEventDate.endDate) {
      this.showToast('Completa las fechas de inicio y fin', 'error');
      return;
    }

    const eventDate: EventDate = {
      id: Math.random().toString(),
      startDate: new Date(this.newEventDate.startDate).toISOString(),
      endDate: new Date(this.newEventDate.endDate).toISOString(),
      location: this.newEventDate.location || this.formData.location
    };

    this.eventDates = [...this.eventDates, eventDate];
    this.newEventDate = { startDate: '', endDate: '', location: '' };
    this.showToast('Fecha agregada', 'success');
  }

  handleRemoveEventDate(id: string) {
    this.eventDates = this.eventDates.filter(d => d.id !== id);
    this.showToast('Fecha eliminada', 'success');
  }

  private showToast(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const ts = Date.now();
    this.toasts = [...this.toasts, { text, type, ts }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.ts !== ts);
    }, 3000);
  }

  handleCycleToggle(cycle: string) {
    const index = this.formData.targetCycles.indexOf(cycle);
    if (index > -1) {
      this.formData.targetCycles.splice(index, 1);
    } else {
      this.formData.targetCycles.push(cycle);
    }
  }

  handlePaymentMethodToggle(method: string) {
    const index = this.formData.acceptedPaymentMethods.indexOf(method);
    if (index > -1) {
      this.formData.acceptedPaymentMethods.splice(index, 1);
    } else {
      this.formData.acceptedPaymentMethods.push(method);
    }
  }

  selectAllCycles() {
    this.formData.targetCycles = [...this.cycles];
  }

  clearAllCycles() {
    this.formData.targetCycles = [];
  }

  handleFacultyChange(faculty: string) {
    this.selectedFaculty = faculty;
    this.formData.faculty = faculty;
    this.formData.school = '';
  }

  getSchoolsForFaculty(): string[] {
    return this.schoolsByFaculty[this.selectedFaculty] || [];
  }

  formatEventDate(date: EventDate, index: number): string {
    try {
      const startDate = new Date(date.startDate);
      const endDate = new Date(date.endDate);

      return `Sesión ${index + 1}: ${startDate.toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })} - ${endDate.toLocaleString('es-ES', { timeStyle: 'short' })}`;
    } catch (error) {
      return `Sesión ${index + 1}: Fecha inválida`;
    }
  }

  closeDialog() {
    this.openChange.emit(false);
  }
  //7///
  // Agrega estas propiedades
  imagePreview: string | null = null;
  imageLoadOk: boolean | null = null;

  handleImageLoad() {
    this.imageLoadOk = true;
  }

  handleImageError(event: any) {
    this.imageLoadOk = false;
    event.target.style.display = 'none';
  }

  isImageValid(url: string): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    if (u.startsWith('data:image')) return true;
    return /^https?:\/\//.test(url);
  }

  // Método para cargar imagen por defecto si no hay
  getEventImage(): string {
    if (this.formData.imageUrl && this.isImageValid(this.formData.imageUrl)) {
      return this.formData.imageUrl;
    }
    // Imagen por defecto basada en el tipo de evento
    const defaultImages: { [key: string]: string } = {
      'academic': '/assets/default-academic.jpg',
      'cultural': '/assets/default-cultural.jpg',
      'sports': '/assets/default-sports.jpg',
      'social': '/assets/default-social.jpg',
      'administrative': '/assets/default-admin.jpg'
    };
    return defaultImages[this.formData.type] || '/assets/default-event.jpg';
  }
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

export interface EventoDTO {
  id?: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  categoria?: string;
  ubicacion: string;
  capacidad: number;
  esPago: boolean;
  precio: number;
  imagenUrl?: string;
  estado?: boolean;
  creadoPorId?: number;
  createdAt?: string;
}

export interface UiEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  faculty: string;
  status: 'published' | 'draft' | 'ongoing' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  isPaid: boolean;
  createdAt: string;
  createdBy: string;
  school: string;
  targetCycles: string[];
  imageUrl: string;
  isFree: boolean;
  price: number;
  acceptedPaymentMethods: string[];
  eventDates: any[];
}

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private http: HttpClient) {}

  getEventos(): Observable<UiEvent[]> {
    return this.http.get<EventoDTO[]>(`${environment.apiUrl}/eventos`).pipe(
      map(items => items.map(e => this.toUiEvent(e)))
    );
  }

  createEvento(payload: EventoDTO): Observable<UiEvent> {
    return this.http.post<EventoDTO>(`${environment.apiUrl}/eventos`, payload).pipe(
      map(e => this.toUiEvent(e))
    );
  }

  updateEvento(id: number, payload: EventoDTO): Observable<UiEvent> {
    return this.http.put<EventoDTO>(`${environment.apiUrl}/eventos/${id}`, payload).pipe(
      map(e => this.toUiEvent(e))
    );
  }

  deleteEvento(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/eventos/${id}`);
  }

  toUiEvent(e: EventoDTO): UiEvent {
    const estadoPublicado = e.estado === true;
    return {
      id: String(e.id ?? ''),
      title: e.nombre,
      description: e.descripcion,
      type: this.mapTipoToUi(e.tipo),
      faculty: '',
      status: estadoPublicado ? 'published' : 'draft',
      startDate: e.createdAt ?? new Date().toISOString(),
      endDate: e.createdAt ?? new Date().toISOString(),
      location: e.ubicacion,
      capacity: e.capacidad,
      registeredCount: 0,
      isPaid: e.esPago,
      createdAt: e.createdAt ?? new Date().toISOString(),
      createdBy: String(e.creadoPorId ?? ''),
      school: '',
      targetCycles: [],
      imageUrl: e.imagenUrl ?? '',
      isFree: !e.esPago,
      price: e.precio,
      acceptedPaymentMethods: [],
      eventDates: []
    };
  }

  mapTipoToUi(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('aca')) return 'academic';
    if (t.includes('cult')) return 'cultural';
    if (t.includes('dep') || t.includes('sport')) return 'sports';
    if (t.includes('adm')) return 'administrative';
    return 'social';
  }
}
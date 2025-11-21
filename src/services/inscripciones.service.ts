import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface InscripcionDTO {
  id: number;
  eventoId?: number;
  usuarioId?: number;
  confirmadoPorId?: number;
  pagoId?: number;
  codigoEstudiante?: string;
  codigoAlumno?: string;
  nombreEstudiante?: string;
  apellidosEstudiante?: string;
  emailEstudiante?: string;
  facultad?: string;
  escuelaProfesional?: string;
  semestre?: string;
  estado?: string;
  metodoPago?: string;
  numeroOperacion?: string;
  esInscripcionMasiva?: string;
  fechaInscripcion?: string;
  fechaConfirmacion?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class InscripcionesService {
  constructor(private http: HttpClient) {}

  getInscripciones(): Observable<InscripcionDTO[]> {
    return this.http.get<InscripcionDTO[]>(`${environment.apiUrl}/inscripciones`);
  }

  createInscripcion(payload: Partial<InscripcionDTO>): Observable<InscripcionDTO> {
    return this.http.post<InscripcionDTO>(`${environment.apiUrl}/inscripciones`, payload);
  }

  bulkInscribir(eventoId: number, codigos: string[]): Observable<InscripcionDTO[]> {
    return this.http.post<InscripcionDTO[]>(`${environment.apiUrl}/inscripciones/bulk`, {
      eventoId,
      codigos
    });
  }

  getByUsuarioId(usuarioId: number): Observable<InscripcionDTO[]> {
    return this.http.get<InscripcionDTO[]>(`${environment.apiUrl}/inscripciones`, {
      params: { usuarioId: String(usuarioId) }
    });
  }

  getByEventoId(eventoId: number): Observable<InscripcionDTO[]> {
    return this.http.get<InscripcionDTO[]>(`${environment.apiUrl}/inscripciones`, {
      params: { eventoId: String(eventoId) }
    });
  }

  updateInscripcion(id: number, payload: Partial<InscripcionDTO>): Observable<InscripcionDTO> {
    return this.http.patch<InscripcionDTO>(`${environment.apiUrl}/inscripciones/${id}`, payload);
  }
}
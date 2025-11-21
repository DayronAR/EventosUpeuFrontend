import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface EstudianteUpeuDTO {
  codigoEstudiante?: string;
  nombre: string;
  apellidos?: string;
  email: string;
  facultad?: string;
  escuelaProfesional?: string;
  semestre?: string;
  telefono?: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EstudianteUpeuService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<EstudianteUpeuDTO[]> {
    return this.http.get<EstudianteUpeuDTO[]>(`${environment.apiUrl}/estudiantes-upeu`);
  }

  getByCodigo(codigo: string): Observable<EstudianteUpeuDTO> {
    return this.http.get<EstudianteUpeuDTO>(`${environment.apiUrl}/estudiantes-upeu/${codigo}`);
  }

  getByEmail(email: string): Observable<EstudianteUpeuDTO> {
    return this.http.get<EstudianteUpeuDTO>(`${environment.apiUrl}/estudiantes-upeu/by-email/${encodeURIComponent(email)}`);
  }

  create(payload: Partial<EstudianteUpeuDTO> & { nombre: string; apellidos: string; email: string; estado?: boolean }): Observable<EstudianteUpeuDTO> {
    const body = { ...payload, estado: payload.estado ?? true };
    return this.http.post<EstudianteUpeuDTO>(`${environment.apiUrl}/estudiantes-upeu`, body);
  }

  update(codigo: string | number, payload: Partial<EstudianteUpeuDTO> & { nombre: string; apellidos: string; email: string; estado?: boolean }): Observable<EstudianteUpeuDTO> {
    const body = { ...payload, estado: payload.estado ?? true };
    return this.http.put<EstudianteUpeuDTO>(`${environment.apiUrl}/estudiantes-upeu/${codigo}`, body);
  }
}
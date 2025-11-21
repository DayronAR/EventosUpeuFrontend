import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface FechaeventoDTO {
  id?: number;
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
  eventoId: number;
}

@Injectable({ providedIn: 'root' })
export class FechaeventoService {
  constructor(private http: HttpClient) {}

  create(payload: FechaeventoDTO): Observable<FechaeventoDTO> {
    return this.http.post<FechaeventoDTO>(`${environment.apiUrl}/fechaevento`, payload);
  }

  getAll(): Observable<FechaeventoDTO[]> {
    return this.http.get<FechaeventoDTO[]>(`${environment.apiUrl}/fechaevento`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/fechaevento/${id}`);
  }

  getByEvento(eventoId: number): Observable<FechaeventoDTO[]> {
    return this.http.get<FechaeventoDTO[]>(`${environment.apiUrl}/fechaevento`, {
      params: { eventoId: String(eventoId) }
    });
  }
}
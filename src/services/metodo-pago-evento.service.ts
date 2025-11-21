import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface MetodoPagoEventoDTO {
  id?: number;
  nombreMetodo: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  eventoId: number;
}

@Injectable({ providedIn: 'root' })
export class MetodoPagoEventoService {
  constructor(private http: HttpClient) {}

  create(payload: MetodoPagoEventoDTO): Observable<MetodoPagoEventoDTO> {
    return this.http.post<MetodoPagoEventoDTO>(`${environment.apiUrl}/metodo-pagos-eventos`, payload);
  }

  getAll(): Observable<MetodoPagoEventoDTO[]> {
    return this.http.get<MetodoPagoEventoDTO[]>(`${environment.apiUrl}/metodo-pagos-eventos`);
  }

  getByEvento(eventoId: number): Observable<MetodoPagoEventoDTO[]> {
    return this.http.get<MetodoPagoEventoDTO[]>(`${environment.apiUrl}/metodo-pagos-eventos`, {
      params: { eventoId: String(eventoId) }
    });
  }
}
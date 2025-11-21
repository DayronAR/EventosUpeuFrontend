import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

export interface UsuarioDTO {
  id?: number;
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  rol: string;
  codigoEstudiante?: string;
  dni?: string;
  telefono?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface UsuariosStatsDTO {
  total: number;
  admin: number;
  coordinator: number;
  student: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  list(params?: { search?: string; role?: string; page?: number; size?: number }): Observable<any> {
    const options: any = { headers: this.headers(), params: {}, observe: 'body' };
    if (params?.search) options.params.search = params.search;
    if (params?.role) options.params.role = params.role;
    if (typeof params?.page === 'number') options.params.page = String(params.page);
    if (typeof params?.size === 'number') options.params.size = String(params.size);
    return this.http.get(`${environment.apiUrl}/usuarios`, options);
  }

  getById(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${environment.apiUrl}/usuarios/${id}`, {
      headers: this.headers(),
    });
  }

  create(payload: UsuarioDTO): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(`${environment.apiUrl}/usuarios`, payload, {
      headers: this.headers(),
    });
  }

  update(id: number, payload: Partial<UsuarioDTO>): Observable<UsuarioDTO> {
    return this.http.put<UsuarioDTO>(`${environment.apiUrl}/usuarios/${id}`, payload, {
      headers: this.headers(),
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/${id}`, {
      headers: this.headers(),
    });
  }

  stats(): Observable<UsuariosStatsDTO> {
    return this.http.get<UsuariosStatsDTO>(`${environment.apiUrl}/usuarios/stats`, {
      headers: this.headers(),
    });
  }
}

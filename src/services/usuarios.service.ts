import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  email: string;
  codigoEstudiante: string;
  nombre: string;
  apellidos: string;
  rol: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private http: HttpClient) {}

  getEstudiantes() {
    return this.http.get<any[]>(
      `${environment.apiUrl}/usuarios/estudiantes`
    );
  }
}

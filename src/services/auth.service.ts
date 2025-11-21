// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  role: string;
  activo: boolean;
  codigoEstudiante?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  // ✅ Agrega este método que falta
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(email: string, password: string) {
    const url = `${environment.apiUrl}/auth/login`;
    return this.http
      .post<{
        token: string;
        expiresIn: number;
        userId: number;
        email: string;
        nombre: string;
        rol: string;
        apellidos?: string;
        codigoEstudiante?: string;
      }>(url, { email, password })
      .pipe(
        map((res) => {
          localStorage.setItem('token', res.token);
          const mappedUser: User = {
            id: res.userId,
            email: res.email,
            nombre: res.nombre,
            apellidos: res.apellidos ?? '',
            role: this.mapRole(res.rol),
            activo: true,
            codigoEstudiante: res.codigoEstudiante
          };
          localStorage.setItem('currentUser', JSON.stringify(mappedUser));
          this.currentUserSubject.next(mappedUser);
          return mappedUser;
        })
      );
  }

  register(payload: {
    nombre: string;
    apellidos: string;
    codigoEstudiante: string;
    email: string;
    password: string;
    dni?: string;
    telefono?: string;
    rol?: string;
  }) {
    const url = `${environment.apiUrl}/auth/register`;
    return this.http
      .post<{
        token: string;
        expiresIn: number;
        userId: number;
        email: string;
        nombre: string;
        rol: string;
        apellidos?: string;
        codigoEstudiante?: string;
      }>(url, payload)
      .pipe(
        map((res) => {
          localStorage.setItem('token', res.token);
          const mappedUser: User = {
            id: res.userId,
            email: res.email,
            nombre: res.nombre,
            apellidos: res.apellidos ?? '',
            role: this.mapRole(res.rol),
            activo: true,
            codigoEstudiante: res.codigoEstudiante
          };
          localStorage.setItem('currentUser', JSON.stringify(mappedUser));
          this.currentUserSubject.next(mappedUser);
          return mappedUser;
        })
      );
  }

  private mapRole(backendRol: string): string {
    const r = (backendRol || '').toUpperCase();
    if (r === 'ADMIN') return 'admin';
    if (r === 'COORDINATOR' || r === 'COORDINADOR') return 'coordinator';
    if (r === 'USER' || r === 'ESTUDIANTE' || r === 'STUDENT') return 'student';
    return 'student';
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // ✅ Limpia también el token
    this.currentUserSubject.next(null);
  }
}

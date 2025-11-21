import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  nombre = '';
  apellidos = '';
  codigoEstudiante: string = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;
    const nombreVal = (this.nombre || '').trim();
    const apellidosVal = (this.apellidos || '').trim();
    const codigoVal = String(this.codigoEstudiante || '').trim();
    const emailVal = (this.email || '').trim();
    const passwordVal = (this.password || '').trim();

    if (!nombreVal || !apellidosVal || !codigoVal || !emailVal || !passwordVal) {
      this.error = 'Completa todos los campos obligatorios';
      this.loading = false;
      return;
    }
    const codigoOk = /^\d{7,8}$/.test(codigoVal);
    if (!codigoOk) {
      this.error = 'Código de Estudiante debe tener 7-8 dígitos';
      this.loading = false;
      return;
    }
    const emailOk = /@upeu\.edu\.pe$/i.test(emailVal);
    if (!emailOk) {
      this.error = 'Usa tu correo institucional @upeu.edu.pe';
      this.loading = false;
      return;
    }
    const apellidosOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,}$/.test(apellidosVal);
    if (!apellidosOk) {
      this.error = 'Apellidos inválidos';
      this.loading = false;
      return;
    }
    if ((passwordVal || '').length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      this.loading = false;
      return;
    }

    const payload = {
      nombre: nombreVal,
      apellidos: apellidosVal,
      codigoEstudiante: codigoVal,
      email: emailVal,
      password: passwordVal,
      rol: 'ESTUDIANTE'
    };
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
        this.loading = false;
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message || err?.message || '';
        this.error = msg || 'No se pudo registrar. Verifica los datos.';
        this.loading = false;
      },
    });
  }
}

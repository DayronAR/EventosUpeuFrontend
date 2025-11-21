// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    protected router: Router
  ) {}

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'coordinator':
            this.router.navigate(['/coordinator']);
            break;
          case 'student':
            this.router.navigate(['/student']);
            break;
          default:
            this.router.navigate(['/home']);
        }
        this.loading = false;
      },
      error: (err) => {
        const msg = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.message || '';
        this.error = msg || 'Credenciales incorrectas. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }


}

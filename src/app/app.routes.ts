// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RoleGuard } from '../guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  // Dashboards por rol
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin').then(m => m.Admin),
    canActivate: [RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'student',
    loadComponent: () => import('./components/student/student').then(m => m.Student),
    canActivate: [RoleGuard],
    data: { role: 'student' }
  },
  {
    path: 'coordinator',
    loadComponent: () => import('./components/coordinator/coordinator').then(m => m.Coordinator),
    canActivate: [RoleGuard],
    data: { role: 'coordinator' }
  },



  { path: '**', redirectTo: '/home' }
];

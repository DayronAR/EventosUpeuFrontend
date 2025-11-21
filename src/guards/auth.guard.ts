// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}

// Guard para roles específicos
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole = route.data['role'];
    const user = this.authService.getCurrentUser();
    if (this.authService.isAuthenticated() && user?.role === expectedRole) {
      return true;
    }
    if (this.authService.isAuthenticated()) {
      const role = user?.role || 'student';
      const redirect = role === 'admin' ? '/admin' : role === 'coordinator' ? '/coordinator' : '/student';
      this.router.navigate([redirect]);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}

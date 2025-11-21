// src/app/components/coordinator/coordinator.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-coordinator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coordinator.html'
})
export class Coordinator {
  logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/home';
  }
}

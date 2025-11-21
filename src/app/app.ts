// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // ← SOLO RouterOutlet
  template: `<router-outlet></router-outlet>` // ← SOLO esto
})
export class App {

}

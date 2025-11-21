import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {InscripcionesService} from '../../../../services/inscripciones.service';

@Component({
  standalone: true,
  selector: 'app-registrar-masivo',
  templateUrl: './registrar-masivo.component.html',
  imports: [CommonModule, FormsModule]
})
export class RegistrarMasivoComponent {

  codigosTexto: string = '';
  listaCodigos: string[] = [];
  validos: string[] = [];
  invalidos: string[] = [];
  cantidadValidos: number = 0;

  constructor(private insService: InscripcionesService) {}

  procesarTexto() {
    this.listaCodigos = this.codigosTexto
      .split(/[\n,; ]+/)
      .map(x => x.trim())
      .filter(x => x.length > 0);
  }

  validar() {
    this.procesarTexto();

    this.insService.validarCodigos(this.listaCodigos).subscribe(res => {
      this.validos = res.validos;
      this.invalidos = res.invalidos;
      this.cantidadValidos = res.cantidadValidos;
    });
  }
}

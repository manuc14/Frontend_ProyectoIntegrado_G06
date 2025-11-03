import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Contenido } from '../../../core/models/contenido.models';

@Component({
  selector: 'app-content-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss']
})
export class ContentCardComponent {
  @Input() contenido!: Contenido;

  /**
   * Convierte la duración en minutos a formato HH:MM
   */
  get duracionFormateada(): string {
    const horas = Math.floor(this.contenido.duracion / 60);
    const minutos = this.contenido.duracion % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}`;
    }
    return `${minutos}:00`;
  }

  /**
   * Obtiene las primeras 3 etiquetas para mostrar
   */
  get etiquetasVisibles(): string[] {
    return this.contenido.tags.slice(0, 3);
  }
}

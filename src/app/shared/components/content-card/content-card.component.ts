import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Contenido } from '../../../core/models/contenido.models';

@Component({
  selector: 'app-content-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss']
})
export class ContentCardComponent {
  @Input() contenido!: Contenido;
  @Input() isCreatorView: boolean = false;

  constructor(private router: Router) {}

  /**
   * Verifica si el contenido es privado
   */
  get isPrivate(): boolean {
    return this.contenido.estado === 'PRIVADO';
  }

  /**
   * Navega al preview guardando el ID en localStorage (sin mostrarlo en URL)
   */
  navigateToPreview(event: Event): void {
    event.preventDefault();
    // Guardar ID en localStorage de forma segura
    localStorage.setItem('currentContentId', this.contenido._id);
    // Navegar sin ID en la URL
    this.router.navigate(['/content/preview']);
  }

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
    if (!this.contenido.tags || this.contenido.tags.length === 0) {
      return [];
    }
    return this.contenido.tags.slice(0, 3);
  }
}

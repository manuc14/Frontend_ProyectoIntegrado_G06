import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Contenido } from '../../../core/models/contenido.models';
import { ApiService } from '../../../core/services/api.service';

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
  @Input() navigationOrigin: string = 'catalog'; // 'catalog', 'private-lists', etc.

  constructor(private router: Router, private apiService: ApiService) {}

  /**
   * Obtiene la URL completa de la miniatura convirtiendo rutas relativas
   */
  get miniaturaUrl(): string {
    return this.apiService.getFullResourceUrl(this.contenido.miniaturaUrl);
  }

  /**
   * Verifica si el contenido es privado
   */
  get isPrivate(): boolean {
    return this.contenido.estado === 'PRIVADO';
  }

  /**
   * Navega al preview guardando la información necesaria en localStorage
   */
  navigateToPreview(event: Event): void {
    event.preventDefault();
    // Guardar información del creador en localStorage
    localStorage.setItem('currentContentCreatorAlias', this.contenido.creadorAlias || '');
    localStorage.setItem('currentContentCreatorSpecialty', this.contenido.creadorEspecialidad || '');
    // Guardar ID en localStorage
    localStorage.setItem('currentContentId', this.contenido._id);
    // Navegar con query parameter para el origen
    this.router.navigate(['/content/preview'], {
      queryParams: { origin: this.navigationOrigin }
    });
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

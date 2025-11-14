import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Contenido } from '../../../core/models/contenido.models';
import { AuthService } from '../../../core/services/auth.service';
import { InfoModalComponent } from '../info-modal/info-modal.component';

@Component({
  selector: 'app-content-card',
  standalone: true,
  imports: [CommonModule, InfoModalComponent],
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss']
})
export class ContentCardComponent {
  @Input() contenido!: Contenido;
  @Input() isCreatorView: boolean = false;

  showIncompatibleModal = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Verifica si el contenido es privado
   */
  get isPrivate(): boolean {
    return this.contenido.estado === 'PRIVADO';
  }

  /**
   * Maneja el click en la tarjeta de contenido
   * - Usuario normal: navega al preview
   * - Creador: valida tipo de contenido y navega a edición
   */
  handleCardClick(event: Event): void {
    event.preventDefault();
    
    if (this.isCreatorView) {
      this.handleCreatorClick();
    } else {
      this.navigateToPreview();
    }
  }

  /**
   * Maneja el click cuando es vista de creador
   * Valida que el tipo de contenido coincida antes de permitir edición
   */
  private handleCreatorClick(): void {
    const user = this.authService.getCurrentUser();
    const creatorType = user?.tipoContenido?.toUpperCase();
    const contentType = this.contenido.tipo?.toUpperCase();

    // Si el creador y el contenido son del mismo tipo, permitir edición
    if (creatorType === contentType) {
      // Guardar el ID en localStorage (como en content-preview)
      localStorage.setItem('currentContentId', this.contenido._id);
      this.router.navigate(['/edit-content']);
    } else {
      // Mostrar modal indicando incompatibilidad
      this.showIncompatibleModal = true;
    }
  }

  /**
   * Navega al preview guardando el ID en localStorage (sin mostrarlo en URL)
   * Solo se ejecuta en vista de usuario normal
   */
  private navigateToPreview(): void {
    localStorage.setItem('currentContentId', this.contenido._id);
    this.router.navigate(['/content/preview']);
  }

  /**
   * Cierra el modal de incompatibilidad
   */
  closeIncompatibleModal(): void {
    this.showIncompatibleModal = false;
  }

  /**
   * Obtiene el mensaje del modal según el tipo de contenido
   */
  get incompatibleModalMessage(): string {
    const user = this.authService.getCurrentUser();
    const creatorType = user?.tipoContenido || 'contenido';
    const contentTypeName = this.contenido.tipo === 'VIDEO' ? 'video' : 'audio';
    
    return `Eres un creador de ${creatorType.toLowerCase()} y este es un contenido de tipo ${contentTypeName}. Solo puedes editar contenido de tu mismo tipo.`;
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

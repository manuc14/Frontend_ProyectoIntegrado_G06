import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/*
 * Interfaz que define la estructura de un elemento multimedia
 * para mostrar en las tarjetas de contenido
 */
export interface MediaItem {
  title: string;
  tagLeft?: string;
  tagRight?: string;
  badgeRight?: string;
  image: string;
}

/*
 * MediaCardComponent
 * Tarjeta individual para mostrar contenido multimedia (videos/audios).
 * Incluye imagen, título, etiquetas de categoría y calificación.
 * Reutilizable en diferentes secciones de contenido.
 */
@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss'
})
export class MediaCardComponent {
  // Datos del elemento multimedia a mostrar
  @Input() item!: MediaItem;
}

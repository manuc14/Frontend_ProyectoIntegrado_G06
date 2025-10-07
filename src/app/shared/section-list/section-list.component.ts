import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent, MediaItem } from '../media-card/media-card.component';

/*
 * SectionListComponent
 * Contenedor para mostrar una sección de contenido multimedia con título,
 * subtítulo y grid responsive de tarjetas. Usado para organizar contenido
 * por categorías (Top Videos, Trending Audios, etc.).
 */
@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './section-list.component.html',
  styleUrl: './section-list.component.scss'
})
export class SectionListComponent {
  // Título principal de la sección
  @Input() title = '';
  // Subtítulo o categoría de la sección
  @Input() subtitle = '';
  // Lista de elementos multimedia a mostrar
  @Input() items: MediaItem[] = [];
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MediaItem {
  title: string;
  tagLeft?: string;
  tagRight?: string;
  badgeRight?: string;
  image: string;
}

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss'
})
export class MediaCardComponent {
  @Input() item!: MediaItem;
}

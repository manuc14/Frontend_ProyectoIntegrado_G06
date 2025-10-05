import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent, MediaItem } from '../media-card/media-card.component';

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './section-list.component.html',
  styleUrl: './section-list.component.scss'
})
export class SectionListComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() items: MediaItem[] = [];
}

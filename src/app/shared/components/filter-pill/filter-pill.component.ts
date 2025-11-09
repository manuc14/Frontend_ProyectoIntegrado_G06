import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FilterIconType = 'video' | 'audio' | 'premium' | 'age' | 'quality' | 'check';

@Component({
  selector: 'app-filter-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-pill.component.html',
  styleUrls: ['./filter-pill.component.scss']
})
export class FilterPillComponent {
  @Input() label: string = '';
  @Input() iconType?: FilterIconType; // Tipo de icono SVG
  @Input() icon?: string; // Deprecated: usar iconType en su lugar
  @Input() isActive: boolean = false;
  @Input() isPrimary: boolean = false; // Para pills de Video/Audio
  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    this.onClick.emit();
  }
}

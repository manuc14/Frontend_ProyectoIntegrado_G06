import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-pill.component.html',
  styleUrls: ['./filter-pill.component.scss']
})
export class FilterPillComponent {
  @Input() label: string = '';
  @Input() icon?: string; // URL del icono SVG
  @Input() isActive: boolean = false;
  @Input() isPrimary: boolean = false; // Para pills de Video/Audio
  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    this.onClick.emit();
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-block-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-block-button.component.html',
  styleUrl: './toggle-block-button.component.scss'
})
export class ToggleBlockButtonComponent {
  @Input() activo: boolean = true;
  @Output() toggle = new EventEmitter<void>();
}

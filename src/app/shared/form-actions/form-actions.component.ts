import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { buttonHover, buttonPress } from '../../core/animations/animations';

@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './form-actions.component.html',
  styleUrl: './form-actions.component.scss',
  animations: [buttonHover, buttonPress]
})
export class FormActionsComponent {
  @Input() isSaving: boolean = false;
  @Output() cancelar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();
}

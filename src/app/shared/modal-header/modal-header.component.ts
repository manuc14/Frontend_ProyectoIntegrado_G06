import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { buttonHover, buttonPress } from '../../core/animations/animations';

@Component({
  selector: 'app-modal-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './modal-header.component.html',
  styleUrl: './modal-header.component.scss',
  animations: [buttonHover, buttonPress]
})
export class ModalHeaderComponent {
  @Input() titulo: string = '';
  @Output() cerrar = new EventEmitter<void>();
}

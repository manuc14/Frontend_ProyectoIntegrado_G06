import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buttonHover, buttonPress } from '../../core/animations/animations';

@Component({
  selector: 'app-tipo-contenido-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tipo-contenido-buttons.component.html',
  styleUrl: './tipo-contenido-buttons.component.scss',
  animations: [buttonHover, buttonPress]
})
export class TipoContenidoButtonsComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  isTipoContenidoSelected(tipo: string): boolean {
    const normalized = this.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    return normalized.includes(tipo.toLowerCase());
  }

  selectTipoContenido(tipo: string): void {
    this.valueChange.emit(tipo.toUpperCase());
  }
}

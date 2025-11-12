import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de botones de acción para las listas de contenido
 * Incluye: Editar lista, Eliminar lista
 */
@Component({
  selector: 'app-list-action-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-action-buttons.component.html',
  styleUrls: ['./list-action-buttons.component.scss']
})
export class ListActionButtonsComponent {
  @Input() section: string = ''; // Identificador de la lista

  @Output() editList = new EventEmitter<string>();
  @Output() deleteList = new EventEmitter<string>();

  onEditList(): void {
    this.editList.emit(this.section);
  }

  onDeleteList(): void {
    this.deleteList.emit(this.section);
  }
}

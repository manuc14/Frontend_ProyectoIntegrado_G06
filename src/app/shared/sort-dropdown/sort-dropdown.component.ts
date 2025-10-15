import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buttonHover, buttonPress } from '../../core/animations/animations';

// Interfaces para las opciones de ordenamiento
export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
}

export interface SortEvent {
  field: string;
  direction: 'asc' | 'desc';
  option: SortOption;
}

@Component({
  selector: 'app-sort-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sort-dropdown.component.html',
  styleUrl: './sort-dropdown.component.scss',
  animations: [buttonHover, buttonPress]
})
export class SortDropdownComponent {
  @Input() sortOptions: SortOption[] = [];
  @Input() selectedSort: SortOption | null = null;
  @Output() sortChange = new EventEmitter<SortEvent>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  /**
   * Abre/cierra el dropdown
   */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Selecciona una opción de ordenamiento
   */
  selectSort(option: SortOption): void {
    this.selectedSort = option;
    this.isOpen = false;
    
    this.sortChange.emit({
      field: option.field,
      direction: option.direction,
      option: option
    });
  }

  /**
   * Cierra el dropdown si se hace click fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Element;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  /**
   * Maneja las teclas en el dropdown para accesibilidad
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen = false;
    }
  }

  /**
   * Previene que el dropdown se cierre al hacer click dentro
   */
  onDropdownClick(event: Event): void {
    event.stopPropagation();
  }
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaz para definir un filtro
export interface FilterButton {
  id: string;
  label: string;
  value: any;
  active?: boolean;
  group?: string; // Nuevo: para agrupar filtros mutuamente excluyentes
}

// Interfaz para grupos de filtros
export interface FilterGroup {
  id: string;
  label: string;
  filters: FilterButton[];
  mutuallyExclusive?: boolean; // Si true, solo uno puede estar activo
}

@Component({
  selector: 'app-filter-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-buttons.component.html',
  styleUrl: './filter-buttons.component.scss'
})
export class FilterButtonsComponent {
  @Input() filterGroups: FilterGroup[] = [];
  @Output() filterChange = new EventEmitter<{ filterId: string; value: any; active: boolean; group: string }>();
  @Output() clearAll = new EventEmitter<void>();

  /**
   * Maneja el clic en un botón de filtro
   */
  onFilterClick(filter: FilterButton, group: FilterGroup): void {
    const newActiveState = !filter.active;
    
    // Si el grupo es mutuamente exclusivo y se está activando un filtro
    if (group.mutuallyExclusive && newActiveState) {
      // Desactivar todos los demás filtros del grupo
      group.filters.forEach(f => {
        if (f.id !== filter.id) {
          f.active = false;
        }
      });
    }
    
    // Actualizar el estado del filtro clickeado
    filter.active = newActiveState;
    
    // Emitir el evento
    this.filterChange.emit({
      filterId: filter.id,
      value: filter.value,
      active: newActiveState,
      group: group.id
    });
  }

  /**
   * Limpia todos los filtros
   */
  onClearAllFilters(): void {
    // Desactivar todos los filtros de todos los grupos
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        filter.active = false;
      });
    });
    
    // Emitir evento de limpiar
    this.clearAll.emit();
  }

  /**
   * Verifica si hay algún filtro activo
   */
  hasActiveFilters(): boolean {
    return this.filterGroups.some(group => 
      group.filters.some(filter => filter.active)
    );
  }
}
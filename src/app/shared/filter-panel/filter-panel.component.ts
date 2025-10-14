import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces para los filtros
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range' | 'toggle';
  options?: FilterOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface AppliedFilters {
  [key: string]: any;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss'
})
export class FilterPanelComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() title: string = 'Filtros';
  @Input() filterGroups: FilterGroup[] = [];
  @Input() appliedFilters: AppliedFilters = {};
  
  @Output() filtersChanged = new EventEmitter<AppliedFilters>();
  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  tempFilters: AppliedFilters = {};
  hasChanges: boolean = false;

  ngOnInit(): void {
    // Inicializar filtros temporales con los aplicados
    this.tempFilters = { ...this.appliedFilters };
  }

  ngOnChanges(): void {
    // Actualizar filtros temporales cuando cambien los aplicados
    if (this.appliedFilters) {
      this.tempFilters = { ...this.appliedFilters };
    }
  }

  /**
   * Maneja el cambio de un filtro
   */
  onFilterChange(filterId: string, value: any): void {
    this.tempFilters[filterId] = value;
    this.checkForChanges();
  }

  /**
   * Verifica si hay cambios pendientes
   */
  private checkForChanges(): void {
    this.hasChanges = JSON.stringify(this.tempFilters) !== JSON.stringify(this.appliedFilters);
  }

  /**
   * Aplica los filtros temporales
   */
  applyFilters(): void {
    this.filtersChanged.emit({ ...this.tempFilters });
    this.hasChanges = false;
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.tempFilters = {};
    this.reset.emit();
    this.hasChanges = false;
  }

  /**
   * Cierra el panel sin aplicar cambios
   */
  closePanel(): void {
    // Restaurar filtros temporales
    this.tempFilters = { ...this.appliedFilters };
    this.hasChanges = false;
    this.close.emit();
  }

  /**
   * Maneja el clic en el overlay
   */
  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closePanel();
    }
  }

  /**
   * Cuenta los filtros activos
   */
  getActiveFiltersCount(): number {
    return Object.keys(this.tempFilters).filter(key => {
      const value = this.tempFilters[key];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  /**
   * Verifica si un filtro está activo
   */
  isFilterActive(filterId: string): boolean {
    const value = this.tempFilters[filterId];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Obtiene el valor de un filtro
   */
  getFilterValue(filterId: string): any {
    return this.tempFilters[filterId] || null;
  }

  /**
   * Verifica si una opción está seleccionada en un multiselect
   */
  isOptionSelected(filterId: string, optionValue: string): boolean {
    const selectedValues = this.tempFilters[filterId] || [];
    return Array.isArray(selectedValues) && selectedValues.includes(optionValue);
  }

  /**
   * Maneja el cambio en un multiselect
   */
  onMultiSelectChange(filterId: string, optionValue: string, isChecked: boolean): void {
    const currentValues = this.tempFilters[filterId] || [];
    let newValues: string[];

    if (isChecked) {
      newValues = [...currentValues, optionValue];
    } else {
      newValues = currentValues.filter((value: string) => value !== optionValue);
    }

    this.onFilterChange(filterId, newValues);
  }

  /**
   * Maneja el cambio en un select simple
   */
  onSelectChange(filterId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onFilterChange(filterId, target.value);
  }

  /**
   * Maneja el cambio en un checkbox
   */
  onCheckboxChange(filterId: string, optionValue: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onMultiSelectChange(filterId, optionValue, target.checked);
  }

  /**
   * Maneja el cambio en un toggle
   */
  onToggleChange(filterId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onFilterChange(filterId, target.checked);
  }

  /**
   * Maneja el cambio en un input de fecha
   */
  onDateChange(filterId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onFilterChange(filterId, target.value);
  }

  /**
   * Maneja el cambio en el rango mínimo
   */
  onRangeMinChange(filterId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentValue = this.getFilterValue(filterId) || {};
    this.onFilterChange(filterId, { ...currentValue, min: target.value });
  }

  /**
   * Maneja el cambio en el rango máximo
   */
  onRangeMaxChange(filterId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentValue = this.getFilterValue(filterId) || {};
    this.onFilterChange(filterId, { ...currentValue, max: target.value });
  }

  /**
   * Maneja eventos de teclado para accesibilidad
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closePanel();
    }
  }
}
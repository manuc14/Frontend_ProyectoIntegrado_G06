import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';

// Interfaz para los datos de creador
interface Creator {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  alias: string;
  email: string;
  category: string;
  followers: string;
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminCreatorsPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Propiedades para ordenamiento
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'name', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'name', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'lastName', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'lastName', direction: 'desc' },
    { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
    { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
    { id: 'category-asc', label: 'Categoría A-Z', field: 'category', direction: 'asc' },
    { id: 'category-desc', label: 'Categoría Z-A', field: 'category', direction: 'desc' }
  ];
  
  selectedSort: SortOption | null = null;
  
  // Configuración de filtros como grupos para creadores
  filterGroups: FilterGroup[] = [
    {
      id: 'category',
      label: 'Categoría',
      mutuallyExclusive: true,
      filters: [
        { id: 'lifestyle', label: 'Lifestyle', value: 'Lifestyle', active: false },
        { id: 'tecnologia', label: 'Tecnología', value: 'Tecnología', active: false },
        { id: 'cocina', label: 'Cocina', value: 'Cocina', active: false },
        { id: 'deportes', label: 'Deportes', value: 'Deportes', active: false },
        { id: 'arte', label: 'Arte', value: 'Arte', active: false }
      ]
    },
    {
      id: 'status',
      label: 'Estado',
      mutuallyExclusive: true,
      filters: [
        { id: 'active', label: 'Activos', value: 'activo', active: false },
        { id: 'blocked', label: 'Bloqueados', value: 'bloqueado', active: false }
      ]
    }
  ];
  
  // Datos de creadores simulados
  allCreators: Creator[] = [
    {
      id: '1',
      photo: 'assets/admin/creator1.png',
      name: 'Isabella',
      lastName: 'Martín García',
      alias: '@isabellamartin',
      email: 'isabella.martin@esimedia.com',
      category: 'Lifestyle',
      followers: '2.5M',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/creator2.png',
      name: 'Alejandro',
      lastName: 'Ruiz Fernández',
      alias: '@aleruiz',
      email: 'alejandro.ruiz@esimedia.com',
      category: 'Tecnología',
      followers: '1.8M',
      status: 'activo'
    },
    {
      id: '3',
      photo: 'assets/admin/creator3.png',
      name: 'Carmen',
      lastName: 'López Sánchez',
      alias: '@carmenlopez',
      email: 'carmen.lopez@esimedia.com',
      category: 'Cocina',
      followers: '3.2M',
      status: 'bloqueado'
    },
    {
      id: '4',
      photo: 'assets/admin/creator4.png',
      name: 'Miguel',
      lastName: 'Torres Jiménez',
      alias: '@migueltorres',
      email: 'miguel.torres@esimedia.com',
      category: 'Deportes',
      followers: '950K',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/creator5.png',
      name: 'Sofía',
      lastName: 'Moreno Castillo',
      alias: '@sofiamoreno',
      email: 'sofia.moreno@esimedia.com',
      category: 'Arte',
      followers: '1.2M',
      status: 'activo'
    }
  ];

  // Lista filtrada que se muestra en la interfaz
  filteredCreators: Creator[] = [...this.allCreators];

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
  }

  navigateToUsers(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-users']);
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-admin']);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    window.location.reload();
  }

  addNewCreator(): void {
    this.router.navigate(['/ad-creators-add']);
  }

  /**
   * Ejecuta la búsqueda de creadores - Evento del SearchBar component
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters(); // Esto aplicará filtros y luego la búsqueda
  }

  /**
   * Realiza la búsqueda filtrada (método legacy, ahora usa applyFilters)
   */
  private performSearch(): void {
    this.applyFilters();
  }

  /**
   * Realiza la búsqueda filtrada sobre los datos ya filtrados
   */
  private performSearchOnFiltered(): void {
    if (!this.searchTerm.trim()) {
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredCreators = this.filteredCreators.filter(creator => {
      return (
        creator.name.toLowerCase().includes(searchLower) ||
        creator.lastName.toLowerCase().includes(searchLower) ||
        creator.alias.toLowerCase().includes(searchLower) ||
        creator.email.toLowerCase().includes(searchLower) ||
        creator.category.toLowerCase().includes(searchLower)
      );
    });
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFilters(); // Esto aplicará solo los filtros sin búsqueda
  }

  /**
   * Maneja el cambio de filtros
   */
  onFilterChange(event: { filterId: string; value: any; active: boolean; group: string }): void {
    // Encontrar y actualizar el filtro en la configuración
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        if (filter.id === event.filterId) {
          filter.active = event.active;
        }
      });
    });
    
    this.applyFilters();
    console.log('Filtros activos:', this.getActiveFilters());
  }

  /**
   * Limpia todos los filtros
   */
  onClearAllFilters(): void {
    // Desactivar todos los filtros
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        filter.active = false;
      });
    });
    
    this.applyFilters();
    console.log('Todos los filtros limpiados');
  }

  /**
   * Obtiene los filtros activos para debugging
   */
  private getActiveFilters(): any[] {
    const activeFilters: any[] = [];
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        if (filter.active) {
          activeFilters.push({ ...filter, groupId: group.id });
        }
      });
    });
    return activeFilters;
  }

  /**
   * Aplica los filtros activos a los datos
   */
  private applyFilters(): void {
    let data = [...this.allCreators];
    
    // Obtener todos los filtros activos de todos los grupos
    const activeFilters = this.getActiveFilters();
    
    if (activeFilters.length > 0) {
      data = data.filter(creator => {
        // Verificar si el creador pasa TODOS los filtros activos (AND lógico)
        return activeFilters.every(filter => {
          // Filtros de categoría
          if (filter.groupId === 'category') {
            return creator.category === filter.value;
          }
          // Filtros de estado
          if (filter.groupId === 'status') {
            return creator.status === filter.value;
          }
          return true;
        });
      });
    }
    
    // Aplicar primero los filtros, luego la búsqueda
    this.filteredCreators = data;
    
    // Si hay un término de búsqueda, aplicarlo sobre los datos ya filtrados
    if (this.searchTerm.trim()) {
      this.performSearchOnFiltered();
    }
    
    console.log(`Filtros aplicados. Creadores mostrados: ${this.filteredCreators.length} de ${this.allCreators.length}`);
    
    // Aplicar ordenamiento si hay uno seleccionado
    if (this.selectedSort) {
      this.applySorting();
    }
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: SortEvent): void {
    this.selectedSort = event.option;
    this.applySorting();
  }

  /**
   * Aplica el ordenamiento seleccionado a los datos filtrados
   */
  private applySorting(): void {
    if (!this.selectedSort) {
      return;
    }

    this.filteredCreators.sort((a, b) => {
      const field = this.selectedSort!.field as keyof Creator;
      let valueA = String(a[field]).toLowerCase();
      let valueB = String(b[field]).toLowerCase();

      // Limpiar el alias para ordenamiento (quitar @)
      if (field === 'alias') {
        valueA = valueA.replace('@', '');
        valueB = valueB.replace('@', '');
      }

      const comparison = valueA.localeCompare(valueB, 'es', { 
        numeric: true, 
        sensitivity: 'base' 
      });

      return this.selectedSort!.direction === 'desc' ? -comparison : comparison;
    });

    console.log(`Ordenamiento aplicado: ${this.selectedSort.label}`);
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByCreatorId(index: number, creator: Creator): string {
    return creator.id;
  }

  /**
   * Obtiene el mensaje apropiado cuando no hay resultados
   */
  getNoResultsMessage(): string {
    const activeFilters = this.getActiveFilters();
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = activeFilters.length > 0;

    if (hasSearch && hasFilters) {
      return `No se encontraron creadores que coincidan con "${this.searchTerm}" y los filtros aplicados`;
    } else if (hasSearch) {
      return `No se encontraron creadores que coincidan con "${this.searchTerm}"`;
    } else if (hasFilters) {
      const filterDescriptions = activeFilters.map(filter => filter.label).join(', ');
      return `No se encontraron creadores con los filtros: ${filterDescriptions}`;
    } else {
      return 'No hay creadores disponibles';
    }
  }

  /**
   * Obtiene el texto del botón para limpiar
   */
  getClearButtonText(): string {
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = this.getActiveFilters().length > 0;

    if (hasSearch && hasFilters) {
      return 'Limpiar búsqueda y filtros';
    } else if (hasSearch) {
      return 'Limpiar búsqueda';
    } else if (hasFilters) {
      return 'Limpiar filtros';
    } else {
      return 'Mostrar todos los creadores';
    }
  }

  /**
   * Limpia tanto búsqueda como filtros
   */
  clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.onClearAllFilters();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

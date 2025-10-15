import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';

// Interfaz para los datos de administrador
interface Admin {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminAdmsPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Propiedades para ordenamiento
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'name', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'name', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'lastName', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'lastName', direction: 'desc' },
    { id: 'department-asc', label: 'Departamento A-Z', field: 'department', direction: 'asc' },
    { id: 'department-desc', label: 'Departamento Z-A', field: 'department', direction: 'desc' }
  ];
  
  selectedSort: SortOption | null = null;
  
  // Configuración de filtros como grupos para administradores
  filterGroups: FilterGroup[] = [
    {
      id: 'department',
      label: 'Departamento',
      mutuallyExclusive: true,
      filters: [
        { id: 'tecnologia', label: 'Tecnología', value: 'Tecnología', active: false },
        { id: 'operaciones', label: 'Operaciones', value: 'Operaciones', active: false },
        { id: 'marketing', label: 'Marketing', value: 'Marketing', active: false },
        { id: 'finanzas', label: 'Finanzas', value: 'Finanzas', active: false },
        { id: 'rrhh', label: 'Recursos Humanos', value: 'Recursos Humanos', active: false }
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
  
  // Datos de administradores simulados
  allAdmins: Admin[] = [
    {
      id: '1',
      photo: 'assets/admin/admin1.png',
      name: 'María',
      lastName: 'González Pérez',
      email: 'maria.gonzalez@esimedia.com',
      department: 'Tecnología',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/admin2.png',
      name: 'Carlos',
      lastName: 'Rodríguez López',
      email: 'carlos.rodriguez@esimedia.com',
      department: 'Operaciones',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '3',
      photo: 'assets/admin/admin3.png',
      name: 'Ana',
      lastName: 'Martínez Silva',
      email: 'ana.martinez@esimedia.com',
      department: 'Marketing',
      role: 'Admin',
      status: 'bloqueado'
    },
    {
      id: '4',
      photo: 'assets/admin/admin4.png',
      name: 'David',
      lastName: 'López Fernández',
      email: 'david.lopez@esimedia.com',
      department: 'Finanzas',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/admin5.png',
      name: 'Laura',
      lastName: 'Sánchez Torres',
      email: 'laura.sanchez@esimedia.com',
      department: 'Recursos Humanos',
      role: 'Admin',
      status: 'activo'
    }
  ];

  // Lista filtrada que se muestra en la interfaz
  filteredAdmins: Admin[] = [...this.allAdmins];

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
    window.location.reload();
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-creators']);
  }

  addNewAdmin(): void {
    this.router.navigate(['/ad-admin-add']);
  }

  /**
   * Ejecuta la búsqueda de administradores - Evento del SearchBar component
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
    
    this.filteredAdmins = this.filteredAdmins.filter(admin => {
      return (
        admin.name.toLowerCase().includes(searchLower) ||
        admin.lastName.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower) ||
        admin.department.toLowerCase().includes(searchLower) ||
        admin.role.toLowerCase().includes(searchLower)
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
    let data = [...this.allAdmins];
    
    // Obtener todos los filtros activos de todos los grupos
    const activeFilters = this.getActiveFilters();
    
    if (activeFilters.length > 0) {
      data = data.filter(admin => {
        // Verificar si el administrador pasa TODOS los filtros activos (AND lógico)
        return activeFilters.every(filter => {
          // Filtros de departamento
          if (filter.groupId === 'department') {
            return admin.department === filter.value;
          }
          // Filtros de estado
          if (filter.groupId === 'status') {
            return admin.status === filter.value;
          }
          return true;
        });
      });
    }
    
    // Aplicar primero los filtros, luego la búsqueda
    this.filteredAdmins = data;
    
    // Si hay un término de búsqueda, aplicarlo sobre los datos ya filtrados
    if (this.searchTerm.trim()) {
      this.performSearchOnFiltered();
    }
    
    console.log(`Filtros aplicados. Administradores mostrados: ${this.filteredAdmins.length} de ${this.allAdmins.length}`);
    
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

    this.filteredAdmins.sort((a, b) => {
      const field = this.selectedSort!.field as keyof Admin;
      let valueA = String(a[field]).toLowerCase();
      let valueB = String(b[field]).toLowerCase();

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
  trackByAdminId(index: number, admin: Admin): string {
    return admin.id;
  }

  /**
   * Obtiene el mensaje apropiado cuando no hay resultados
   */
  getNoResultsMessage(): string {
    const activeFilters = this.getActiveFilters();
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = activeFilters.length > 0;

    if (hasSearch && hasFilters) {
      return `No se encontraron administradores que coincidan con "${this.searchTerm}" y los filtros aplicados`;
    } else if (hasSearch) {
      return `No se encontraron administradores que coincidan con "${this.searchTerm}"`;
    } else if (hasFilters) {
      const filterDescriptions = activeFilters.map(filter => filter.label).join(', ');
      return `No se encontraron administradores con los filtros: ${filterDescriptions}`;
    } else {
      return 'No hay administradores disponibles';
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
      return 'Mostrar todos los administradores';
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

import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';

// Interfaz para los datos de usuario
interface User {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  alias: string;
  email: string;
  birthDate: string;
  role: 'VIP' | 'Estándar';
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adusers',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminUsersPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Configuración de filtros como grupos
  filterGroups: FilterGroup[] = [
    {
      id: 'role',
      label: 'Tipo',
      mutuallyExclusive: true,
      filters: [
        { id: 'vip', label: 'VIP', value: 'VIP', active: false },
        { id: 'standard', label: 'Estándar', value: 'Estándar', active: false }
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

  // Opciones de ordenamiento para usuarios
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'name', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'name', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'lastName', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'lastName', direction: 'desc' },
    { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
    { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
    { id: 'birthDate-desc', label: 'Fecha nacimiento (más reciente)', field: 'birthDate', direction: 'desc' },
    { id: 'birthDate-asc', label: 'Fecha nacimiento (más antigua)', field: 'birthDate', direction: 'asc' }
  ];

  selectedSort: SortOption | null = null;
  
  // Datos de usuarios simulados
  allUsers: User[] = [
    {
      id: '1',
      photo: 'assets/admin/user1.png',
      name: 'María',
      lastName: 'López Sánchez',
      alias: '@mlopez',
      email: 'maria.lopez@esimedia.com',
      birthDate: '12/03/1992',
      role: 'VIP',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/user2.png',
      name: 'Carlos',
      lastName: 'Pérez Gómez',
      alias: '@carlosp',
      email: 'carlos.perez@esimedia.com',
      birthDate: '28/11/1988',
      role: 'Estándar',
      status: 'bloqueado'
    },
    {
      id: '3',
      photo: 'assets/admin/user3.png',
      name: 'Lucía',
      lastName: 'Gómez Lozano',
      alias: '@lgomez',
      email: 'lucia.gomez@esimedia.com',
      birthDate: '04/06/1995',
      role: 'Estándar',
      status: 'activo'
    },
    {
      id: '4',
      photo: 'assets/admin/user4.png',
      name: 'Ana',
      lastName: 'Martínez Ribera',
      alias: '@amartinez',
      email: 'ana.martinez@esimedia.com',
      birthDate: '20/01/1990',
      role: 'VIP',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/user5.png',
      name: 'Diego',
      lastName: 'Ramírez González',
      alias: '@dramirez',
      email: 'diego.ramirez@esimedia.com',
      birthDate: '09/09/1987',
      role: 'Estándar',
      status: 'bloqueado'
    }
  ];

  // Lista filtrada de usuarios
  filteredUsers: User[] = [...this.allUsers];

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
  }

  navigateToUsers(): void {
    this.closeSidebar();
    window.location.reload();
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-admin']);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-creators']);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }

  /**
   * Ejecuta la búsqueda de usuarios - Evento del SearchBar component
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters(); // Esto aplicará filtros y luego la búsqueda
  }

  /**
   * Realiza la búsqueda filtrada sobre los datos ya filtrados
   */
  private performSearchOnFiltered(): void {
    if (!this.searchTerm.trim()) {
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredUsers = this.filteredUsers.filter(user => {
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.alias.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
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
   * Limpia la búsqueda y restaura todos los usuarios (método legacy)
   */
  clearSearch(): void {
    this.onClearSearch();
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
    let data = [...this.allUsers];
    
    // Obtener todos los filtros activos de todos los grupos
    const activeFilters = this.getActiveFilters();
    
    if (activeFilters.length > 0) {
      data = data.filter(user => {
        // Verificar si el usuario pasa TODOS los filtros activos (AND lógico)
        return activeFilters.every(filter => {
          // Filtros de rol (Tipo)
          if (filter.groupId === 'role') {
            return user.role === filter.value;
          }
          // Filtros de estado
          if (filter.groupId === 'status') {
            return user.status === filter.value;
          }
          return true;
        });
      });
    }
    
    // Aplicar primero los filtros, luego la búsqueda
    this.filteredUsers = data;
    
    // Si hay un término de búsqueda, aplicarlo sobre los datos ya filtrados
    if (this.searchTerm.trim()) {
      this.performSearchOnFiltered();
    }
    
    // Aplicar ordenamiento si hay uno seleccionado
    if (this.selectedSort) {
      this.applySorting();
    }
    
    console.log(`Filtros aplicados. Usuarios mostrados: ${this.filteredUsers.length} de ${this.allUsers.length}`);
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  /**
   * Obtiene el mensaje apropiado cuando no hay resultados
   */
  getNoResultsMessage(): string {
    const activeFilters = this.getActiveFilters();
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = activeFilters.length > 0;

    if (hasSearch && hasFilters) {
      return `No se encontraron usuarios que coincidan con "${this.searchTerm}" y los filtros aplicados`;
    } else if (hasSearch) {
      return `No se encontraron usuarios que coincidan con "${this.searchTerm}"`;
    } else if (hasFilters) {
      const filterDescriptions = activeFilters.map(filter => filter.label).join(', ');
      return `No se encontraron usuarios con los filtros: ${filterDescriptions}`;
    } else {
      return 'No hay usuarios disponibles';
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
      return 'Mostrar todos los usuarios';
    }
  }

  /**
   * Limpia tanto búsqueda como filtros
   */
  clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.onClearAllFilters();
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: SortEvent): void {
    this.selectedSort = event.option;
    this.applySorting();
    console.log('Ordenando por:', event.field, event.direction);
  }

  /**
   * Aplica el ordenamiento a los datos filtrados
   */
  private applySorting(): void {
    if (!this.selectedSort) {
      return;
    }

    this.filteredUsers.sort((a, b) => {
      const field = this.selectedSort!.field as keyof User;
      let valueA = a[field];
      let valueB = b[field];

      // Manejo especial para fechas
      if (field === 'birthDate') {
        // Convertir formato DD/MM/YYYY a Date para comparar
        const valueAStr = String(valueA);
        const valueBStr = String(valueB);
        const [dayA, monthA, yearA] = valueAStr.split('/');
        const [dayB, monthB, yearB] = valueBStr.split('/');
        const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
        
        if (this.selectedSort!.direction === 'asc') {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      }

      // Ordenamiento alfabético para otros campos
      const valueALower = String(valueA).toLowerCase();
      const valueBLower = String(valueB).toLowerCase();

      if (this.selectedSort!.direction === 'asc') {
        return valueALower.localeCompare(valueBLower);
      } else {
        return valueBLower.localeCompare(valueALower);
      }
    });
  }
}
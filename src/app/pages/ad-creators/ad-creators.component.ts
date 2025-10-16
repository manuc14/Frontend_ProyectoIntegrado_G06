import {Component, HostListener, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { CreatorService, CreatorEC } from '../../core/services/creator.service';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

// Interfaz eliminada - ahora usamos CreatorEC directamente de la BD

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminCreatorsPage implements OnInit {

  sidebarVisible = false;
  searchTerm = '';

  // Estados para carga y errores (de la rama de tu compañero)
  isLoading = true;
  error: string | null = null;

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
        { id: 'active', label: 'Activos', value: true, active: false },
        { id: 'blocked', label: 'Bloqueados', value: false, active: false }
      ]
    }
  ];

  // Opciones de ordenamiento para creadores
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
    { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
    { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
    { id: 'category-asc', label: 'Categoría A-Z', field: 'especialidad', direction: 'asc' },
    { id: 'category-desc', label: 'Categoría Z-A', field: 'especialidad', direction: 'desc' }
  ];

  selectedSort: SortOption | null = null;

  // Arrays de datos - INTEGRACIÓN DIRECTA CON BD
  allCreators: CreatorEC[] = []; // Datos de la BD (sin transformación)
  filteredCreators: CreatorEC[] = []; // Lista filtrada/buscada/ordenada

  // Para paginación (fijo)
  currentPage = 1;
  pageSize = 5; // Fijo para simplificar
  totalCreadores = 0;

  constructor(
    private router: Router,
    private creatorService: CreatorService
  ) {}

  ngOnInit(): void {
    this.cargarCreadores();
  }

  // Cálculo dinámico de pageSize eliminado; se usa pageSize fijo.

  // ========================================
  // MÉTODOS DE CARGA DE DATOS
  // ========================================

  /**
   * Carga creadores desde la base de datos
   */
  cargarCreadores(): void {
    this.isLoading = true;
    this.error = null;

    this.creatorService.listarCreadores().subscribe({
      next: (data) => {
        // Usar datos directamente de la BD sin transformación
        this.allCreators = data;
        this.filteredCreators = [...this.allCreators];

        this.isLoading = false;
        console.log(`Creadores cargados: ${this.allCreators.length}`);

  // No hay cálculo dinámico de pageSize — no hay nada que recalcular aquí.
      },
      error: (err) => {
        console.error('Error al cargar creadores:', err);

        // Mantener arrays vacíos cuando hay error
        this.allCreators = [];
        this.filteredCreators = [];

        this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
        this.isLoading = false;

  // No hay cálculo dinámico de pageSize — no hay nada que recalcular aquí.
      }
    });
  }

  // ========================================
  // MÉTODOS DE PAGINACIÓN
  // ========================================

  get creadoresPaginados(): CreatorEC[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCreators.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filteredCreators.length / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.filteredCreators.length === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredCreators.length);
    return `${start}–${end} de ${this.filteredCreators.length}`;
  }

  paginaAnterior(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  paginaSiguiente(): void {
    if (this.currentPage < this.totalPaginas) {
      this.currentPage++;
    }
  }

  // ========================================
  // MÉTODOS DE NAVEGACIÓN Y ACCIONES
  // ========================================

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

  handleNav(event: string): void {
    this.closeSidebar();
    switch(event) {
      case 'users':
        this.router.navigate(['/ad-users']);
        break;
      case 'admins':
        this.router.navigate(['/ad-admin']);
        break;
      case 'creators':
        // ya en creadores — refrescar
        window.location.reload();
        break;
      default:
        break;
    }
  }

  addNewCreator(): void {
    this.router.navigate(['/ad-creators-add']);
  }

  editarCreador(id: string): void {
    console.log('Editar creador:', id);
    // Implementación pendiente: navegar a la página de edición
  }

  eliminarCreador(id: string): void {
    console.log('Eliminar creador:', id);
    // Implementación pendiente: mostrar diálogo de confirmación y eliminar
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  /**
   * Ejecuta la búsqueda de creadores - Evento del SearchBar component
   */
  onSearch(searchTerm: string): void {
    // searchTerm ya está actualizado por ngModel
    this.applyFilters(); // Esto aplicará filtros y luego la búsqueda
  }

  /**
   * Maneja cambios en el término de búsqueda
   */
  onSearchTermChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    // searchTerm ya está limpiado por el componente search-bar
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
            return creator.especialidad === filter.value;
          }
          // Filtros de estado
          if (filter.groupId === 'status') {
            return creator.activo === filter.value;
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

    // Resetear paginación cuando cambian los filtros
    this.currentPage = 1;

    // Aplicar ordenamiento si hay uno seleccionado
    if (this.selectedSort) {
      this.applySorting();
    }
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
        (creator.nombre?.toLowerCase() || '').includes(searchLower) ||
        (creator.apellidos?.toLowerCase() || '').includes(searchLower) ||
        (creator.alias?.toLowerCase() || '').includes(searchLower) ||
        (creator.correo?.toLowerCase() || '').includes(searchLower) ||
        (creator.especialidad?.toLowerCase() || '').includes(searchLower)
      );
    });
  }

  // ========================================
  // MÉTODOS DE ORDENAMIENTO
  // ========================================

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
      const field = this.selectedSort!.field as keyof CreatorEC;
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

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByCreatorId(index: number, creator: CreatorEC): string {
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
  // pageSize es fijo; no es necesario recalcular
  }
}

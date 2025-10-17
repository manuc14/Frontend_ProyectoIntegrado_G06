import {Component, HostListener, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { CreatorService, CreatorEC } from '../../core/services/creator.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../core/utils/date-utils';
import { of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
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

    this.creatorService.listarCreadores()
      .pipe(
        tap((data: CreatorEC[]) => {
          this.allCreators = data.map(d => ({ ...d, fechaNacimientoFormatted: formatDateIsoToDDMMYYYY((d as any).fechaNacimiento) } as CreatorEC));
          this.filteredCreators = [...this.allCreators];
        }),
        catchError((err: any) => {
          // Error manejado: dejar arrays vacíos y mensaje
          this.allCreators = [];
          this.filteredCreators = [];
          this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
          return of([] as CreatorEC[]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
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
    // Implementación pendiente: navegar a la página de edición
  }

  eliminarCreador(id: string): void {
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
    this.applyFiltersAndSearch();
  }

  /**
   * Maneja cambios en el término de búsqueda
   */
  onSearchTermChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFiltersAndSearch();
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    // searchTerm ya está limpiado por el componente search-bar
    this.applyFiltersAndSearch(); // aplicar solo filtros
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

  this.applyFiltersAndSearch();
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

  this.applyFiltersAndSearch();
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
  // Reusar el flujo unificado
  this.applyFiltersAndSearch();
  this.currentPage = 1;
  if (this.selectedSort) this.applySorting();
  }

  /**
   * Aplica filtros y búsqueda en un único flujo (reduce complejidad)
   */
  private applyFiltersAndSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const activeFilters = this.getActiveFilters();

    this.filteredCreators = this.allCreators.filter(creator => {
      if (activeFilters.length > 0) {
        const ok = activeFilters.every(filter => {
          if (filter.groupId === 'category') return creator.especialidad === filter.value;
          if (filter.groupId === 'status') return creator.activo === filter.value;
          return true;
        });
        if (!ok) return false;
      }

      if (term.length === 0) return true;

      return (
        (creator.nombre?.toLowerCase() || '').includes(term) ||
        (creator.apellidos?.toLowerCase() || '').includes(term) ||
        (creator.alias?.toLowerCase() || '').includes(term) ||
        (creator.correo?.toLowerCase() || '').includes(term) ||
        (creator.especialidad?.toLowerCase() || '').includes(term)
      );
    });
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
    const field = this.selectedSort.field as keyof CreatorEC;
    const dir = this.selectedSort.direction === 'asc' ? 1 : -1;

    this.filteredCreators.sort((a, b) => {
      let va = (a[field] as any) ?? '';
      let vb = (b[field] as any) ?? '';

      // Normalizar alias
      if (field === 'alias') {
        va = String(va).replace('@', '');
        vb = String(vb).replace('@', '');
      }

      // Si fuera fecha, intentar comparar por timestamp
      if (field === ('fechaNacimiento' as keyof CreatorEC) || field === ('fecha' as keyof CreatorEC)) {
        const ta = toTimestampFromString(String((a as any)[field])) ?? 0;
        const tb = toTimestampFromString(String((b as any)[field])) ?? 0;
        return (ta - tb) * dir;
      }

      return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' }) * dir;
    });

    // Ordenamiento aplicado
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

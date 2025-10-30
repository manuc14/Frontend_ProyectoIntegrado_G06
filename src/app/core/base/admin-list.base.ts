import { Directive, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { getActiveFilters, filterAndSearch, applySorting } from '../utils/list-utils';
import { ADMIN_CONFIG } from '../constants/admin-config.constants';

@Directive()
export abstract class AdminListBase<T> implements OnInit {

  // Propiedades comunes para sidebar
  sidebarVisible = false;

  // Propiedades comunes para búsqueda
  searchTerm = '';

  // Estados comunes para carga y errores
  isLoading = true;
  error: string | null = null;

  // Configuración de filtros - será definida por subclases
  abstract filterGroups: FilterGroup[];

  // Opciones de ordenamiento - será definida por subclases
  abstract sortOptions: SortOption[];

  selectedSort: SortOption | null = null;

  // Arrays de datos
  protected allItems: T[] = [];
  protected filteredItems: T[] = [];

  // Para paginación
  currentPage = 1;
  pageSize = 5; // Fijo
  totalItems = 0;

  // Estado para operaciones de guardado/eliminación
  isSaving = false;

  constructor(protected router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Método abstracto para cargar datos
  abstract loadData(): void;

  // Método abstracto para obtener campos de búsqueda
  abstract getSearchFields(): string[];

  // Método abstracto para predicado de filtro
  abstract getFilterPredicate(item: T, filter: any): boolean;

  // Método abstracto para obtener valor de ordenamiento
  abstract getSortValue(item: T, field: string): any;

  // Método abstracto para obtener ID del item
  abstract getItemId(item: T): string;

  // Método abstracto para nombre de entidad (para mensajes)
  abstract getEntityName(): string;

  // Método abstracto para ruta actual (para navegación)
  abstract getCurrentRoute(): string;

  // ========================================
  // MÉTODOS DE SIDEBAR Y NAVEGACIÓN
  // ========================================

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
  }

  navigateToUsers(): void {
    this.closeSidebar();
    this.router.navigate([ADMIN_CONFIG.navRoutes.users]);
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate([ADMIN_CONFIG.navRoutes.admins]);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate([ADMIN_CONFIG.navRoutes.creators]);
  }

  private navMethods: { [key: string]: () => void } = {
    users: () => this.navigateToUsers(),
    admins: () => this.navigateToAdmins(),
    creators: () => this.navigateToCreators(),
  };

  handleNav(event: string): void {
    this.closeSidebar();
    const method = this.navMethods[event];
    if (method) {
      method();
    } else {
      const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes];
      if (route) {
        this.router.navigate([route]);
      }
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onSearchTermChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onFilterChange(event: { filterId: string; value: any; active: boolean; group: string }): void {
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        if (filter.id === event.filterId) {
          filter.active = event.active;
        }
      });
    });
    this.filterGroups = [...this.filterGroups];
    this.applyFilters();
  }

  onClearAllFilters(): void {
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        filter.active = false;
      });
    });
    this.filterGroups = [...this.filterGroups];
    this.applyFilters();
  }

  private getActiveFilters(): any[] {
    return getActiveFilters(this.filterGroups);
  }

  private applyFilters(): void {
    this.filteredItems = filterAndSearch(this.allItems, this.getActiveFilters(), this.searchTerm, this.getSearchFields(), (item, filter) => this.getFilterPredicate(item, filter));
    this.currentPage = 1;
    if (this.selectedSort) this.applySorting();
  }

  // ========================================
  // MÉTODOS DE ORDENAMIENTO
  // ========================================

  onSortChange(event: SortEvent): void {
    this.selectedSort = event.option;
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.selectedSort) return;
    this.filteredItems = applySorting(this.filteredItems, this.selectedSort, (item) => this.getSortValue(item, this.selectedSort!.field));
  }

  // ========================================
  // MÉTODOS DE PAGINACIÓN
  // ========================================

  get itemsPaginados(): T[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredItems.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.filteredItems.length === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredItems.length);
    return `${start}–${end} de ${this.filteredItems.length}`;
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
  // MÉTODOS DE UTILIDAD
  // ========================================

  // Use an arrow property so `this` is lexically bound when Angular calls the function
  // (prevents DefaultIterableDiffer from calling it with a different `this`).
  trackByItemId = (index: number, item: T): string => {
    return this.getItemId(item);
  };

  private getSearchAndFilterState(): { hasSearch: boolean; hasFilters: boolean } {
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = this.getActiveFilters().length > 0;
    return { hasSearch, hasFilters };
  }

  private getMessageConfig() {
    const entityName = this.getEntityName();
    const activeFilters = this.getActiveFilters();
    const filterDescriptions = activeFilters.map(f => f.label).join(', ');

    return {
      error: this.error,
      searchAndFilters: `No se encontraron ${entityName} que coincidan con "${this.searchTerm}" y los filtros aplicados`,
      searchOnly: `No se encontraron ${entityName} que coincidan con "${this.searchTerm}"`,
      filtersOnly: `No se encontraron ${entityName} con los filtros: ${filterDescriptions}`,
      none: `No hay ${entityName} disponibles`
    };
  }

  getNoResultsMessage(): string {
    const config = this.getMessageConfig();
    if (config.error) return config.error;

    const { hasSearch, hasFilters } = this.getSearchAndFilterState();

    if (hasSearch && hasFilters) return config.searchAndFilters;
    if (hasSearch) return config.searchOnly;
    if (hasFilters) return config.filtersOnly;
    return config.none;
  }

  getClearButtonText(): string {
    if (this.error) return 'Reintentar';

    const { hasSearch, hasFilters } = this.getSearchAndFilterState();

    if (hasSearch && hasFilters) return 'Limpiar búsqueda y filtros';
    if (hasSearch) return 'Limpiar búsqueda';
    if (hasFilters) return 'Limpiar filtros';
    return `Mostrar todos los ${this.getEntityName()}`;
  }

  clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.onClearAllFilters();
  }

  // ========================================
  // MÉTODOS COMUNES PARA OPERACIONES CRUD
  // ========================================

  /**
   * Método común para eliminar entidades
   */
  deleteEntity(id: string, serviceMethod: (id: string) => any, entityName: string): void {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar la cuenta? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    this.isSaving = true;
    serviceMethod(id)
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: (resp: any) => this.handleDeleteResponse(resp, entityName, false, id),
        error: (err: any) => this.handleDeleteError(err, entityName)
      });
  }

  private isResponseError(resp: any): boolean {
    return resp && (
      resp.error ||
      resp.success === false ||
      resp.ok === false ||
      (typeof resp.message === 'string' && /error|fail|no se|no encontrado|not found/i.test(resp.message))
    );
  }

  private handleDeleteResponse(resp: any, entityName: string, reload: boolean, id?: string): void {
    if (this.isResponseError(resp)) {
      console.error(`Backend responded with error while deleting ${entityName}:`, resp);
      this.error = (resp && (resp.message || resp.error)) || `No se pudo eliminar el ${entityName}. Intenta de nuevo.`;
      return;
    }

    if (reload) {
      this.loadData();
    } else if (id) {
      // Remover de arrays locales
      this.allItems = this.allItems.filter(item => this.getItemId(item) !== id);
      this.filteredItems = this.filteredItems.filter(item => this.getItemId(item) !== id);
      this.totalItems = this.allItems.length;
    }

    alert(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} eliminado correctamente.`);
  }

  private handleDeleteError(err: any, entityName: string): void {
    console.error(`Error al eliminar ${entityName}:`, err);
    this.error = `No se pudo eliminar el ${entityName}. Intenta de nuevo.`;
  }

  /**
   * Método común para manejar respuestas de eliminación con actualización de lista
   */
  handleDeleteWithReload(resp: any, entityName: string): void {
    this.handleDeleteResponse(resp, entityName, true);
  }

  /**
   * Método común para cargar datos con manejo de errores
   */
  loadDataWithErrorHandling(serviceMethod: () => any, entityName: string): void {
    this.isLoading = true;
    this.error = null;

    serviceMethod()
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (data: T[]) => this.handleLoadDataResponse(data),
        error: (err: any) => this.handleLoadDataError(err, entityName)
      });
  }

  private handleLoadDataResponse(data: T[]): void {
    this.allItems = data || [];
    this.filteredItems = [...this.allItems];
    this.totalItems = this.allItems.length;
    this.applyFilters();
  }

  private handleLoadDataError(err: any, entityName: string): void {
    console.error(`Error al cargar ${entityName}:`, err);
    this.error = `No se pudieron cargar los ${entityName}. Intenta de nuevo.`;
    this.allItems = [];
    this.filteredItems = [];
    this.totalItems = 0;
  }

  /**
   * Método común para navegar a formularios de edición
   */
  navigateToEdit(id: string, entityType: 'users' | 'admins' | 'creators'): void {
    const route = ADMIN_CONFIG.navRoutes[entityType].edit;
    this.router.navigate([route, id]);
  }

  /**
   * Método común para navegar a formularios de creación
   */
  navigateToAdd(entityType: 'users' | 'admins' | 'creators'): void {
    const route = ADMIN_CONFIG.navRoutes[entityType].add;
    this.router.navigate([route]);
  }
}

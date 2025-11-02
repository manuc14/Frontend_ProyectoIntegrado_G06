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

  handleNav(event: string): void {
    this.closeSidebar();
    const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes];
    if (route) {
      this.router.navigate([route]);
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onSearchTermChange = this.onSearch; // Alias para compatibilidad

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
      group.filters.forEach(filter => filter.active = false);
    });
    this.filterGroups = [...this.filterGroups];
    this.applyFilters();
  }

  private applyFilters(): void {
    const activeFilters = getActiveFilters(this.filterGroups);
    this.filteredItems = filterAndSearch(
      this.allItems, 
      activeFilters, 
      this.searchTerm, 
      this.getSearchFields(), 
      (item, filter) => this.getFilterPredicate(item, filter)
    );
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

  trackByItemId = (index: number, item: T): string => this.getItemId(item);

  getNoResultsMessage(): string {
    return this.error || 'No se encontraron resultados para estos parámetros';
  }

  getClearButtonText(): string {
    return this.error ? 'Reintentar' : 'Limpiar';
  }

  clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.onClearAllFilters();
  }

  // ========================================
  // MÉTODOS COMUNES PARA OPERACIONES CRUD
  // ========================================

  deleteEntity(id: string, serviceMethod: (id: string) => any, entityName: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar la cuenta? Esta acción no se puede deshacer.')) return;

    this.isSaving = true;
    serviceMethod(id)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.allItems = this.allItems.filter(item => this.getItemId(item) !== id);
          this.filteredItems = this.filteredItems.filter(item => this.getItemId(item) !== id);
          this.totalItems = this.allItems.length;
          alert(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} eliminado correctamente.`);
        },
        error: () => {
          this.error = `No se pudo eliminar el ${entityName}. Intenta de nuevo.`;
        }
      });
  }

  handleDeleteWithReload(resp: any, entityName: string): void {
    this.loadData();
    alert(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} eliminado correctamente.`);
  }

  loadDataWithErrorHandling(serviceMethod: () => any, entityName: string): void {
    this.isLoading = true;
    this.error = null;

    serviceMethod()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data: T[]) => {
          this.allItems = data || [];
          this.filteredItems = [...this.allItems];
          this.totalItems = this.allItems.length;
          this.applyFilters();
        },
        error: () => {
          this.error = `No se pudieron cargar los ${entityName}. Intenta de nuevo.`;
        }
      });
  }

  navigateTo(entityType: 'users' | 'admins' | 'creators', action: 'edit' | 'add', id?: string): void {
    const route = ADMIN_CONFIG.navRoutes[entityType][action];
    this.router.navigate(id ? [route, id] : [route]);
  }
}

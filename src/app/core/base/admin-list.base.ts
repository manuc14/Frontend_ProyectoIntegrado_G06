import { Directive, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { getActiveFilters, filterAndSearch, applySorting } from '../utils/list-utils';

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
    this.router.navigate(['/ad-users']);
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-admin']);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-creators']);
  }

  handleNav(event: string): void {
    this.closeSidebar();
    switch (event) {
      case 'users':
        this.router.navigate(['/ad-users']);
        break;
      case 'admins':
        this.router.navigate(['/ad-admin']);
        break;
      case 'creators':
        this.router.navigate(['/ad-creators']);
        break;
      default:
        break;
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFiltersAndSearch();
  }

  onSearchTermChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFiltersAndSearch();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFiltersAndSearch();
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
    this.applyFiltersAndSearch();
  }

  onClearAllFilters(): void {
    this.filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        filter.active = false;
      });
    });
    this.filterGroups = [...this.filterGroups];
    this.applyFiltersAndSearch();
  }

  private getActiveFilters(): any[] {
    return getActiveFilters(this.filterGroups);
  }

  private applyFilters(): void {
    this.filteredItems = filterAndSearch(this.allItems, this.getActiveFilters(), this.searchTerm, this.getSearchFields(), (item, filter) => this.getFilterPredicate(item, filter));
    this.currentPage = 1;
    if (this.selectedSort) this.applySorting();
  }

  private applyFiltersAndSearch(): void {
    this.applyFilters();
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

  getNoResultsMessage(): string {
    const activeFilters = this.getActiveFilters();
    const hasSearch = this.searchTerm.trim().length > 0;
    const hasFilters = activeFilters.length > 0;

    if (hasSearch && hasFilters) {
      return `No se encontraron ${this.getEntityName()} que coincidan con "${this.searchTerm}" y los filtros aplicados`;
    } else if (hasSearch) {
      return `No se encontraron ${this.getEntityName()} que coincidan con "${this.searchTerm}"`;
    } else if (hasFilters) {
      const filterDescriptions = activeFilters.map(filter => filter.label).join(', ');
      return `No se encontraron ${this.getEntityName()} con los filtros: ${filterDescriptions}`;
    } else {
      return `No hay ${this.getEntityName()} disponibles`;
    }
  }

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
      return `Mostrar todos los ${this.getEntityName()}`;
    }
  }

  clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.onClearAllFilters();
  }
}

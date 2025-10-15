import {Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { AdminService, AdminEV } from '../../core/services/admin.service';

// Interfaz eliminada - ahora usamos AdminEV directamente de la BD

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminAdmsPage implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  sidebarVisible = false;
  searchTerm = '';

  // Estados para carga y errores
  isLoading = true;
  error: string | null = null;

  // Propiedades para ordenamiento - actualizadas para AdminEV
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
    { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
    { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
    { id: 'department-asc', label: 'Departamento A-Z', field: 'departamento', direction: 'asc' },
    { id: 'department-desc', label: 'Departamento Z-A', field: 'departamento', direction: 'desc' }
  ];

  selectedSort: SortOption | null = null;

  // Configuración de filtros como grupos para administradores
  filterGroups: FilterGroup[] = [
    {
      id: 'department',
      label: 'Departamento',
      mutuallyExclusive: true,
      filters: [
        { id: 'operaciones', label: 'Operaciones', value: 'Operaciones', active: false },
        { id: 'marketing', label: 'Marketing', value: 'Marketing', active: false },
        { id: 'finanzas', label: 'Finanzas', value: 'Finanzas', active: false },
        { id: 'rrhh', label: 'Recursos Humanos', value: 'Recursos Humanos', active: false },
        { id: 'soporte', label: 'Soporte', value: 'Soporte', active: false }
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

  // Arrays de datos - INTEGRACIÓN DIRECTA CON BD
  allAdmins: AdminEV[] = []; // Datos de la BD (sin transformación)
  filteredAdmins: AdminEV[] = []; // Lista filtrada/buscada/ordenada

  // Para paginación dinámica
  currentPage = 1;
  pageSize = 5; // Valor inicial, se calculará dinámicamente
  totalAdmins = 0;

  // Constantes para el cálculo
  private readonly HEADER_HEIGHT = 64;
  private readonly TITLE_SECTION_HEIGHT = 80;
  private readonly SEARCH_SECTION_HEIGHT = 80;
  private readonly TABLE_HEADER_HEIGHT = 45;
  private readonly ROW_HEIGHT = 59;
  private readonly PAGINATION_HEIGHT = 80;
  private readonly PADDING = 48;

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.cargarAdministradores();
  }

  ngAfterViewInit(): void {
    // Calcular el tamaño de página inicial
    this.calcularPageSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
    this.calcularPageSize();
  }

  calcularPageSize(): void {
    const windowHeight = window.innerHeight;

    const availableHeight = windowHeight
      - this.HEADER_HEIGHT
      - this.TITLE_SECTION_HEIGHT
      - this.SEARCH_SECTION_HEIGHT
      - this.TABLE_HEADER_HEIGHT
      - this.PAGINATION_HEIGHT
      - this.PADDING;

    const filasQueCaben = Math.floor(availableHeight / this.ROW_HEIGHT);
    this.pageSize = Math.max(3, Math.min(filasQueCaben, 20));

    const totalPaginasNuevas = Math.ceil(this.totalAdmins / this.pageSize);
    if (this.currentPage > totalPaginasNuevas && totalPaginasNuevas > 0) {
      this.currentPage = totalPaginasNuevas;
    }

    console.log(`Altura disponible: ${availableHeight}px, Filas por página: ${this.pageSize}`);
  }

  cargarAdministradores(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.listarAdministradores().subscribe({
      next: (data) => {
        this.allAdmins = data;
        this.totalAdmins = data.length;
        this.filteredAdmins = [...data];
        this.isLoading = false;

        // Aplicar filtros y ordenamiento iniciales
        // this.applyFilters(); // Removido para consistencia con ad-creators

        setTimeout(() => this.calcularPageSize(), 100);
      },
      error: (err) => {
        console.error('Error al cargar administradores:', err);
        this.error = 'Error al cargar los administradores. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

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

  editarAdministrador(id: string): void {
    console.log('Editar administrador:', id);
    // TODO: Implementar navegación a página de edición
  }

  eliminarAdministrador(id: string): void {
    console.log('Eliminar administrador:', id);
    // TODO: Implementar diálogo de confirmación y eliminación
  }

  // Getters para paginación
  get adminsPaginados(): AdminEV[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredAdmins.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filteredAdmins.length / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.filteredAdmins.length === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredAdmins.length);
    return `${start}–${end} de ${this.filteredAdmins.length}`;
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

  /**
   * Ejecuta la búsqueda de administradores - Evento del SearchBar component
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
        (admin.nombre?.toLowerCase() || '').includes(searchLower) ||
        (admin.apellidos?.toLowerCase() || '').includes(searchLower) ||
        (admin.alias?.toLowerCase() || '').includes(searchLower) ||
        (admin.correo?.toLowerCase() || '').includes(searchLower) ||
        (admin.departamento?.toLowerCase() || '').includes(searchLower)
      );
    });
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
    let data = [...this.allAdmins];

    // Obtener todos los filtros activos de todos los grupos
    const activeFilters = this.getActiveFilters();

    if (activeFilters.length > 0) {
      data = data.filter(admin => {
        // Verificar si el administrador pasa TODOS los filtros activos (AND lógico)
        return activeFilters.every(filter => {
          // Filtros de departamento
          if (filter.groupId === 'department') {
            return admin.departamento === filter.value;
          }
          // Filtros de estado
          if (filter.groupId === 'status') {
            return admin.activo === filter.value;
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
      const field = this.selectedSort!.field as keyof AdminEV;
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
  trackByAdminId(index: number, admin: AdminEV): string {
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
}

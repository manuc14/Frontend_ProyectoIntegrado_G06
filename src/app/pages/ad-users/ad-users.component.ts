import {Component, HostListener, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { UserService, UserEV } from '../../core/services/user.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../core/utils/date-utils';
import { getActiveFilters, filterAndSearch, applySorting } from '../../core/utils/list-utils';
import { of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

// Interfaz temporal para compatibilidad (será reemplazada por UserEV)
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
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminUsersPage implements OnInit {

  sidebarVisible = false;
  searchTerm = '';
  
  // Estados para carga y errores (de la rama de tu compañero)
  isLoading = true;
  error: string | null = null;
  
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
  
  // Arrays de datos - INTEGRACIÓN CON BD
  usuarios: UserEV[] = []; // Datos originales de la BD
  allUsers: User[] = []; // Datos transformados para compatibilidad
  filteredUsers: User[] = []; // Lista filtrada/buscada/ordenada

  // Para paginación (fijo): usar un valor sencillo y predecible
  currentPage = 1;
  pageSize = 5; // Valor fijo solicitado
  totalUsuarios = 0;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // Cálculo dinámico de pageSize eliminado — se utiliza pageSize fijo.

  // ======================================== 
  // MÉTODOS DE CARGA DE DATOS
  // ========================================

  /**
   * Carga usuarios desde la base de datos
   */
  cargarUsuarios(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.listarUsuarios()
      .pipe(
        tap((data: UserEV[]) => {
          this.usuarios = data;
          this.totalUsuarios = data.length;
          this.allUsers = this.transformarUsuarios(data);
          this.filteredUsers = [...this.allUsers];
        }),
        catchError((err: any) => {
          // Error manejado: dejar estado consistente
          // Mantener arrays vacíos cuando hay error
          this.usuarios = [];
          this.allUsers = [];
          this.filteredUsers = [];
          this.totalUsuarios = 0;
          this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
          // Devolver observable vacío para completar el flujo limpiamente
          return of([] as UserEV[]);
        }),
        finalize(() => {
          this.isLoading = false;
          // carga finalizada
        })
      )
      .subscribe();
  }

  /**
   * Transforma UserEV (BD) a User (interfaz del componente)
   */
  private transformarUsuarios(usuarios: UserEV[]): User[] {
    return usuarios.map(usuario => ({
      id: usuario.id,
      photo: usuario.foto ? `assets/admin/${usuario.foto}` : 'assets/admin/admin_default.png',
      name: usuario.nombre,
      lastName: usuario.apellidos,
      alias: `@${usuario.alias}`,
      email: usuario.correo,
      // Guardamos la fecha como string formateado para mostrar, pero en ordenamiento usamos timestamp
      birthDate: formatDateIsoToDDMMYYYY(usuario.fechaNacimiento),
      role: usuario.esVip ? 'VIP' : 'Estándar',
      status: usuario.activo ? 'activo' : 'bloqueado'
    }));
  }

  /**
   * Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
   */
  // Mantengo el método por compatibilidad con plantillas que puedan referenciarlo.
  formatearFecha(fecha: string): string {
    return formatDateIsoToDDMMYYYY(fecha);
  }

  // ======================================== 
  // MÉTODOS DE NAVEGACIÓN
  // ========================================

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
  }

  handleNav(event: string): void {
  // Maneja eventos de navegación emitidos por el componente lateral
    this.closeSidebar();
    switch(event) {
      case 'users':
        // ya en usuarios — refrescar si se desea
        window.location.reload();
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
  // No hay recalculo de pageSize — pageSize es fijo
  }

  // ======================================== 
  // MÉTODOS DE BÚSQUEDA Y FILTROS (MANTENER)
  // ========================================

  /**
   * Ejecuta la búsqueda de usuarios - Evento del SearchBar component
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters(); // Esto aplicará filtros y luego la búsqueda
  }

  /**
   * Aplica búsqueda y filtros en un único flujo (reduce ramas y duplicación)
   */
  private applyFiltersAndSearch(): void {
    this.filteredUsers = filterAndSearch(this.allUsers, getActiveFilters(this.filterGroups), this.searchTerm, ['name','lastName','alias','email'], (item, filter) => {
      if (filter.groupId === 'role') return item.role === filter.value;
      if (filter.groupId === 'status') return item.status === filter.value;
      return true;
    });
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFiltersAndSearch(); // aplicar solo filtros
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
  if (this.selectedSort) this.applySorting();
  this.currentPage = 1;
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
    // Si hay error de conexión, mostrar mensaje específico
    if (this.error) {
      return this.error;
    }
    
    // Si está cargando, no mostrar mensaje
    if (this.isLoading) {
      return '';
    }
    
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
    // Si hay error de conexión, mostrar botón para reintentar
    if (this.error) {
      return 'Reintentar conexión';
    }
    
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
   * Limpia tanto búsqueda como filtros, o reintenta conexión si hay error
   */
  clearSearchAndFilters(): void {
    // Si hay error, reintentar carga de usuarios
    if (this.error) {
      this.cargarUsuarios();
      return;
    }
    
    // Si no hay error, limpiar búsqueda y filtros
    this.searchTerm = '';
    this.onClearAllFilters();
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: SortEvent): void {
    this.selectedSort = event.option;
    this.applySorting();
  }

  /**
   * Aplica el ordenamiento a los datos filtrados
   */
  private applySorting(): void {
    if (!this.selectedSort) {
      return;
    }
    this.filteredUsers = applySorting(this.filteredUsers, this.selectedSort, (v:any) => toTimestampFromString(String(v)) ?? 0);
  }

  // ======================================== 
  // MÉTODOS DE PAGINACIÓN Y OTROS
  // ========================================

  /**
   * Obtiene usuarios para la página actual
   */
  get usuariosPaginados(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers.slice(start, end);
  }

  /**
   * Calcula el total de páginas
   */
  get totalPaginas(): number {
    if (this.filteredUsers.length === 0) return 1;
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  /**
   * Genera el texto del rango mostrado
   */
  get rangoMostrado(): string {
    if (this.isLoading) {
      return 'Cargando...';
    }
    if (this.error) {
      return 'Error de conexión';
    }
    if (this.filteredUsers.length === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
    return `${start}–${end} de ${this.filteredUsers.length}`;
  }

  /**
   * Navega a la página anterior
   */
  paginaAnterior(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Navega a la página siguiente
   */
  paginaSiguiente(): void {
    if (this.currentPage < this.totalPaginas) {
      this.currentPage++;
    }
  }

  /**
   * Edita un usuario
   */
  editarUsuario(id: string): void {
    // Implementación pendiente: navegar a la página de edición
    // this.router.navigate(['/ad-users/edit', id]);
  }

}
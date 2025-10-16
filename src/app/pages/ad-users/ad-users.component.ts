import {Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption, SortEvent } from '../../shared/sort-dropdown/sort-dropdown.component';
import { UserService, UserEV } from '../../core/services/user.service';
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
export class AdminUsersPage implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer!: ElementRef;

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

  // Para paginación dinámica (de la rama de tu compañero)
  currentPage = 1;
  pageSize = 5; // Valor inicial, se calculará dinámicamente
  totalUsuarios = 0;

  // Constantes para el cálculo (de la rama de tu compañero)
  private readonly HEADER_HEIGHT = 64;
  private readonly TITLE_SECTION_HEIGHT = 80;
  private readonly SEARCH_SECTION_HEIGHT = 80;
  private readonly TABLE_HEADER_HEIGHT = 45;
  private readonly ROW_HEIGHT = 59;
  private readonly PAGINATION_HEIGHT = 80;
  private readonly PADDING = 48;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    // Calcular el tamaño de página inicial
    this.calcularPageSize();

    // Recalcular cuando cambie el tamaño de la ventana
    setTimeout(() => this.calcularPageSize(), 100);
  }

  /**
   * Calcula cuántas filas caben en la pantalla para paginación dinámica
   */
  calcularPageSize(): void {
    // Obtener la altura disponible para la tabla
    const windowHeight = window.innerHeight;

    const availableHeight = windowHeight
      - this.HEADER_HEIGHT
      - this.TITLE_SECTION_HEIGHT
      - this.SEARCH_SECTION_HEIGHT
      - this.TABLE_HEADER_HEIGHT
      - this.PAGINATION_HEIGHT
      - this.PADDING;

    // Calcular cuántas filas completas caben
    const filasQueCaben = Math.floor(availableHeight / this.ROW_HEIGHT);

    // Establecer un mínimo de 5 filas y un máximo de 25 para mejor UX
    this.pageSize = Math.max(5, Math.min(filasQueCaben, 25));

    // Si estamos en una página que ya no existe después del recálculo, volver a la última válida
    const totalPaginasNuevas = Math.ceil(this.totalUsuarios / this.pageSize);
    if (this.currentPage > totalPaginasNuevas && totalPaginasNuevas > 0) {
      this.currentPage = totalPaginasNuevas;
    }

    console.log(`Altura disponible: ${availableHeight}px, Filas por página: ${this.pageSize}`);
  }

  // ======================================== 
  // MÉTODOS DE CARGA DE DATOS
  // ========================================

  /**
   * Carga usuarios desde la base de datos
   */
  cargarUsuarios(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.totalUsuarios = data.length;
        
        // Transformar UserEV a User para compatibilidad con filtros/búsqueda
        this.allUsers = this.transformarUsuarios(data);
        this.filteredUsers = [...this.allUsers];
        
        this.isLoading = false;
        console.log(`Usuarios cargados: ${this.usuarios.length}`);

        // Recalcular el pageSize después de cargar los datos
        setTimeout(() => this.calcularPageSize(), 100);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        
        // Mantener arrays vacíos cuando hay error
        this.usuarios = [];
        this.allUsers = [];
        this.filteredUsers = [];
        this.totalUsuarios = 0;
        
        this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
        this.isLoading = false;
        
        // Recalcular pageSize incluso con error para mantener UI consistente
        setTimeout(() => this.calcularPageSize(), 100);
      }
    });
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
      birthDate: this.formatearFecha(usuario.fechaNacimiento),
      role: usuario.esVip ? 'VIP' : 'Estándar',
      status: usuario.activo ? 'activo' : 'bloqueado'
    }));
  }

  /**
   * Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();

    return `${dia}/${mes}/${anio}`;
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
    // Handle navigation events emitted by sidebar component
    this.closeSidebar();
    switch(event) {
      case 'users':
        // already on users - maybe refresh
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
    this.calcularPageSize();
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
    
    // Resetear a la primera página cuando cambian los filtros
    this.currentPage = 1;
    
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
    console.log('Editar usuario:', id);
    // TODO: Implementar navegación a página de edición
    // this.router.navigate(['/ad-users/edit', id]);
  }

  /**
   * Elimina un usuario
   */
  eliminarUsuario(id: string): void {
    console.log('Eliminar usuario:', id);
    // TODO: Implementar diálogo de confirmación y eliminación
  }

}
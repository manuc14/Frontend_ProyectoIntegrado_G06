import {Component, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption } from '../../shared/sort-dropdown/sort-dropdown.component';
import { UserService, UserEV } from '../../core/services/user.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../core/utils/date-utils';
import { of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminListBase } from '../../core/base/admin-list.base';

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
  fullName: string;
}

@Component({
  selector: 'app-adusers',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminUsersPage extends AdminListBase<User> {

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

  // Datos originales de la BD
  usuarios: UserEV[] = [];

  constructor(
    protected override router: Router,
    private userService: UserService
  ) {
    super(router);
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.listarUsuarios()
      .pipe(
        tap((data: UserEV[]) => {
          this.usuarios = data;
          this.totalItems = data.length;
          this.allItems = this.transformarUsuarios(data);
          this.filteredItems = [...this.allItems];
        }),
        catchError((err: any) => {
          this.usuarios = [];
          this.allItems = [];
          this.filteredItems = [];
          this.totalItems = 0;
          this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
          return of([] as UserEV[]);
        }),
        finalize(() => {
          this.isLoading = false;
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
      birthDate: formatDateIsoToDDMMYYYY(usuario.fechaNacimiento),
      role: usuario.esVip ? 'VIP' : 'Estándar',
      status: usuario.activo ? 'activo' : 'bloqueado',
      fullName: `${usuario.nombre} ${usuario.apellidos}`
    }));
  }

  getSearchFields(): string[] {
    return ['name', 'lastName', 'alias', 'email', 'fullName'];
  }

  getFilterPredicate(item: User, filter: any): boolean {
    if (filter.groupId === 'role') return item.role === filter.value;
    if (filter.groupId === 'status') return item.status === filter.value;
    return true;
  }

  getSortValue(item: User, field: string): any {
    if (field === 'alias') {
      return String(item.alias).replace('@', '');
    }
    if (field === 'birthDate') {
      return toTimestampFromString(item.birthDate);
    }
    return (item as any)[field];
  }

  getItemId(item: User): string {
    return item.id;
  }

  getEntityName(): string {
    return 'usuarios';
  }

  getCurrentRoute(): string {
    return '/ad-users';
  }

  // Override para navegación específica
  override navigateToUsers(): void {
    this.closeSidebar();
    window.location.reload();
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    switch(event) {
      case 'users':
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }

  // Getters para compatibilidad con template
  get usuariosPaginados(): User[] {
    return this.itemsPaginados;
  }

  get filteredUsers(): User[] {
    return this.filteredItems;
  }

  get allUsers(): User[] {
    return this.allItems;
  }

  override get totalPaginas(): number {
    return super.totalPaginas;
  }

  override get rangoMostrado(): string {
    return super.rangoMostrado;
  }

  // Use base class trackByItemId (inherited)

  override getNoResultsMessage(): string {
    if (this.error) {
      return this.error;
    }
    return super.getNoResultsMessage();
  }

  override getClearButtonText(): string {
    if (this.error) {
      return 'Reintentar conexión';
    }
    return super.getClearButtonText();
  }

  override clearSearchAndFilters(): void {
    if (this.error) {
      this.loadData();
      return;
    }
    super.clearSearchAndFilters();
  }

  editarUsuario(id: string): void {
    // Navegar a la página de edición de usuarios pasando el id
    this.router.navigate(['/ad-users-edit', id]);
  }
}
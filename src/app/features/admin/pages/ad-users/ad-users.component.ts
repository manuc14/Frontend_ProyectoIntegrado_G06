import {Component, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../../../core/animations/animations';
import { SearchBarComponent } from '../../../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent } from '../../../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent } from '../../../../shared/sort-dropdown/sort-dropdown.component';
import { AdminEntityService, UserEV } from '../../../../core/services/admin-entity.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../../../core/utils/date-utils';

import { map } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminListBase } from '../../../../core/base/admin-list.base';
import { ApiService } from '../../../../core/services/api.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { ADMIN_CONFIG } from '../../../../core/constants/admin-config.constants';

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

  // Configuración de filtros usando constantes centralizadas
  filterGroups = ADMIN_CONFIG.filterGroups.users;

  // Opciones de ordenamiento usando constantes centralizadas
  sortOptions = ADMIN_CONFIG.sortOptions.users;

  constructor(
    protected override router: Router,
    private userService: AdminEntityService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private imageSelectorService: ImageSelectorService
  ) {
    super(router);
  }

  override ngOnInit(): void {
    // Verificar que haya token en sessionStorage
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    this.loadDataWithErrorHandling(
      () => this.userService.listarEntidades<UserEV>('user').pipe(
        map((data: UserEV[]) => this.mapUserData(data))
      ),
      ADMIN_CONFIG.entityNames.users
    );
  }

  private mapUserData(data: UserEV[]): User[] {
    return data.map(usuario => ({
      id: usuario.id,
      photo: this.imageSelectorService.getFullImageUrl(usuario.foto ?? '', 'avatar'),
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
    return [...ADMIN_CONFIG.searchFields.users];
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
    // Para otros campos, devolver como string
    return String((item as any)[field] ?? '');
  }

  getItemId(item: User): string {
    return item.id;
  }

  getEntityName(): string {
    return ADMIN_CONFIG.entityNames.users;
  }

  getCurrentRoute(): string {
    return ADMIN_CONFIG.currentRoutes.users;
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    if (event === 'users') {
      window.location.reload();
      return;
    }
    const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes];
    if (route) {
      this.router.navigate([route]);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }

  // Use base class trackByItemId (inherited)

  override clearSearchAndFilters(): void {
    if (this.error) {
      this.loadData();
      return;
    }
    super.clearSearchAndFilters();
  }

  editarUsuario(id: string): void {
    this.navigateTo('users', 'edit', id);
  }

  addNewUser(): void {
    this.navigateTo('users', 'add');
  }
}

import {Component, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../../../core/animations/animations';
import { SearchBarComponent } from '../../../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent } from '../../../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent } from '../../../../shared/sort-dropdown/sort-dropdown.component';
import { AdminEntityService, AdminEV } from '../../../../core/services/admin-entity.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../../../core/utils/date-utils';

import { map } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminListBase } from '../../../../core/base/admin-list.base';
import { BackendUser, ApiService } from '../../../../core/services/api.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { ADMIN_CONFIG } from '../../../../core/constants/admin-config.constants';

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminAdmsPage extends AdminListBase<AdminEV> {

  // Usuario actual
  currentUser: BackendUser | null = null;

  // Configuración de filtros usando constantes centralizadas
  filterGroups = ADMIN_CONFIG.filterGroups.admins;

  // Opciones de ordenamiento usando constantes centralizadas
  sortOptions = ADMIN_CONFIG.sortOptions.admins;

  constructor(
    protected override router: Router,
    private adminService: AdminEntityService,
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

    // Cargar usuario actual
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing currentUser:', e);
        this.currentUser = null;
      }
    }

    this.loadData();
  }

  loadData(): void {
    this.loadDataWithErrorHandling(
      () => this.adminService.listarEntidades<AdminEV>('admin').pipe(
        map((data: AdminEV[]) => {
          let admins = this.mapAdminData(data);
          admins = this.filterOwnProfile(admins);
          return admins;
        })
      ),
      ADMIN_CONFIG.entityNames.admins
    );
  }

  private mapAdminData(data: AdminEV[]): AdminEV[] {
    return data.map(d => ({
      ...d,
      fechaNacimientoFormatted: formatDateIsoToDDMMYYYY((d as any).fechaNacimiento),
      fullName: `${d.nombre} ${d.apellidos}`
    } as AdminEV));
  }

  private filterOwnProfile(admins: AdminEV[]): AdminEV[] {
    if (!this.currentUser) return admins;
    return admins.filter(admin => admin.id !== this.currentUser!.id);
  }

  getSearchFields(): string[] {
    return [...ADMIN_CONFIG.searchFields.admins];
  }

  getFilterPredicate(item: AdminEV, filter: any): boolean {
    if (filter.groupId === 'department') return item.departamento === filter.value;
    if (filter.groupId === 'status') return item.activo === filter.value;
    return true;
  }

  getSortValue(item: AdminEV, field: string): any {
    // Para campos que podrían ser fechas, intentar convertir a timestamp
    if (field === 'fechaNacimiento' || field === 'fechaNacimientoFormatted') {
      return toTimestampFromString(String((item as any)[field])) ?? 0;
    }
    // Para otros campos, devolver como string
    return String((item as any)[field] ?? '');
  }

  getItemId(item: AdminEV): string {
    return item.id;
  }

  getEntityName(): string {
    return ADMIN_CONFIG.entityNames.admins;
  }

  getCurrentRoute(): string {
    return ADMIN_CONFIG.currentRoutes.admins;
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    if (event === 'admins') {
      window.location.reload();
      return;
    }
    const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes];
    if (route) {
      this.router.navigate([route]);
    }
  }

  addNewAdmin(): void {
    this.navigateTo('admins', 'add');
  }

  editarAdministrador(id: string): void {
    this.navigateTo('admins', 'edit', id);
  }

  eliminarAdministrador(id: string): void {
    this.deleteEntity(
      id,
      (id) => this.adminService.eliminarEntidad('admin', id),
      ADMIN_CONFIG.entityNames.admins
    );
  }

  /**
   * Obtiene la URL del avatar del administrador
   */
  getAvatarUrl(admin: AdminEV): string {
    return this.imageSelectorService.getFullImageUrl(admin.foto ?? '', 'avatar');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

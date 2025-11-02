import {Component, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../../../core/animations/animations';
import { SearchBarComponent } from '../../../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent } from '../../../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent } from '../../../../shared/sort-dropdown/sort-dropdown.component';
import { AdminEntityService, CreatorEC } from '../../../../core/services/admin-entity.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../../../core/utils/date-utils';

import { map } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminListBase } from '../../../../core/base/admin-list.base';
import { ApiService } from '../../../../core/services/api.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { ADMIN_CONFIG } from '../../../../core/constants/admin-config.constants';

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminCreatorsPage extends AdminListBase<CreatorEC> {

  // Configuración de filtros usando constantes centralizadas
  filterGroups = ADMIN_CONFIG.filterGroups.creators;

  // Opciones de ordenamiento usando constantes centralizadas
  sortOptions = ADMIN_CONFIG.sortOptions.creators;

  constructor(
    protected override router: Router,
    private creatorService: AdminEntityService,
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
      () => this.creatorService.listarEntidades<CreatorEC>('creator').pipe(
        map((data: CreatorEC[]) => this.mapCreatorData(data))
      ),
      ADMIN_CONFIG.entityNames.creators
    );
  }

  private mapCreatorData(data: CreatorEC[]): CreatorEC[] {
    return data.map(d => ({ ...d, fechaNacimientoFormatted: formatDateIsoToDDMMYYYY((d as any).fechaNacimiento), fullName: `${d.nombre} ${d.apellidos}` } as CreatorEC));
  }

  getSearchFields(): string[] {
    return [...ADMIN_CONFIG.searchFields.creators];
  }

  getFilterPredicate(item: CreatorEC, filter: any): boolean {
    if (filter.groupId === 'category') return item.especialidad === filter.value;
    if (filter.groupId === 'status') return item.activo === filter.value;
    return true;
  }

  getSortValue(item: CreatorEC, field: string): any {
    if (field === 'alias') {
      return String(item.alias).replace('@', '');
    }
    // Para campos que podrían ser fechas, intentar convertir a timestamp
    if (field === 'fechaNacimiento' || field === 'fechaNacimientoFormatted') {
      return toTimestampFromString(String((item as any)[field])) ?? 0;
    }
    // Para otros campos, devolver como string
    return String((item as any)[field] ?? '');
  }

  getItemId(item: CreatorEC): string {
    return item.id;
  }

  getEntityName(): string {
    return ADMIN_CONFIG.entityNames.creators;
  }

  getCurrentRoute(): string {
    return ADMIN_CONFIG.currentRoutes.creators;
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    if (event === 'creators') {
      window.location.reload();
      return;
    }
    const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes];
    if (route) {
      this.router.navigate([route]);
    }
  }

  addNewCreator(): void {
    this.navigateTo('creators', 'add');
  }

  editarCreador(id: string): void {
    this.navigateTo('creators', 'edit', id);
  }

  eliminarCreador(id: string): void {
    this.deleteEntity(
      id,
      (id) => this.creatorService.eliminarEntidad('creator', id),
      ADMIN_CONFIG.entityNames.creators
    );
  }

  /**
   * Obtiene la URL del avatar del creador
   */
  getAvatarUrl(creator: CreatorEC): string {
    return this.imageSelectorService.getFullImageUrl(creator.foto ?? '', 'avatar');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

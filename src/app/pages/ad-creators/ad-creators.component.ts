import {Component, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption } from '../../shared/sort-dropdown/sort-dropdown.component';
import { AdminEntityService, CreatorEC } from '../../core/services/admin-entity.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../core/utils/date-utils';
import { of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { ErrorContainerComponent } from '../../shared/error-container/error-container.component';
import { AdminListBase } from '../../core/base/admin-list.base';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent, ErrorContainerComponent],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminCreatorsPage extends AdminListBase<CreatorEC> {

  // Estado para operaciones de guardado/eliminación
  isSaving: boolean = false;

  // Configuración de filtros como grupos para creadores
  filterGroups: FilterGroup[] = [
    {
      id: 'category',
      label: 'Categoría',
      mutuallyExclusive: true,
      filters: [
        { id: 'musica', label: 'Música', value: 'Música', active: false },
        { id: 'educacion', label: 'Educación', value: 'Educación', active: false },
        { id: 'tecnologia', label: 'Tecnología', value: 'Tecnología', active: false },
        { id: 'cocina', label: 'Cocina', value: 'Cocina', active: false },
        { id: 'deportes', label: 'Deportes', value: 'Deportes', active: false },
        { id: 'arte', label: 'Arte', value: 'Arte', active: false },
        { id: 'ciencia', label: 'Ciencia', value: 'Ciencia', active: false },
        { id: 'viajes', label: 'Viajes', value: 'Viajes', active: false }
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

  // Opciones de ordenamiento para creadores
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
    { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
    { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
    { id: 'category-asc', label: 'Categoría A-Z', field: 'especialidad', direction: 'asc' },
    { id: 'category-desc', label: 'Categoría Z-A', field: 'especialidad', direction: 'desc' }
  ];

  constructor(
    protected override router: Router,
    private creatorService: AdminEntityService,
    private route: ActivatedRoute,
    private apiService: ApiService
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
    this.isLoading = true;
    this.error = null;

    this.creatorService.listarCreadores()
      .pipe(
        tap((data: CreatorEC[]) => {
          console.log('Creadores recibidos del backend:', data);
          this.allItems = data.map(d => ({ ...d, fechaNacimientoFormatted: formatDateIsoToDDMMYYYY((d as any).fechaNacimiento), fullName: `${d.nombre} ${d.apellidos}` } as CreatorEC));
          this.filteredItems = [...this.allItems];
        }),
        catchError((err: any) => {
          this.allItems = [];
          this.filteredItems = [];
          this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté funcionando.';
          return of([] as CreatorEC[]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  getSearchFields(): string[] {
    return ['nombre', 'apellidos', 'alias', 'correo', 'especialidad', 'fullName'];
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
    return 'creadores';
  }

  getCurrentRoute(): string {
    return '/ad-creators';
  }

  // Override para navegación específica
  override navigateToCreators(): void {
    this.closeSidebar();
    window.location.reload();
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    switch(event) {
      case 'users':
        this.router.navigate(['/ad-users']);
        break;
      case 'admins':
        this.router.navigate(['/ad-admin']);
        break;
      case 'creators':
        window.location.reload();
        break;
      default:
        break;
    }
  }

  addNewCreator(): void {
    this.router.navigate(['/ad-creators-add']);
  }

  editarCreador(id: string): void {
    this.router.navigate(['/ad-creators-edit', id]);
  }

  eliminarCreador(id: string): void {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar la cuenta? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    this.isSaving = true;
    this.creatorService.eliminarCreador(id)
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: (resp: any) => {
          const respHasError = resp && (
            resp.error ||
            resp.success === false ||
            resp.ok === false ||
            (typeof resp.message === 'string' && /error|fail|no se|no encontrado|not found/i.test(resp.message))
          );
          if (respHasError) {
            console.error('Backend responded with error while deleting creator:', resp);
            this.error = (resp && (resp.message || resp.error)) || 'No se pudo eliminar el creador. Intenta de nuevo.';
            return;
          }
          this.allItems = this.allItems.filter(c => c.id !== id);
          this.filteredItems = this.filteredItems.filter(c => c.id !== id);
          alert('Creador eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar creador:', err);
          this.error = 'No se pudo eliminar el creador. Intenta de nuevo.';
        }
      });
  }

  // Getters para compatibilidad con template
  get creadoresPaginados(): CreatorEC[] {
    return this.itemsPaginados;
  }

  get filteredCreators(): CreatorEC[] {
    return this.filteredItems;
  }

  get allCreators(): CreatorEC[] {
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
    return super.getNoResultsMessage();
  }

  override getClearButtonText(): string {
    return super.getClearButtonText();
  }

  override clearSearchAndFilters(): void {
    super.clearSearchAndFilters();
  }

  /**
   * Obtiene la URL del avatar del creador
   */
  getAvatarUrl(creator: CreatorEC): string {
    return this.apiService.getAvatarUrl(creator.foto);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}
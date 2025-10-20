import {Component, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterButtonsComponent, FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortDropdownComponent, SortOption } from '../../shared/sort-dropdown/sort-dropdown.component';
import { AdminEntityService, AdminEV } from '../../core/services/admin-entity.service';
import { formatDateIsoToDDMMYYYY, toTimestampFromString } from '../../core/utils/date-utils';
import { of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { ErrorContainerComponent } from '../../shared/error-container/error-container.component';
import { AdminListBase } from '../../core/base/admin-list.base';
import { BackendUser } from '../../core/services/api.service';

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, FilterButtonsComponent, SortDropdownComponent, AdminHeaderComponent, AdminSidebarComponent, ErrorContainerComponent],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminAdmsPage extends AdminListBase<AdminEV> {

  // Estado para operaciones de guardado/eliminación
  isSaving: boolean = false;

  // Usuario actual
  currentUser: BackendUser | null = null;

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

  // Propiedades para ordenamiento - actualizadas para AdminEV
  sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
    { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
    { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
    { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
    { id: 'department-asc', label: 'Departamento A-Z', field: 'departamento', direction: 'asc' },
    { id: 'department-desc', label: 'Departamento Z-A', field: 'departamento', direction: 'desc' }
  ];

  constructor(
    protected override router: Router,
    private adminService: AdminEntityService,
    private route: ActivatedRoute
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
    this.isLoading = true;
    this.error = null;

    this.adminService.listarAdministradores()
      .pipe(
        tap((data: AdminEV[]) => {
          let admins = data.map(d => ({ ...d, fechaNacimientoFormatted: formatDateIsoToDDMMYYYY((d as any).fechaNacimiento), fullName: `${d.nombre} ${d.apellidos}` } as AdminEV));

          // Filtrar para excluir el perfil propio
          if (this.currentUser) {
            admins = admins.filter(admin => admin.id !== this.currentUser!.id);
          }

          this.allItems = admins;
          this.totalItems = admins.length;
          this.filteredItems = [...this.allItems];
        }),
        catchError((err: any) => {
          this.error = 'Error al cargar los administradores. Por favor, intente nuevamente.';
          return of([] as AdminEV[]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  getSearchFields(): string[] {
    return ['nombre', 'apellidos', 'correo', 'departamento', 'fullName'];
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
    return 'administradores';
  }

  getCurrentRoute(): string {
    return '/ad-admin';
  }

  // Override para navegación específica
  override navigateToAdmins(): void {
    this.closeSidebar();
    window.location.reload();
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    switch (event) {
      case 'users':
        this.router.navigate(['/ad-users']);
        break;
      case 'admins':
        window.location.reload();
        break;
      case 'creators':
        this.router.navigate(['/ad-creators']);
        break;
      default:
        break;
    }
  }

  addNewAdmin(): void {
    this.router.navigate(['/ad-admin-add']);
  }

  editarAdministrador(id: string): void {
    this.router.navigate(['/ad-admin-edit', id]);
  }

  eliminarAdministrador(id: string): void {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar la cuenta? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    this.isSaving = true;
    this.adminService.eliminarAdministrador(id)
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: (resp: any) => {
          // Manejo defensivo: detectar indicios de fallo en la respuesta incluso con 2xx
          const respHasError = resp && (
            resp.error ||
            resp.success === false ||
            resp.ok === false ||
            (typeof resp.message === 'string' && /error|fail|no se|no encontrado|no encontrado|not found/i.test(resp.message))
          );
          if (respHasError) {
            console.error('Backend responded with error while deleting admin:', resp);
            this.error = (resp && (resp.message || resp.error)) || 'No se pudo eliminar el administrador. Intenta de nuevo.';
            return;
          }
          // Recargar la lista para mostrar cambios
          this.loadData();
          alert('Administrador eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar administrador:', err);
          this.error = 'No se pudo eliminar el administrador. Intenta de nuevo.';
        }
      });
  }

  // Getters para compatibilidad con template
  get adminsPaginados(): AdminEV[] {
    return this.itemsPaginados;
  }

  get filteredAdmins(): AdminEV[] {
    return this.filteredItems;
  }

  get allAdmins(): AdminEV[] {
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

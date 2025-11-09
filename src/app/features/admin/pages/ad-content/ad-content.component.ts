import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../../../core/animations/animations';
import { SearchBarComponent } from '../../../../shared/search-bar/search-bar.component';
import { SortDropdownComponent } from '../../../../shared/sort-dropdown/sort-dropdown.component';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminListBase } from '../../../../core/base/admin-list.base';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido, ResolucionVideo, TipoContenido } from '../../../../core/models/contenido.models';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { ADMIN_CONFIG } from '../../../../core/constants/admin-config.constants';
import { allConditionsTrue, anyConditionTrue, hasElements } from '../../../../core/utils/validation.helpers';

// Interfaz para la tabla de contenidos
interface ContentRow {
  id: string;
  thumbnail: string;
  title: string;
  description: string;
  creator: string;
  category: string;
  rating: number;
  isPremium: boolean;
  quality: ResolucionVideo | 'Audio' | 'SD';
  tags: string[];
  isAvailable: boolean;
  fechaEstado: Date;
  tipo: TipoContenido;
  duration: number;
  ageRestriction: number;
  disponibleHasta: Date | null;
}

@Component({
  selector: 'app-ad-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchBarComponent,
    SortDropdownComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    FilterPillComponent
  ],
  templateUrl: './ad-content.component.html',
  styleUrl: './ad-content.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminContentPage extends AdminListBase<ContentRow> implements OnInit {
  
  // Filtros
  selectedContentType: TipoContenido = 'VIDEO';
  filtroPremium = false;
  filtroCalidad: ResolucionVideo | null = null;
  filtroCategoria: string | null = null;
  filtroEdad: number | null = null;
  
  // Opciones para filtros usando constantes
  readonly opcionesCalidad = ADMIN_CONFIG.qualityOptions;
  readonly opcionesCategorias = ADMIN_CONFIG.categoryOptions;
  readonly opcionesEdad = ADMIN_CONFIG.ageRestrictionOptions;
  
  // Control de dropdowns
  dropdownCalidadAbierto = false;
  dropdownCategoriaAbierto = false;
  dropdownEdadAbierto = false;
  
  // Configuración usando constantes centralizadas
  sortOptions = ADMIN_CONFIG.sortOptions.content;
  filterGroups = ADMIN_CONFIG.filterGroups.content;
  
  constructor(
    protected override router: Router,
    private catalogoService: CatalogoService,
    private imageSelectorService: ImageSelectorService
  ) {
    super(router);
  }
  
  override ngOnInit(): void {
    if (!sessionStorage.getItem('authToken')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
  }
  
  loadData(): void {
  this.isLoading = true;
  this.error = null;

  forkJoin({
    publicos: this.catalogoService.getContenidosPublicos(),
    privados: this.catalogoService.getContenidosPrivados()
  }).pipe(
    map(({ publicos, privados }) => this.mapContentData([...publicos, ...privados])),
    finalize(() => this.isLoading = false)
  ).subscribe({
    next: (data) => {
      this.allItems = data;
      this.applyContentFilters();
    },
    error: () => {
      this.error = 'Error al cargar los contenidos.';
      this.allItems = [];
      this.filteredItems = [];
      this.totalItems = 0;
    }
  });
}
  
  private mapContentData(data: Contenido[]): ContentRow[] {
    return data.map(contenido => this.mapSingleContent(contenido));
  }

  private mapSingleContent(contenido: Contenido): ContentRow {
    return {
      id: contenido._id,
      thumbnail: this.imageSelectorService.getFullImageUrl(contenido.miniaturaUrl || contenido.foto, 'thumbnail'),
      title: contenido.titulo,
      description: contenido.descripcion,
      creator: contenido.creador?.nombre ?? 'Desconocido',
      category: contenido.categoria ?? 'Sin categoría',
      rating: 5, // Placeholder
      isPremium: contenido.contenidoVip,
      quality: contenido.resolucion ?? (contenido.tipo === 'AUDIO' ? 'Audio' : 'SD'),
      tags: contenido.tags ?? [],
      isAvailable: contenido.estado === 'PUBLICO',
      fechaEstado: contenido.fechaEstado,
      tipo: contenido.tipo,
      duration: contenido.duracion,
      ageRestriction: contenido.restriccionEdad,
      disponibleHasta: contenido.disponibleHasta
    };
  }
  
  cambiarTipoContenido(tipo: TipoContenido): void {
    this.selectedContentType = tipo;
    if (tipo === 'AUDIO') this.filtroCalidad = null;
    this.applyContentFilters();
  }
  
  toggleFiltroPremium(): void {
    this.filtroPremium = !this.filtroPremium;
    this.applyContentFilters();
  }

  toggleFiltro(tipo: 'calidad' | 'categoria' | 'edad', valor: any): void {
    // Early return for calidad filter
    if (tipo === 'calidad') {
      this.filtroCalidad = this.filtroCalidad === valor ? null : valor;
      this.dropdownCalidadAbierto = false;
      this.applyContentFilters();
      return;
    }

    // Early return for categoria filter
    if (tipo === 'categoria') {
      this.filtroCategoria = this.filtroCategoria === valor ? null : valor;
      this.dropdownCategoriaAbierto = false;
      this.applyContentFilters();
      return;
    }

    // Early return for edad filter
    if (tipo === 'edad') {
      this.filtroEdad = this.filtroEdad === valor ? null : valor;
      this.dropdownEdadAbierto = false;
      this.applyContentFilters();
    }
  }

  
  cerrarDropdowns(): void {
    this.dropdownCalidadAbierto = false;
    this.dropdownCategoriaAbierto = false;
    this.dropdownEdadAbierto = false;
  }
  
  get textoBotonCalidad(): string {
    return this.filtroCalidad ?? 'Calidad';
  }
  
  get textoBotonCategoria(): string {
    return this.filtroCategoria ?? 'Categoría';
  }

  get textoBotonEdad(): string {
    return this.filtroEdad !== null ? `${this.filtroEdad}+` : 'Edad';
  }
  
  private matchesAllFilters(item: ContentRow): boolean {
    const searchTerm = this.searchTerm?.toLowerCase();
    const searchMatch = !searchTerm ||
      anyConditionTrue([
        item.title.toLowerCase().includes(searchTerm),
        item.creator.toLowerCase().includes(searchTerm),
        item.category.toLowerCase().includes(searchTerm)
      ]);

    return allConditionsTrue([
      item.tipo === this.selectedContentType,
      !this.filtroPremium || item.isPremium,
      !this.filtroCalidad || item.quality === this.filtroCalidad,
      !this.filtroCategoria || item.category === this.filtroCategoria,
      this.filtroEdad === null || item.ageRestriction === this.filtroEdad,
      searchMatch
    ]);
  }

  private applyContentFilters(): void {
    this.filteredItems = this.allItems.filter(item => this.matchesAllFilters(item));
    this.currentPage = 1;
    this.totalItems = this.filteredItems.length;
  }

  
  // Métodos abstractos requeridos por AdminListBase
  getSearchFields(): string[] {
    return [...ADMIN_CONFIG.searchFields.content];
  }
  
  getFilterPredicate(): boolean {
    return true;
  }
  
  getSortValue(item: ContentRow, field: string): any {
    return (item as any)[field];
  }
  
  getItemId(item: ContentRow): string {
    return item.id;
  }
  
  getEntityName(): string {
    return ADMIN_CONFIG.entityNames.content;
  }
  
  getCurrentRoute(): string {
    return ADMIN_CONFIG.currentRoutes.content;
  }
  
  override get itemsPaginados(): ContentRow[] {
    return this.filteredItems;
  }
  
  override get totalPaginas(): number {
    return 1;
  }
  
  override getNoResultsMessage(): string {
    return 'No se encontraron contenidos';
  }
  
  override getClearButtonText(): string {
    const activeFilters = [this.searchTerm, this.filtroPremium, this.filtroCalidad,
                           this.filtroCategoria, this.filtroEdad];
    return hasElements(activeFilters.filter(f => f)) ? 'Limpiar filtros' : '';
  }
  
  override clearSearchAndFilters(): void {
    this.searchTerm = '';
    this.filtroPremium = false;
    this.filtroCalidad = null;
    this.filtroCategoria = null;
    this.filtroEdad = null;
    this.applyContentFilters();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }

  override handleNav(event: string): void {
    this.closeSidebar();
    const route = ADMIN_CONFIG.navRoutes[event as keyof typeof ADMIN_CONFIG.navRoutes]?.base;
    if (route) this.router.navigate([route]);
  }
  
  formatExpiryDate(date: Date | null): string {
    if (!date) return '—';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}

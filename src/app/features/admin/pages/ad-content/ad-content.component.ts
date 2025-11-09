import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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
  filtroEdad: number | null = null; // Filtro de restricción de edad (>= valor)
  private readonly edadesCiclo: number[] = [0, 7, 13, 18];
  
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
      map(({ publicos, privados }) => this.mapContentData([...publicos, ...privados]))
    ).subscribe({
      next: (data) => {
        this.allItems = data;
        this.applyContentFilters();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Error al cargar los contenidos.';
        this.isLoading = false;
        this.allItems = [];
        this.filteredItems = [];
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
      ageRestriction: contenido.restriccionEdad
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
  
  seleccionarCalidad(calidad: ResolucionVideo): void {
    this.filtroCalidad = this.filtroCalidad === calidad ? null : calidad;
    this.dropdownCalidadAbierto = false;
    this.applyContentFilters();
  }
  
  seleccionarCategoria(categoria: string): void {
    this.filtroCategoria = this.filtroCategoria === categoria ? null : categoria;
    this.dropdownCategoriaAbierto = false;
    this.applyContentFilters();
  }

  seleccionarEdad(edad: number): void {
    this.filtroEdad = this.filtroEdad === edad ? null : edad;
    this.dropdownEdadAbierto = false;
    this.applyContentFilters();
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
  
  private applyContentFilters(): void {
    this.filteredItems = this.allItems.filter(item => {
      const matchesType = item.tipo === this.selectedContentType;
      const matchesPremium = !this.filtroPremium || item.isPremium;
      const matchesQuality = !this.filtroCalidad || item.quality === this.filtroCalidad;
      const matchesCategory = !this.filtroCategoria || item.category === this.filtroCategoria;
      const matchesAge = this.filtroEdad === null || item.ageRestriction === this.filtroEdad;
      const matchesSearchTerm = this.matchesSearch(item);

      return matchesType && matchesPremium && matchesQuality && 
             matchesCategory && matchesAge && matchesSearchTerm;
    });

    this.currentPage = 1;
    this.totalItems = this.filteredItems.length;
  }

  private matchesSearch(item: ContentRow): boolean {
    if (!this.searchTerm) return true;
    const term = this.searchTerm.toLowerCase();
    return [item.title, item.creator, item.category]
      .some(field => field.toLowerCase().includes(term));
  }
  
  override onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyContentFilters();
  }
  
  override onClearSearch(): void {
    this.searchTerm = '';
    this.applyContentFilters();
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
    if (this.error) return 'Reintentar';
    return this.hasActiveFilters() ? 'Limpiar filtros' : '';
  }

  private hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filtroPremium || this.filtroCalidad || 
              this.filtroCategoria || this.filtroEdad);
  }
  
  override clearSearchAndFilters(): void {
    if (this.error) {
      this.loadData();
      return;
    }
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
    const route = (ADMIN_CONFIG.navRoutes as any)[event as keyof typeof ADMIN_CONFIG.navRoutes]?.base;
    if (route) {
      this.router.navigate([route]);
    }
  }
  
  formatExpiryDate(date: Date): string {
    if (!date) return '—';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

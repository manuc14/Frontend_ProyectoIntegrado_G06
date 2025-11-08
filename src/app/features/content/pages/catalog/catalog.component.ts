import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { ContentCardComponent } from '../../../../shared/components/content-card/content-card.component';
import { ListActionButtonsComponent } from '../../../../shared/components/list-action-buttons/list-action-buttons.component';
import { PublicListService, ListaPublicaResponse } from '../../../../core/services/public-list.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Contenido, ResolucionVideo } from '../../../../core/models/contenido.models';

type SeccionActiva = 'VIDEO' | 'AUDIO';
type EdadPermitida = 0 | 7 | 13 | 18;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, FilterPillComponent, ContentCardComponent, ListActionButtonsComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isCreatorView = false;
  @Output() editList = new EventEmitter<string>();
  @Output() deleteList = new EventEmitter<string>();

  // Listas dinámicas cargadas desde BD
  listasPublicas: ListaPublicaResponse[] = [];
  errorCarga: string | null = null;
  
  seccionActiva: SeccionActiva = 'VIDEO';
  contenidoDestacado: Contenido | null = null;
  filtroPremium = false;
  filtroEdad: EdadPermitida | null = null;
  filtroCalidad: ResolucionVideo | null = null;
  readonly opcionesEdad: EdadPermitida[] = [7, 13, 18];
  readonly opcionesCalidad: ResolucionVideo[] = ['4K', '1080p', '720p', '480p'];
  dropdownEdadAbierto = false;
  dropdownCalidadAbierto = false;

  private edadUsuario = 18; // Edad por defecto

  @ViewChild('carouselContainer', { read: ElementRef }) carouselContainer?: ElementRef;
  private carouselInterval?: number;
  private readonly CAROUSEL_INTERVAL_MS = 3000;
  private readonly CAROUSEL_SCROLL_AMOUNT = 240;

  constructor(
    private publicListService: PublicListService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener la edad del usuario desde AuthService
    this.edadUsuario = this.authService.getUserAge();
    console.log('👤 Edad del usuario:', this.edadUsuario);
    
    this.cargarListasPublicas();
  }

  ngAfterViewInit(): void {
    this.carouselInterval = window.setInterval(() => this.autoScroll(), this.CAROUSEL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  /**
   * Carga las listas desde la base de datos
   * - Vista creador: GET /api/content-creator/listas (todas las listas, visibles y no visibles)
   * - Vista pública: GET /api/listas (solo listas públicas y visibles)
   */
  private cargarListasPublicas(): void {
    const observable = this.isCreatorView 
      ? this.publicListService.getMyLists()
      : this.publicListService.getPublicLists();

    observable.subscribe({
      next: (listas) => {
        this.errorCarga = listas.length === 0 ? 'No hay listas disponibles en este momento.' : null;
        this.listasPublicas = this.filtrarListas(listas);
        this.seleccionarContenidoDestacado();
      },
      error: () => {
        this.errorCarga = 'Error al cargar el catálogo. Por favor, intenta más tarde.';
        this.listasPublicas = [];
      }
    });
  }

  /**
   * Filtra listas por tipo de contenido y aplica filtros activos
   */
  private filtrarListas(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    return listas
      .map(lista => ({ ...lista, items: lista.items.filter(item => this.cumpleFiltros(item)) }))
      .filter(lista => lista.items.length > 0);
  }

  /**
   * Verifica si un contenido cumple con todos los filtros activos
   */
  private cumpleFiltros(item: Contenido): boolean {
    const cumpleTipo = item.tipo === this.seccionActiva;
    const cumpleEdadUsuario = this.isCreatorView || item.restriccionEdad <= this.edadUsuario;
    const cumpleFiltroEdad = this.filtroEdad === null || item.restriccionEdad === this.filtroEdad;
    const cumplePremium = !this.filtroPremium || item.contenidoVip;
    const cumpleCalidad = this.seccionActiva === 'AUDIO' || !this.filtroCalidad || item.resolucion === this.filtroCalidad;
    
    return cumpleTipo && cumpleEdadUsuario && cumpleFiltroEdad && cumplePremium && cumpleCalidad;
  }

  /**
   * Selecciona un contenido destacado aleatorio
   */
  private seleccionarContenidoDestacado(): void {
    const todosLosContenidos = this.listasPublicas.flatMap(lista => lista.items);
    if (todosLosContenidos.length > 0) {
      const randomIndex = Math.floor(Math.random() * todosLosContenidos.length);
      this.contenidoDestacado = todosLosContenidos[randomIndex];
    }
  }

  cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva = seccion;
    if (seccion === 'AUDIO') this.filtroCalidad = null;
    this.cargarListasPublicas();
  }

  toggleFiltroPremium(): void {
    this.filtroPremium = !this.filtroPremium;
    this.cargarListasPublicas();
  }

  seleccionarEdad(edad: EdadPermitida): void {
    this.filtroEdad = this.filtroEdad === edad ? null : edad;
    this.dropdownEdadAbierto = false;
    this.cargarListasPublicas();
  }

  seleccionarCalidad(calidad: ResolucionVideo): void {
    this.filtroCalidad = this.filtroCalidad === calidad ? null : calidad;
    this.dropdownCalidadAbierto = false;
    this.cargarListasPublicas();
  }

  private autoScroll(): void {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
    container.scrollBy({ left: isAtEnd ? -container.scrollLeft : this.CAROUSEL_SCROLL_AMOUNT, behavior: 'smooth' });
  }

  irABusqueda(): void {
    this.router.navigate(['/search']);
  }

  cerrarDropdowns(): void {
    this.dropdownEdadAbierto = false;
    this.dropdownCalidadAbierto = false;
  }

  get textoBotonEdad(): string {
    return this.filtroEdad !== null ? `${this.filtroEdad}+` : 'Edad';
  }

  get textoBotonCalidad(): string {
    return this.filtroCalidad ?? 'Calidad';
  }

  get listasFiltradas(): ListaPublicaResponse[] {
    return this.listasPublicas;
  }

  /**
   * Edita una lista existente
   * Almacena el ID en sessionStorage y navega a /edit-list
   */
  onEditList(listId: string): void {
    sessionStorage.setItem('editListId', listId);
    this.router.navigate(['/edit-list']);
  }

  /**
   * Elimina una lista después de confirmación
   * DELETE /api/content-creator/listas/eliminar/{id}
   */
  onDeleteList(listId: string): void {
    const lista = this.listasPublicas.find(l => l.id === listId);
    if (!lista) return;

    const confirmDelete = confirm(
      `¿Estás seguro de que quieres eliminar la lista "${lista.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmDelete) {
      this.publicListService.deleteList(listId).subscribe({
        next: () => {
          alert(`Lista "${lista.nombre}" eliminada correctamente.`);
          this.cargarListasPublicas();
        },
        error: () => alert('Error al eliminar la lista. Por favor, intenta de nuevo.')
      });
    }
  }
}

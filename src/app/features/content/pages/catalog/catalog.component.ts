import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { ContentCardComponent } from '../../../../shared/components/content-card/content-card.component';
import { ListActionButtonsComponent } from '../../../../shared/components/list-action-buttons/list-action-buttons.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
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
  
  seccionActiva: SeccionActiva = 'VIDEO';
  contenidoDestacado: Contenido | null = null;
  contenidoFiltrado: Contenido[] = [];
  
  filtroPremium = false;
  filtroEdad: EdadPermitida | null = null;
  filtroCalidad: ResolucionVideo | null = null;
  
  readonly opcionesEdad: EdadPermitida[] = [7, 13, 18];
  readonly opcionesCalidad: ResolucionVideo[] = ['4K', '1080p', '720p', '480p'];
  
  dropdownEdadAbierto = false;
  dropdownCalidadAbierto = false;

  @ViewChild('carouselContainer', { read: ElementRef }) carouselContainer?: ElementRef;
  private carouselInterval?: number;
  private readonly CAROUSEL_INTERVAL_MS = 3000;
  private readonly CAROUSEL_SCROLL_AMOUNT = 240;

  constructor(private catalogoService: CatalogoService, private router: Router) {}

  ngOnInit(): void {
    this.contenidoDestacado = this.catalogoService.getContenidoDestacado();
    this.aplicarFiltros();
  }

  ngAfterViewInit(): void {
    this.carouselInterval = window.setInterval(() => this.autoScroll(), this.CAROUSEL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva = seccion;
    if (seccion === 'AUDIO') this.filtroCalidad = null;
    this.aplicarFiltros();
  }

  toggleFiltroPremium(): void {
    this.filtroPremium = !this.filtroPremium;
    this.aplicarFiltros();
  }

  seleccionarEdad(edad: EdadPermitida): void {
    this.filtroEdad = this.filtroEdad === edad ? null : edad;
    this.dropdownEdadAbierto = false;
    this.aplicarFiltros();
  }

  seleccionarCalidad(calidad: ResolucionVideo): void {
    this.filtroCalidad = this.filtroCalidad === calidad ? null : calidad;
    this.dropdownCalidadAbierto = false;
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    const fuente = this.seccionActiva === 'VIDEO' 
      ? this.catalogoService.getVideos() 
      : this.catalogoService.getAudios();
    
    let resultado = this.catalogoService.filtrarPorEdad(fuente, 18);
    
    if (this.filtroEdad !== null) {
      resultado = resultado.filter(c => c.restriccionEdad === this.filtroEdad);
    }
    
    if (this.filtroPremium) {
      resultado = this.catalogoService.filtrarPremium(resultado, true);
    }
    
    if (this.seccionActiva === 'VIDEO' && this.filtroCalidad !== null) {
      resultado = this.catalogoService.filtrarPorCalidad(resultado, [this.filtroCalidad]);
    }
    
    this.contenidoFiltrado = resultado;
  }

  private autoScroll(): void {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;
    
    const scrollAmount = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10
      ? -container.scrollLeft
      : this.CAROUSEL_SCROLL_AMOUNT;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  irABusqueda(): void {
    this.router.navigate(['/search']);
  }

  cerrarDropdowns(): void {
    this.dropdownEdadAbierto = this.dropdownCalidadAbierto = false;
  }

  get textoBotonEdad(): string {
    return this.filtroEdad !== null ? `${this.filtroEdad}+` : 'Edad';
  }

  get textoBotonCalidad(): string {
    return this.filtroCalidad ?? 'Calidad';
  }

  get contenidoTendencias(): Contenido[] {
    return this.contenidoFiltrado.slice(0, 12);
  }

  get contenidoNuevosLanzamientos(): Contenido[] {
    return this.contenidoFiltrado.slice(12, 20);
  }

  get contenidoRecomendado(): Contenido[] {
    return this.contenidoFiltrado.slice(4, 12);
  }

  // Métodos para vista de creador - Simplificados
  onAddContent(section: string): void {
    alert(`Funcionalidad de añadir contenido a "${section}" en desarrollo`);
  }

  onEditList(section: string): void {
    alert(`Funcionalidad de editar lista "${section}" en desarrollo`);
  }

  onDeleteList(section: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la lista "${section}"? Esta acción no se puede deshacer.`)) {
      alert(`Lista "${section}" eliminada (funcionalidad en desarrollo)`);
    }
  }
}

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { ContentCardComponent } from '../../../../shared/components/content-card/content-card.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido, ResolucionVideo } from '../../../../core/models/contenido.models';

type SeccionActiva = 'VIDEO' | 'AUDIO';
type EdadPermitida = 0 | 7 | 13 | 18;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, FilterPillComponent, ContentCardComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy, AfterViewInit {
  seccionActiva: SeccionActiva = 'VIDEO';
  contenidoDestacado: Contenido | null = null;
  contenidoFiltrado: Contenido[] = [];
  
  filtroPremium = false;
  filtroEdad: EdadPermitida | null = null;
  filtroCalidad: ResolucionVideo[] = [];
  
  readonly opcionesEdad: EdadPermitida[] = [7, 13, 18];
  readonly opcionesCalidad: ResolucionVideo[] = ['4K', '1080p', '720p', '480p'];
  
  dropdownEdadAbierto = false;
  dropdownCalidadAbierto = false;

  @ViewChild('carouselContainer', { read: ElementRef }) carouselContainer?: ElementRef;
  private carouselInterval?: number;

  constructor(private catalogoService: CatalogoService, private router: Router) {}

  ngOnInit(): void {
    this.contenidoDestacado = this.catalogoService.getContenidoDestacado();
    this.aplicarFiltros();
  }

  ngAfterViewInit(): void {
    this.carouselInterval = window.setInterval(() => this.autoScroll(), 3000);
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva = seccion;
    if (seccion === 'AUDIO') this.filtroCalidad = [];
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

  toggleCalidad(calidad: ResolucionVideo): void {
    const index = this.filtroCalidad.indexOf(calidad);
    index > -1 ? this.filtroCalidad.splice(index, 1) : this.filtroCalidad.push(calidad);
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    const fuente = this.seccionActiva === 'VIDEO' ? this.catalogoService.getVideos() : this.catalogoService.getAudios();
    let resultado = this.catalogoService.filtrarPorEdad(fuente, 18);
    
    if (this.filtroEdad !== null) resultado = resultado.filter(c => c.restriccionEdad === this.filtroEdad);
    if (this.filtroPremium) resultado = this.catalogoService.filtrarPremium(resultado, true);
    if (this.seccionActiva === 'VIDEO' && this.filtroCalidad.length) {
      resultado = this.catalogoService.filtrarPorCalidad(resultado, this.filtroCalidad);
    }
    
    this.contenidoFiltrado = resultado;
  }

  private autoScroll(): void {
    const container = this.carouselContainer?.nativeElement;
    if (!container) return;
    
    const atEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
    container.scrollBy({ left: atEnd ? -container.scrollLeft : 240, behavior: 'smooth' });
  }

  pausarCarrusel(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  reanudarCarrusel(): void {
    this.carouselInterval = window.setInterval(() => this.autoScroll(), 3000);
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
    const len = this.filtroCalidad.length;
    if (len === 0) return 'Calidad';
    if (len === 1) return this.filtroCalidad[0];
    return `Calidad (${len})`;
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
}

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
import { allConditionsTrue } from '../../../../core/utils/validation.helpers';
import { PREDEFINED_TAGS } from '../../../../core/constants/form-limits';

type SeccionActiva = 'VIDEO' | 'AUDIO';
type EdadPermitida = 0 | 7 | 13 | 18;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, FilterPillComponent, ContentCardComponent, ListActionButtonsComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  @Input() isCreatorView = false;
  @Output() editList = new EventEmitter<string>();
  @Output() deleteList = new EventEmitter<string>();

  listasPublicas: ListaPublicaResponse[] = [];
  errorCarga: string | null = null;
  seccionActiva: SeccionActiva = 'VIDEO';
  contenidoDestacado: Contenido | null = null;
  filtroPremium = false;
  filtroEdad: EdadPermitida | null = null;
  filtroCalidad: ResolucionVideo | null = null;
  filtroEtiquetas: string[] = [];
  filtroEspecialidad: string | null = null;
  readonly opcionesEdad: EdadPermitida[] = [0, 7, 13, 18];
  readonly opcionesCalidad: ResolucionVideo[] = ['4K', '1080p', '720p', '480p'];
  readonly opcionesEtiquetas: readonly string[] = PREDEFINED_TAGS;
  readonly opcionesEspecialidad: string[] = ['Música', 'Educación', 'Tecnología', 'Cocina', 'Deportes', 'Arte', 'Ciencia', 'Viajes'];
  dropdownEdadAbierto = false;
  dropdownCalidadAbierto = false;
  dropdownEtiquetasAbierto = false;
  dropdownEspecialidadAbierto = false;
  private edadUsuario = 18;

  constructor(
    private publicListService: PublicListService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.edadUsuario = this.authService.getUserAge();
    this.cargarListasPublicas();
  }

  private cargarListasPublicas(): void {
    const observable = this.isCreatorView 
      ? this.publicListService.getMyLists()
      : this.publicListService.getPublicLists();

    observable.subscribe({
      next: (listas) => {
        // En vista de creador, filtrar solo listas públicas
        const listasFiltradas = this.isCreatorView 
          ? listas.filter(lista => lista.publica)
          : listas;
        
        this.listasPublicas = this.filtrarListas(listasFiltradas);
        this.errorCarga = this.listasPublicas.length === 0 ? 'No hay listas disponibles en este momento.' : null;
        this.seleccionarContenidoDestacado();
      },
      error: () => {
        this.errorCarga = 'Error al cargar el catálogo. Por favor, intenta más tarde.';
        this.listasPublicas = [];
        this.contenidoDestacado = null;
      }
    });
  }

  private filtrarListas(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    return listas
      .map(lista => ({ ...lista, items: lista.items.filter(item => this.cumpleFiltros(item)) }))
      .filter(lista => lista.items.length > 0);
  }

  private cumpleFiltros(item: Contenido): boolean {
    return allConditionsTrue([
      item.tipo === this.seccionActiva,
      this.isCreatorView || item.restriccionEdad <= this.edadUsuario,
      this.filtroEdad === null || item.restriccionEdad === this.filtroEdad,
      !this.filtroPremium || item.contenidoVip,
      this.seccionActiva !== 'VIDEO' || !this.filtroCalidad || item.resolucion === this.filtroCalidad,
      this.filtroEtiquetas.length === 0 || this.filtroEtiquetas.some(etiqueta => item.tags.includes(etiqueta)),
      this.filtroEspecialidad === null || item.categoria === this.filtroEspecialidad
    ]);
  }

  private seleccionarContenidoDestacado(): void {
    const todosLosContenidos = this.listasPublicas.flatMap(lista => lista.items);
    this.contenidoDestacado = todosLosContenidos.length > 0 
      ? todosLosContenidos[Math.floor(Math.random() * todosLosContenidos.length)]
      : null;
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

  toggleEtiqueta(etiqueta: string): void {
    const index = this.filtroEtiquetas.indexOf(etiqueta);
    if (index > -1) {
      this.filtroEtiquetas.splice(index, 1);
    } else {
      this.filtroEtiquetas.push(etiqueta);
    }
    this.cargarListasPublicas();
  }

  isEtiquetaSeleccionada(etiqueta: string): boolean {
    return this.filtroEtiquetas.includes(etiqueta);
  }

  seleccionarEspecialidad(especialidad: string): void {
    this.filtroEspecialidad = this.filtroEspecialidad === especialidad ? null : especialidad;
    this.dropdownEspecialidadAbierto = false;
    this.cargarListasPublicas();
  }

  irABusqueda(): void {
    this.router.navigate(['/search']);
  }

  cerrarDropdowns(): void {
    this.dropdownEdadAbierto = false;
    this.dropdownCalidadAbierto = false;
    this.dropdownEtiquetasAbierto = false;
    this.dropdownEspecialidadAbierto = false;
  }

  get textoBotonEdad(): string {
    return this.filtroEdad !== null ? `${this.filtroEdad}+` : 'Edad';
  }

  get textoBotonCalidad(): string {
    return this.filtroCalidad ?? 'Calidad';
  }

  get textoBotonEtiquetas(): string {
    if (this.filtroEtiquetas.length === 0) return 'Etiquetas';
    if (this.filtroEtiquetas.length === 1) return this.filtroEtiquetas[0];
    return `${this.filtroEtiquetas.length} seleccionadas`;
  }

  get textoBotonEspecialidad(): string {
    return this.filtroEspecialidad ?? 'Especialidad';
  }

  get listasFiltradas(): ListaPublicaResponse[] {
    return this.listasPublicas;
  }

  onEditList(listId: string): void {
    sessionStorage.setItem('editListId', listId);
    this.router.navigate(['/edit-list']);
  }

  onDeleteList(listId: string): void {
    const lista = this.listasPublicas.find(l => l.id === listId);

    // Early return if list not found
    if (!lista) return;

    // Early return if user cancels
    if (!confirm(`¿Estás seguro de que quieres eliminar la lista "${lista.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.publicListService.deleteList(listId).subscribe({
      next: () => {
        alert(`Lista "${lista.nombre}" eliminada correctamente.`);
        this.cargarListasPublicas();
      },
      error: () => alert('Error al eliminar la lista. Por favor, intenta de nuevo.')
    });
  }
}

import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FilterPillComponent } from '../../../../../shared/components/filter-pill/filter-pill.component';
import { ContentCardComponent } from '../../../../../shared/components/content-card/content-card.component';
import { ListActionButtonsComponent } from '../../../../../shared/components/list-action-buttons/list-action-buttons.component';
import { PublicListService, ListaPublicaResponse } from '../../../../../core/services/public-list.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Contenido, ResolucionVideo } from '../../../../../core/models/contenido.models';

type SeccionActiva = 'VIDEO' | 'AUDIO';
type EdadPermitida = 0 | 7 | 13 | 18;

@Component({
  selector: 'app-private-lists-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterPillComponent,
    ContentCardComponent,
    ListActionButtonsComponent
  ],
  templateUrl: './private-lists-content.component.html',
  styleUrls: ['./private-lists-content.component.scss']
})
export class PrivateListsContentComponent implements OnInit {
  @Output() editList = new EventEmitter<string>();
  @Output() deleteList = new EventEmitter<string>();

  listasPrivadas: ListaPublicaResponse[] = [];
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
  private edadUsuario = 18;

  constructor(
    private publicListService: PublicListService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.edadUsuario = this.authService.getUserAge();
    this.cargarListasPrivadas();
  }

  private cargarListasPrivadas(): void {
    this.publicListService.getPrivateLists().subscribe({
      next: (listas) => {
        this.listasPrivadas = this.filtrarListas(listas);
        this.errorCarga = this.listasPrivadas.length === 0 ? 'No tienes listas privadas. ¡Crea una!' : null;
        this.seleccionarContenidoDestacado();
      },
      error: () => {
        this.errorCarga = 'Error al cargar tus listas. Por favor, intenta más tarde.';
        this.listasPrivadas = [];
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
    return [
      item.tipo === this.seccionActiva,
      item.restriccionEdad <= this.edadUsuario,
      this.filtroEdad === null || item.restriccionEdad === this.filtroEdad,
      !this.filtroPremium || item.contenidoVip,
      this.seccionActiva !== 'VIDEO' || !this.filtroCalidad || item.resolucion === this.filtroCalidad
    ].every(Boolean);
  }

  private seleccionarContenidoDestacado(): void {
    const todosLosContenidos = this.listasPrivadas.flatMap(lista => lista.items);
    this.contenidoDestacado = todosLosContenidos.length > 0 
      ? todosLosContenidos[Math.floor(Math.random() * todosLosContenidos.length)]
      : null;
  }

  cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva = seccion;
    if (seccion === 'AUDIO') this.filtroCalidad = null;
    this.cargarListasPrivadas();
  }

  toggleFiltroPremium(): void {
    this.filtroPremium = !this.filtroPremium;
    this.cargarListasPrivadas();
  }

  cambiarFiltroEdad(edad: EdadPermitida | null): void {
    this.filtroEdad = edad;
    this.dropdownEdadAbierto = false;
    this.cargarListasPrivadas();
  }

  cambiarFiltroCalidad(calidad: ResolucionVideo | null): void {
    this.filtroCalidad = calidad;
    this.dropdownCalidadAbierto = false;
    this.cargarListasPrivadas();
  }

  onEditarLista(id: string): void {
    this.editList.emit(id);
  }

  onEliminarLista(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta lista?')) {
      this.publicListService.deletePrivateList(id).subscribe({
        next: () => {
          this.cargarListasPrivadas();
        },
        error: () => {
          alert('Error al eliminar la lista. Inténtalo de nuevo.');
        }
      });
    }
  }

  crearLista(): void {
    this.router.navigate(['/create-private-list']);
  }
}

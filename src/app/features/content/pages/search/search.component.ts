import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, finalize, tap } from 'rxjs/operators';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { InfoModalComponent } from '../../../../shared/components/info-modal/info-modal.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { TipoContenido, Contenido } from '../../../../core/models/contenido.models';

interface SearchResult {
  id: string;
  thumbnail: string;
  title: string;
  creator: string;
  tipo: TipoContenido;
  tags: string[];
  contenido?: Contenido; // Guardar el contenido completo para validación de creador
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, InfoModalComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  searchTerm = '';
  allContent: SearchResult[] = [];
  displayedResults: SearchResult[] = [];
  isLoading = false;
  isCreatorView = false;
  showIncompatibleModal = false;
  incompatibleMessage = '';

  constructor(
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private imageSelectorService: ImageSelectorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isCreatorView = this.authService.isCreator();
    this.loadContent();
  }

  private loadContent(): void {
    (this.isCreatorView
      ? forkJoin([
          this.catalogoService.getContenidosPublicos(),
          this.catalogoService.getContenidosPrivados()
        ]).pipe(map(([p, pr]) => [...p, ...pr]))
      : this.catalogoService.getContenidosPublicos()
    ).pipe(
      map(d => d.map(c => ({
        id: c._id,
        thumbnail: this.imageSelectorService.getFullImageUrl(c.miniaturaUrl || c.foto, 'thumbnail'),
        title: c.titulo,
        creator: c.creador?.nombre ?? 'Desconocido',
        tipo: c.tipo,
        tags: c.tags ?? [],
        contenido: c // Guardar el contenido completo
      }))),
      tap(d => this.displayedResults = this.allContent = d),
      finalize(() => this.isLoading = false)
    ).subscribe({ error: () => this.displayedResults = this.allContent = [] });
  }

  onSearch = () => {
    const t = this.searchTerm.toLowerCase().trim();
    this.displayedResults = t 
      ? this.allContent.filter(i => [i.title, i.creator].some(f => f.toLowerCase().includes(t)) || i.tags.some(tag => tag.toLowerCase().includes(t)))
      : [...this.allContent];
  };

  navigateToContent = (item: SearchResult) => {
    if (this.isCreatorView) {
      this.handleCreatorClick(item);
    } else {
      localStorage.setItem('currentContentId', item.id);
      this.router.navigate(['/content/preview']);
    }
  };

  /**
   * Maneja el click cuando es vista de creador
   * Valida que el tipo de contenido coincida antes de permitir edición
   */
  private handleCreatorClick(item: SearchResult): void {
    const user = this.authService.getCurrentUser();
    const creatorType = user?.tipoContenido?.toUpperCase();
    const contentType = item.tipo?.toUpperCase();

    // Si el creador y el contenido son del mismo tipo, permitir edición
    if (creatorType === contentType) {
      localStorage.setItem('currentContentId', item.id);
      this.router.navigate(['/edit-content']);
    } else {
      // Mostrar modal indicando incompatibilidad
      this.incompatibleMessage = `Eres un creador de ${creatorType?.toLowerCase() || 'contenido'} y este es un contenido de tipo ${contentType?.toLowerCase() || item.tipo}. Solo puedes editar contenido de tu mismo tipo.`;
      this.showIncompatibleModal = true;
    }
  }

  closeIncompatibleModal(): void {
    this.showIncompatibleModal = false;
  }

  get hasResults() { return !!this.displayedResults.length; }
}

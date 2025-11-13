import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, finalize, tap } from 'rxjs/operators';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { TipoContenido } from '../../../../core/models/contenido.models';

interface SearchResult {
  id: string;
  thumbnail: string;
  title: string;
  creator: string;
  tipo: TipoContenido;
  tags: string[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  searchTerm = '';
  allContent: SearchResult[] = [];
  displayedResults: SearchResult[] = [];
  isLoading = false;

  constructor(
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private imageSelectorService: ImageSelectorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    (this.authService.isCreator()
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
        tags: c.tags ?? []
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
    const isC = this.authService.isCreator();
    if (!isC) {
      localStorage.setItem('currentContentId', item.id);
    }
    this.router.navigate(
      isC ? ['/creator/catalog'] : ['/content/preview'],
      { queryParams: isC ? {} : { id: item.id } }
    );
  };

  get hasResults() { return !!this.displayedResults.length; }
}

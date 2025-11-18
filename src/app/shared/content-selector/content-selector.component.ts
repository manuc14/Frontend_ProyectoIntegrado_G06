import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { buttonHover, buttonPress } from '../../core/animations/animations';
import { PublicListService } from '../../core/services/public-list.service';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SuggestedContent {
  id: string;
  thumbnail: string;
  title: string;
  channel: string;
  duration: string;
  added: boolean;
  tipo?: string;
  ficheroUrl?: string;
  autorId?: string;
  descripcion?: string;
}

type ContentType = 'VIDEO' | 'AUDIO';

@Component({
  selector: 'app-content-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <ng-container *ngIf="showTypeToggle">
      <div class="content-type-section">
        <div class="content-type-label">Tipo de contenido *</div>
        <div class="content-type-buttons">
          <button
            type="button"
            class="type-btn"
            [class.active]="selectedContentType === 'VIDEO'"
            (click)="onContentTypeChange('VIDEO')"
            [@buttonHover]
            [@buttonPress]>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
            </svg>
            <span>Video</span>
          </button>
          <button
            type="button"
            class="type-btn"
            [class.active]="selectedContentType === 'AUDIO'"
            (click)="onContentTypeChange('AUDIO')"
            [@buttonHover]
            [@buttonPress]>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
            </svg>
            <span>Audio</span>
          </button>
        </div>
      </div>
    </ng-container>

    <div class="search-container">
      <div class="search-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa3ad" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input
        type="text"
        class="search-input"
        placeholder="Buscar contenido…"
        [(ngModel)]="searchTerm"
      />
      <button
        type="button"
        *ngIf="searchTerm"
        class="clear-btn"
        (click)="onClearSearch()">
        ✕
      </button>
    </div>

    <div *ngIf="isLoadingContent" class="loading-state">
      <p>Cargando contenido disponible...</p>
    </div>

    <div *ngIf="!isLoadingContent" class="content-list-container">
      <div class="content-list">
        <div
          *ngFor="let content of filteredContent"
          class="content-item"
          [class.content-added]="content.added">
          <div class="content-thumbnail">
            <img
              [src]="content.thumbnail"
              [alt]="content.title"
              class="thumbnail-image"
            />
          </div>
          <div class="content-info">
            <div class="content-title">{{ content.title }}</div>
            <div class="content-meta">
              <span class="meta-channel">por {{ content.channel }}</span>
              <span class="meta-separator">•</span>
              <span class="meta-duration">{{ content.duration }}</span>
            </div>
          </div>
          <button
            type="button"
            class="toggle-button"
            [class.added]="content.added"
            (click)="toggleContent(content.id)"
            [@buttonHover]
            [@buttonPress]>
            <ng-container *ngIf="!content.added; else addedIcon">
              <svg
                class="toggle-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#2563eb"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </ng-container>
            <ng-template #addedIcon>
              <svg
                class="toggle-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#9aa3ad"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
              </svg>
            </ng-template>
          </button>
        </div>

        <div *ngIf="filteredContent.length === 0" class="no-results">
          <p>No hay {{ selectedContentType === 'VIDEO' ? 'videos' : 'audios' }} disponibles</p>
        </div>
      </div>
    </div>

    <div *ngIf="showSelectedCount && selectedContent.length > 0" class="selected-count">
      {{ selectedContent.length }} {{ selectedContent.length === 1 ? 'contenido seleccionado' : 'contenidos seleccionados' }}
    </div>
  `,
  styleUrls: ['./content-selector.component.scss'],
  animations: [buttonHover, buttonPress]
})
export class ContentSelectorComponent implements OnInit {
  @Input() showTypeToggle = false;
  @Input() showSelectedCount = false;
  @Input() initialType: ContentType = 'VIDEO';
  @Input() preselectedIds: string[] = [];
  @Input() preselectedContent: SuggestedContent[] = [];
  @Input() isPrivateMode = false; // Nuevo input para modo privado

  @Output() selectedChange = new EventEmitter<SuggestedContent[]>();
  @Output() typeChange = new EventEmitter<ContentType>();

  private readonly publicListService = inject(PublicListService);
  private readonly apiService = inject(ApiService);

  allContent: SuggestedContent[] = [];
  searchTerm = '';
  selectedContentType: ContentType = 'VIDEO';
  isLoadingContent = false;

  get filteredContent(): SuggestedContent[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.allContent.filter(content =>
      (content.tipo ?? '').toUpperCase() === this.selectedContentType &&
      (!term || content.title.toLowerCase().includes(term) || content.channel.toLowerCase().includes(term))
    );
  }

  get selectedContent(): SuggestedContent[] {
    return this.allContent.filter(c => c.added);
  }

  ngOnInit(): void {
    this.selectedContentType = this.initialType;
    this.isLoadingContent = true;

    // Usar el endpoint apropiado según el modo
    const observable = this.isPrivateMode 
      ? this.publicListService.getAvailableContentForUser()
      : this.publicListService.getAvailableContent();

    observable.subscribe({
      next: (contenidos: any[]) => {
        const availableContent = contenidos.map(c => this.mapContenidoToSuggestedContent(c));
        
        // Combinar contenidos disponibles con contenidos preseleccionados
        const combinedContent = [...availableContent];
        this.preselectedContent.forEach(preselected => {
          // Solo agregar si no existe ya en los contenidos disponibles
          if (!combinedContent.some(c => c.id === preselected.id)) {
            combinedContent.push(preselected);
          }
        });
        
        this.allContent = combinedContent;
        this.isLoadingContent = false;
        this.selectedChange.emit(this.selectedContent);
      },
      error: () => {
        this.isLoadingContent = false;
      }
    });
  }

  private mapContenidoToSuggestedContent(contenido: any): SuggestedContent {
    const { id, titulo, descripcion, ficheroUrl, miniaturaUrl, duracion, tipo, creador } = contenido;
    const contentId = id || contenido._id;
    const channel = creador?.nombre || 'Desconocido';

    return {
      id: contentId,
      thumbnail: this.buildThumbnailUrl(miniaturaUrl),
      title: titulo,
      channel,
      duration: this.formatDuration(duracion),
      added: this.preselectedIds.includes(contentId),
      tipo: contenido.tipoArchivo || tipo,
      ficheroUrl,
      autorId: channel,
      descripcion
    };
  }

  private formatDuration(duracion: number): string {
    const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
    const segundos = (duracion % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  private buildThumbnailUrl(miniaturaUrl?: string): string {
    if (!miniaturaUrl) {
      return 'assets/default-thumbnail.png';
    }
    return this.apiService.getFullThumbnailUrl(miniaturaUrl);
  }

  onContentTypeChange(type: ContentType): void {
    this.selectedContentType = type;
    this.allContent.forEach(c => (c.added = false));
    this.selectedChange.emit(this.selectedContent);
    this.typeChange.emit(type);
  }

  onClearSearch(): void {
    this.searchTerm = '';
  }

  toggleContent(contentId: string): void {
    const content = this.allContent.find(c => c.id === contentId);
    if (content) {
      content.added = !content.added;
      this.selectedChange.emit(this.selectedContent);
    }
  }
}

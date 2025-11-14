import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido } from '../../../../core/models/contenido.models';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-media-player',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './media-player.component.html',
  styleUrls: ['./media-player.component.scss']
})
export class MediaPlayerComponent implements OnInit, OnDestroy {
  // Solo necesario para AUDIO (que usa reproductor nativo)
  @ViewChild('audioElement', { static: false }) audioElement?: ElementRef<HTMLAudioElement>;

  private router = inject(Router);
  private catalogoService = inject(CatalogoService);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  contenido: Contenido | null = null;
  
  // Propiedades solo para AUDIO (reproductor nativo)
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  audioUrl: string | null = null;
  
  // Propiedad solo para VIDEO (reproductor embebido)
  embedUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    const contentId = localStorage.getItem('currentContentId');
    if (!contentId) {
      this.router.navigate(['/catalog']);
      return;
    }
    
    this.catalogoService.getContenidoById(contentId).subscribe({
      next: (contenido) => {
        this.contenido = contenido;
        // Solo generar embedUrl para VIDEOS (que siempre son URLs externas)
        if (contenido.tipo === 'VIDEO' && contenido.ficheroUrl) {
          this.generateEmbedUrl(contenido.ficheroUrl);
        }
        // Para AUDIO, descargar el archivo con autenticación
        if (contenido.tipo === 'AUDIO' && contenido.ficheroUrl) {
          this.loadAudioFile(contenido.ficheroUrl);
        }
      },
      error: () => { this.router.navigate(['/catalog']); }
    });
  }

  /**
   * Carga el archivo de audio a través de HttpClient para que pase por los interceptores (autenticación)
   */
  private loadAudioFile(fileUrl: string): void {
    this.http.get(fileUrl, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        // Crear una URL local (Object URL) que apunta al blob descargado
        this.audioUrl = URL.createObjectURL(blob);
      },
      error: (err) => {
        console.error('Error cargando archivo de audio:', err);
      }
    });
  }

  /**
   * Genera URL embebida para reproductores de plataformas externas (solo para VIDEO)
   * Soporta: YouTube, Vimeo, Dailymotion
   */
  private generateEmbedUrl(url: string): void {
    const configs: Record<string, { regex: RegExp; build: (match: RegExpExecArray) => string }> = {
      youtube: { 
        regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?]*)/,
        build: m => `https://www.youtube.com/embed/${m[1]}`
      },
      vimeo: { 
        regex: /vimeo\.com\/(\d+)/,
        build: m => `https://player.vimeo.com/video/${m[1]}`
      },
      dailymotion: { 
        regex: /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
        build: m => `https://www.dailymotion.com/embed/video/${m[1]}`
      }
    };

    for (const [, config] of Object.entries(configs)) {
      const match = config.regex.exec(url);
      if (match) {
        this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(config.build(match));
        return;
      }
    }
  }

  // ==================== MÉTODOS SOLO PARA AUDIO ====================
  
  togglePlay(): void {
    if (!this.audioElement) return;
    const audio = this.audioElement.nativeElement;
    if (this.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  onTimeUpdate(): void {
    if (this.audioElement) {
      this.currentTime = this.audioElement.nativeElement.currentTime;
    }
  }

  onLoadedMetadata(): void {
    if (this.audioElement) {
      this.duration = this.audioElement.nativeElement.duration;
    }
  }

  seekTo(event: Event): void {
    if (this.audioElement) {
      this.audioElement.nativeElement.currentTime = parseFloat((event.target as HTMLInputElement).value);
    }
  }

  toggleMute(): void {
    if (this.audioElement) {
      this.audioElement.nativeElement.muted = !this.audioElement.nativeElement.muted;
      this.isMuted = this.audioElement.nativeElement.muted;
    }
  }

  changeVolume(event: Event): void {
    this.volume = parseFloat((event.target as HTMLInputElement).value);
    if (this.audioElement) {
      this.audioElement.nativeElement.volume = this.volume;
    }
    this.isMuted = this.volume === 0;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  }

  get isVideo(): boolean { return this.contenido?.tipo === 'VIDEO'; }
  get isAudio(): boolean { return this.contenido?.tipo === 'AUDIO'; }
  get progressPercentage(): number { return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0; }

  ngOnDestroy(): void {
    // Limpiar URL de objeto para liberar memoria
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }
}

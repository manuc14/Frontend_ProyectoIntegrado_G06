import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
export class MediaPlayerComponent implements OnInit {
  @ViewChild('mediaElement', { static: false }) mediaElement!: ElementRef<HTMLVideoElement | HTMLAudioElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);
  private sanitizer = inject(DomSanitizer);

  contenido: Contenido | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  isFullscreen = false;
  showControls = true;
  controlsTimeout: any;

  // URLs embebidas sanitizadas
  embedUrl: SafeResourceUrl | null = null;
  
  // Alias para compatibilidad (deprecado)
  get youtubeEmbedUrl(): SafeResourceUrl | null {
    return this.embedUrl;
  }

  ngOnInit(): void {
    const contentId = localStorage.getItem('currentContentId');
    if (!contentId) {
      this.router.navigate(['/catalog']);
      return;
    }
    this.loadContent(contentId);
  }

  loadContent(id: string): void {
    this.catalogoService.getContenidoById(id).subscribe({
      next: (contenido) => {
        this.contenido = contenido;
        this.prepareEmbedUrl();
      },
      error: () => { this.router.navigate(['/catalog']); }
    });
  }

  private prepareEmbedUrl(): void {
    if (!this.contenido?.ficheroUrl) return;

    const embedStrategies: Record<string, () => void> = {
      youtube: () => this.createEmbedUrl(this.extractYouTubeId, id => `https://www.youtube.com/embed/${id}`),
      vimeo: () => this.createEmbedUrl(this.extractVimeoId, id => `https://player.vimeo.com/video/${id}`),
      dailymotion: () => this.createEmbedUrl(this.extractDailymotionId, id => `https://www.dailymotion.com/embed/video/${id}`),
      twitch: () => {
        const twitchData = this.extractTwitchId(this.contenido!.ficheroUrl);
        if (twitchData) {
          const url = twitchData.type === 'video'
            ? `https://player.twitch.tv/?video=${twitchData.id}&parent=${window.location.hostname}`
            : `https://player.twitch.tv/?channel=${twitchData.id}&parent=${window.location.hostname}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
      },
      soundcloud: () => {
        const encodedUrl = this.extractSoundCloudUrl(this.contenido!.ficheroUrl);
        this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`
        );
      },
      spotify: () => {
        const spotifyData = this.extractSpotifyId(this.contenido!.ficheroUrl);
        if (spotifyData) {
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}`);
        }
      }
    };

    embedStrategies[this.playerType]?.();
  }

  private createEmbedUrl(extractor: (url: string) => string | null, urlBuilder: (id: string) => string): void {
    const id = extractor.call(this, this.contenido!.ficheroUrl);
    if (id) {
      this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlBuilder(id));
    }
  }

  togglePlay(): void {
    if (!this.mediaElement) return;
    
    const media = this.mediaElement.nativeElement;
    if (this.isPlaying) {
      media.pause();
    } else {
      media.play().catch(error => console.error('❌ Error reproduciendo:', error));
    }
  }

  onTimeUpdate(): void {
    const media = this.mediaElement.nativeElement;
    this.currentTime = media.currentTime;
  }

  onLoadedMetadata(): void {
    const media = this.mediaElement.nativeElement;
    this.duration = media.duration;
  }

  seekTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const media = this.mediaElement.nativeElement;
    media.currentTime = parseFloat(input.value);
  }

  toggleMute(): void {
    const media = this.mediaElement.nativeElement;
    media.muted = !media.muted;
    this.isMuted = media.muted;
  }

  changeVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    const media = this.mediaElement.nativeElement;
    this.volume = parseFloat(input.value);
    media.volume = this.volume;
    this.isMuted = this.volume === 0;
  }

  toggleFullscreen(): void {
    const container = document.querySelector('.player-container') as HTMLElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  // Formateo de tiempo
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Control de visibilidad de controles
  onMouseMove(): void {
    this.showControls = true;
    clearTimeout(this.controlsTimeout);
    if (this.isPlaying) {
      this.controlsTimeout = setTimeout(() => {
        this.showControls = false;
      }, 3000);
    }
  }

  onMouseLeave(): void {
    if (this.isPlaying) {
      this.showControls = false;
    }
  }

  // Helpers
  get isVideo(): boolean {
    return this.contenido?.tipo === 'VIDEO';
  }

  get isAudio(): boolean {
    return this.contenido?.tipo === 'AUDIO';
  }

  get playerType(): 'youtube' | 'vimeo' | 'dailymotion' | 'twitch' | 'soundcloud' | 'spotify' | 'native' {
    if (!this.contenido?.ficheroUrl) return 'native';
    
    const url = this.contenido.ficheroUrl.toLowerCase();
    const patterns = [
      { type: 'youtube' as const, test: (u: string) => u.includes('youtube.com') || u.includes('youtu.be') },
      { type: 'vimeo' as const, test: (u: string) => u.includes('vimeo.com') },
      { type: 'dailymotion' as const, test: (u: string) => u.includes('dailymotion.com') },
      { type: 'twitch' as const, test: (u: string) => u.includes('twitch.tv') },
      { type: 'soundcloud' as const, test: (u: string) => u.includes('soundcloud.com') },
      { type: 'spotify' as const, test: (u: string) => u.includes('spotify.com') }
    ];
    
    return patterns.find(p => p.test(url))?.type ?? 'native';
  }

  get isNativePlayer(): boolean {
    return this.playerType === 'native';
  }

  get isEmbedPlayer(): boolean {
    return this.playerType !== 'native';
  }

  private extractYouTubeId(url: string): string | null {
    const match = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    return (match?.[2]?.length === 11) ? match[2] : null;
  }

  private extractVimeoId(url: string): string | null {
    return /vimeo\.com\/(\d+)/.exec(url)?.[1] ?? null;
  }

  private extractDailymotionId(url: string): string | null {
    return /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/.exec(url)?.[1] ?? null;
  }

  private extractTwitchId(url: string): { type: 'channel' | 'video'; id: string } | null {
    const videoMatch = /twitch\.tv\/videos\/(\d+)/.exec(url);
    if (videoMatch) return { type: 'video', id: videoMatch[1] };
    
    const channelMatch = /twitch\.tv\/(\w+)/.exec(url);
    return channelMatch ? { type: 'channel', id: channelMatch[1] } : null;
  }

  private extractSoundCloudUrl(url: string): string {
    return encodeURIComponent(url);
  }

  private extractSpotifyId(url: string): { type: string; id: string } | null {
    const match = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/.exec(url);
    return match ? { type: match[1], id: match[2] } : null;
  }

  get progressPercentage(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }
}

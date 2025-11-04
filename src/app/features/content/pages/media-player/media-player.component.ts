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
    const contentId = this.route.snapshot.paramMap.get('id');
    if (contentId) {
      this.loadContent(contentId);
    } else {
      this.router.navigate(['/catalog']);
    }
  }

  loadContent(id: string): void {
    console.log('🔍 [MEDIA PLAYER] Cargando contenido con ID:', id);
    console.log('🌐 [MEDIA PLAYER] URL de petición:', `/api/contenidos/${id}`);
    
    this.catalogoService.getContenidoById(id).subscribe({
      next: (contenido) => {
        console.log('✅ [MEDIA PLAYER] Contenido cargado exitosamente:', contenido);
        console.log('📹 [MEDIA PLAYER] Tipo de contenido:', contenido.tipo);
        console.log('🎬 [MEDIA PLAYER] URL del fichero:', contenido.ficheroUrl);
        console.log('🆔 [MEDIA PLAYER] _id del contenido:', contenido._id);
        this.contenido = contenido;
        
        // Preparar URL del embed según el tipo de reproductor
        this.prepareEmbedUrl();
      },
      error: (error) => {
        console.error('❌ [MEDIA PLAYER] Error cargando contenido:', error);
        console.error('❌ [MEDIA PLAYER] Status:', error.status);
        console.error('❌ [MEDIA PLAYER] Message:', error.message);
        console.error('❌ [MEDIA PLAYER] Error completo:', JSON.stringify(error, null, 2));
        console.log('🔄 [MEDIA PLAYER] Redirigiendo a /catalog...');
        this.router.navigate(['/catalog']);
      }
    });
  }

  /**
   * Prepara la URL del embed según el tipo de reproductor detectado
   * Patrón Strategy para evitar múltiples if-else
   */
  private prepareEmbedUrl(): void {
    if (!this.contenido?.ficheroUrl) return;

    // Estrategias de embed por tipo de reproductor
    const embedStrategies: Record<string, () => void> = {
      youtube: () => {
        const videoId = this.extractYouTubeId(this.contenido!.ficheroUrl);
        if (videoId) {
          const url = `https://www.youtube.com/embed/${videoId}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          console.log('🎥 YouTube detectado - ID:', videoId);
        }
      },
      vimeo: () => {
        const videoId = this.extractVimeoId(this.contenido!.ficheroUrl);
        if (videoId) {
          const url = `https://player.vimeo.com/video/${videoId}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          console.log('🎬 Vimeo detectado - ID:', videoId);
        }
      },
      dailymotion: () => {
        const videoId = this.extractDailymotionId(this.contenido!.ficheroUrl);
        if (videoId) {
          const url = `https://www.dailymotion.com/embed/video/${videoId}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          console.log('📹 Dailymotion detectado - ID:', videoId);
        }
      },
      twitch: () => {
        const twitchData = this.extractTwitchId(this.contenido!.ficheroUrl);
        if (twitchData) {
          const url = twitchData.type === 'video'
            ? `https://player.twitch.tv/?video=${twitchData.id}&parent=${window.location.hostname}`
            : `https://player.twitch.tv/?channel=${twitchData.id}&parent=${window.location.hostname}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          console.log('🎮 Twitch detectado - Tipo:', twitchData.type, 'ID:', twitchData.id);
        }
      },
      soundcloud: () => {
        const encodedUrl = this.extractSoundCloudUrl(this.contenido!.ficheroUrl);
        const url = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
        this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        console.log('🎵 SoundCloud detectado');
      },
      spotify: () => {
        const spotifyData = this.extractSpotifyId(this.contenido!.ficheroUrl);
        if (spotifyData) {
          const url = `https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}`;
          this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          console.log('🎧 Spotify detectado - Tipo:', spotifyData.type, 'ID:', spotifyData.id);
        }
      },
      native: () => {
        console.log('📺 Reproductor nativo HTML5');
      }
    };

    // Ejecutar la estrategia correspondiente
    embedStrategies[this.playerType]?.();
  }

  // Control de reproducción
  togglePlay(): void {
    console.log('🎮 togglePlay llamado - isPlaying actual:', this.isPlaying);
    
    if (!this.mediaElement) {
      console.error('❌ Elemento media no encontrado!');
      return;
    }
    
    const media = this.mediaElement.nativeElement;
    console.log('📺 Elemento media:', media);
    console.log('🔗 Media src:', media.src);
    
    if (this.isPlaying) {
      media.pause();
      console.log('⏸️ Pausando...');
    } else {
      console.log('▶️ Intentando reproducir...');
      media.play()
        .then(() => console.log('✅ Reproducción iniciada'))
        .catch(error => {
          console.error('❌ Error reproduciendo el contenido:', error);
        });
    }
    // No cambiamos isPlaying aquí, lo harán los eventos (play) y (pause)
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

  /**
   * Detecta el tipo de reproductor necesario basado en la URL
   * Usa un patrón declarativo para evitar múltiples if-else
   */
  get playerType(): 'youtube' | 'vimeo' | 'dailymotion' | 'twitch' | 'soundcloud' | 'spotify' | 'native' {
    if (!this.contenido?.ficheroUrl) return 'native';
    
    const url = this.contenido.ficheroUrl.toLowerCase();
    
    // Configuración declarativa de patrones (fácil de extender)
    const patterns = [
      { type: 'youtube' as const, test: (u: string) => u.includes('youtube.com') || u.includes('youtu.be') },
      { type: 'vimeo' as const, test: (u: string) => u.includes('vimeo.com') },
      { type: 'dailymotion' as const, test: (u: string) => u.includes('dailymotion.com') },
      { type: 'twitch' as const, test: (u: string) => u.includes('twitch.tv') },
      { type: 'soundcloud' as const, test: (u: string) => u.includes('soundcloud.com') },
      { type: 'spotify' as const, test: (u: string) => u.includes('spotify.com') }
    ];
    
    const match = patterns.find(p => p.test(url));
    return match?.type ?? 'native';
  }

  get isYouTube(): boolean {
    return this.playerType === 'youtube';
  }

  get isVimeo(): boolean {
    return this.playerType === 'vimeo';
  }

  get isDailymotion(): boolean {
    return this.playerType === 'dailymotion';
  }

  get isTwitch(): boolean {
    return this.playerType === 'twitch';
  }

  get isSoundCloud(): boolean {
    return this.playerType === 'soundcloud';
  }

  get isSpotify(): boolean {
    return this.playerType === 'spotify';
  }

  get isNativePlayer(): boolean {
    return this.playerType === 'native';
  }

  get isEmbedPlayer(): boolean {
    return !this.isNativePlayer;
  }

  /**
   * Extrae el ID del video de una URL de YouTube
   * Soporta formatos:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   */
  extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = regExp.exec(url);
    return (match?.[2]?.length === 11) ? match[2] : null;
  }

  /**
   * Extrae el ID del video de una URL de Vimeo
   * Formato: https://vimeo.com/VIDEO_ID
   */
  extractVimeoId(url: string): string | null {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = regExp.exec(url);
    return match?.[1] ?? null;
  }

  /**
   * Extrae el ID del video de una URL de Dailymotion
   * Formatos:
   * - https://www.dailymotion.com/video/VIDEO_ID
   * - https://dai.ly/VIDEO_ID
   */
  extractDailymotionId(url: string): string | null {
    const regExp = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const match = regExp.exec(url);
    return match?.[1] ?? null;
  }

  /**
   * Extrae el ID del video/canal de una URL de Twitch
   * Formatos:
   * - https://www.twitch.tv/CHANNEL_NAME
   * - https://www.twitch.tv/videos/VIDEO_ID
   */
  extractTwitchId(url: string): { type: 'channel' | 'video'; id: string } | null {
    const videoRegExp = /twitch\.tv\/videos\/(\d+)/;
    const channelRegExp = /twitch\.tv\/(\w+)/;
    
    let match = videoRegExp.exec(url);
    if (match) return { type: 'video', id: match[1] };
    
    match = channelRegExp.exec(url);
    if (match) return { type: 'channel', id: match[1] };
    
    return null;
  }

  /**
   * Extrae la URL embebida de SoundCloud
   * SoundCloud requiere la URL completa para el embed
   */
  extractSoundCloudUrl(url: string): string {
    // SoundCloud usa la URL completa en el embed
    return encodeURIComponent(url);
  }

  /**
   * Extrae el ID del track/album/playlist de Spotify
   * Formatos:
   * - https://open.spotify.com/track/TRACK_ID
   * - https://open.spotify.com/album/ALBUM_ID
   * - https://open.spotify.com/playlist/PLAYLIST_ID
   */
  extractSpotifyId(url: string): { type: string; id: string } | null {
    const regExp = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
    const match = regExp.exec(url);
    return match ? { type: match[1], id: match[2] } : null;
  }

  get progressPercentage(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }
}

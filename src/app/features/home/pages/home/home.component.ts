import { Component, inject, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { VipPromoModalComponent } from '../../../../shared/vip-promo-modal/vip-promo-modal.component';
import { ApiService } from '../../../../core/services/api.service';
import { fadeIn, slideInFromTop } from '../../../../core/animations/animations';

/*
 * HomeComponent
 * Página principal de ESIMedia que muestra el contenido destacado y secciones
 * de videos y audios. Incluye hero destacado, secciones categorizadas,
 * comparativas, VIP benefits y testimonios.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, VipPromoModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [fadeIn, slideInFromTop]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  
  // Control de la pantalla de bienvenida
  hasScrolled = false;
  private welcomeScreenDismissed = false; // Flag para controlar si se ha descartado manualmente
  
  // Control de animaciones en scroll
  isStatsVisible = false;
  isVipVisible = false;
  isFeaturesVisible = false;
  isTestimonialsVisible = false;
  isContentVisible = false;
  isAudiosVisible = false;
  isHalloweenVisible = false;

  // Control del modal VIP
  showVipModal = false;

  // Estadísticas animadas
  animatedStats = {
    esiPrice: 0,
    esiContent: 0,
    esiQuality: '',
    esiScreens: 0
  };

  // Datos simulados para las secciones de contenido
  topVideos = [
    { title: 'Velocity X', tagLeft: 'VIP', tagRight: '18+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop' },
    { title: "Hallow's Gate", tagLeft: 'New', tagRight: '16+', badgeRight: '4.7', image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop' },
    { title: 'After the Rain', tagLeft: 'HD', tagRight: '13+', badgeRight: '2h 01m', image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=600&fit=crop' },
    { title: 'Blue World', tagLeft: 'Top Rated', tagRight: 'All', badgeRight: 'Docu', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop' },
    { title: 'Cyber Dreams', tagLeft: 'VIP', tagRight: '16+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop' },
    { title: 'Lost in Time', tagLeft: 'New', tagRight: '13+', badgeRight: '4.8', image: 'https://images.unsplash.com/photo-1489599735734-79b4dfe3b22a?w=400&h=600&fit=crop' },
    { title: 'Urban Legends', tagLeft: 'HD', tagRight: '18+', badgeRight: '2h 15m', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop' },
    { title: 'Ocean Depths', tagLeft: 'Top Rated', tagRight: 'All', badgeRight: 'Docu', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=600&fit=crop' },
    { title: 'Neon Nights', tagLeft: 'VIP', tagRight: '16+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop' },
    { title: 'Mountain Echo', tagLeft: 'New', tagRight: '13+', badgeRight: '4.6', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop' }
  ];

  trendingAudios = [
    { title: 'Tech Unplugged', tagLeft: 'New', tagRight: '13+', badgeRight: 'Podcast', image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop' },
    { title: 'Arcane Tales', tagLeft: 'VIP', tagRight: '16+', badgeRight: 'Audiobook', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop' },
    { title: 'Ocean Breath', tagLeft: 'Top', tagRight: 'All', badgeRight: 'Wellness', image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop' },
    { title: 'Case Files', tagLeft: 'HD', tagRight: '18+', badgeRight: 'Series', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop' }
  ];

  halloweenFilms = [
    { title: 'The Manor', tagLeft: 'VIP', tagRight: '18+', badgeRight: 'Hot', image: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=600&h=800&fit=crop' },
    { title: 'Pumpkin Road', tagLeft: 'New', tagRight: '16+', badgeRight: '4.6', image: 'https://images.unsplash.com/photo-1542460772-e2c0c8c31c3e?w=600&h=800&fit=crop' },
    { title: 'Moonlit Coven', tagLeft: '4K', tagRight: '13+', badgeRight: 'Fantasy', image: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=600&h=800&fit=crop' },
  ];

  // Beneficios estadísticos
  statsBenefits = [
    { icon: '💰', title: 'Precio imbatible', description: '40% más económico que la competencia' },
    { icon: '📚', title: 'Más contenido', description: '3x más contenido exclusivo' },
    { icon: '🎬', title: 'Calidad superior', description: 'Streaming en 4K sin coste adicional' },
    { icon: '📱', title: 'Más flexibilidad', description: 'Hasta 5 pantallas simultáneas' }
  ];

  // Características VIP
  vipFeatures = [
    { icon: '🎯', title: 'Contenido Exclusivo', description: 'Accede a series y películas que solo verás aquí' },
    { icon: '⚡', title: 'Sin Anuncios', description: 'Disfruta sin interrupciones de ningún tipo' },
    { icon: '📥', title: 'Descargas Ilimitadas', description: 'Lleva tu contenido donde quieras, sin límites' },
    { icon: '🎵', title: 'Audio Premium', description: 'Calidad de audio Dolby Atmos' },
    { icon: '👥', title: '5 Perfiles', description: 'Comparte con toda tu familia' },
    { icon: '🎮', title: 'Acceso Anticipado', description: 'Sé el primero en ver los estrenos' }
  ];

  // Características principales
  mainFeatures = [
    { icon: '🌐', title: 'Multiplataforma', description: 'Disfruta en cualquier dispositivo' },
    { icon: '🔄', title: 'Sincronización', description: 'Continúa donde lo dejaste' },
    { icon: '👨‍👩‍👧‍👦', title: 'Control Parental', description: 'Contenido seguro para todos' },
    { icon: '🎨', title: 'Interfaz Intuitiva', description: 'Fácil de usar y personalizar' },
    { icon: '🔍', title: 'Búsqueda Inteligente', description: 'Encuentra lo que buscas al instante' },
    { icon: '📊', title: 'Recomendaciones', description: 'Contenido adaptado a tus gustos' }
  ];

  // Testimonios
  testimonials = [
    { 
      avatar: '👨‍💼', 
      name: 'Carlos Martínez', 
      role: 'Usuario VIP', 
      text: 'La mejor plataforma de streaming que he probado. El contenido es increíble y el precio inmejor que el de la competencia.'
    },
    { 
      avatar: '👩‍🎓', 
      name: 'Ana García', 
      role: 'Usuario VIP', 
      text: 'Me encanta la calidad 4K y la variedad de contenido. Además, poder descargar sin límites es genial para mis viajes.'
    },
    { 
      avatar: '👨‍🔧', 
      name: 'Miguel López', 
      role: 'Usuario Básico', 
      text: 'Incluso sin VIP la experiencia es excelente. La interfaz es muy intuitiva y encuentro siempre algo interesante.'
    }
  ];

  // Partículas para efecto VIP
  particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`
  }));

  // Configuración de secciones animadas
  private readonly sectionAnimationConfig = [
    { selector: '.content-carousel-section', property: 'isContentVisible' as const },
    { selector: '.stats-section', property: 'isStatsVisible' as const },
    { selector: '.content-grid-section', property: 'isAudiosVisible' as const },
    { selector: '.vip-section', property: 'isVipVisible' as const },
    { selector: '.showcase-section', property: 'isHalloweenVisible' as const },
    { selector: '.features-section', property: 'isFeaturesVisible' as const },
    { selector: '.testimonials-section', property: 'isTestimonialsVisible' as const }
  ];

  // Configuración de animación de estadísticas
  private readonly statsAnimationConfig = {
    duration: 2000,
    frames: 60,
    finalStats: {
      esiPrice: 9.99,
      esiContent: 15,
      esiQuality: '4K',
      esiScreens: 5
    }
  };

  ngOnInit(): void {
    // Prevenir la restauración automática del scroll del navegador
    history.scrollRestoration = 'manual';
    
    // Resetear el scroll al inicio al cargar la página
    window.scrollTo(0, 0);
    
    // Resetear el estado de la pantalla de bienvenida
    this.resetWelcomeScreen();
    
    // Animar estadísticas
    this.animateStats();
  }

  ngAfterViewInit(): void {
    // Forzar el scroll a la parte superior después de que la vista se haya inicializado completamente
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }

  ngOnDestroy(): void {
    // Restaurar el comportamiento normal del navegador al salir del componente
    history.scrollRestoration = 'auto';
  }

  /**
   * Anima los números de las estadísticas
   */
  private animateStats(): void {
    const { duration, frames } = this.statsAnimationConfig;
    const increment = duration / frames;
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / frames;
      this.updateAnimatedStats(progress);

      if (currentFrame >= frames) {
        clearInterval(interval);
        this.setFinalStats();
      }
    }, increment);
  }

  /**
   * Actualiza los valores de estadísticas animadas según el progreso
   */
  private updateAnimatedStats(progress: number): void {
    this.animatedStats.esiPrice = Math.round(9.99 * progress * 100) / 100;
    this.animatedStats.esiContent = Math.round(15 * progress);
    this.animatedStats.esiScreens = Math.round(5 * progress);
    this.animatedStats.esiQuality = progress > 0.5 ? '4K' : '';
  }

  /**
   * Establece los valores finales de las estadísticas
   */
  private setFinalStats(): void {
    const { finalStats } = this.statsAnimationConfig;
    Object.assign(this.animatedStats, finalStats);
  }

  /**
   * Resetea el estado de la pantalla de bienvenida
   */
  private resetWelcomeScreen(): void {
    this.hasScrolled = false;
    this.welcomeScreenDismissed = false;
  }

  /**
   * Detecta el scroll para animaciones y pantalla de bienvenida
   */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    
    // Ocultar pantalla de bienvenida si se scrollea más de 100px
    if (scrollTop > 100 && !this.welcomeScreenDismissed) {
      this.hasScrolled = true;
      this.welcomeScreenDismissed = true;
    }

    // Activar animaciones de secciones visibles
    this.sectionAnimationConfig.forEach(({ selector, property }) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const { top, bottom } = element.getBoundingClientRect();
      (this as any)[property] = top <= window.innerHeight * 0.75 && bottom >= 0;
    });
  }

  /**
   * Navega a la página de VIP
   */
  navigateToVip = () => { this.showVipModal = true; };

  /**
   * Navega a la página de registro
   */
  navigateToRegister = () => this.router.navigate(['/signup']);

  /**
   * Cierra el modal VIP
   */
  closeVipModal = () => { this.showVipModal = false; };

  /**
   * Redirige a la página VIP desde el modal
   */
  handleVipUpgrade = () => this.router.navigate(['/signup']).finally(() => this.closeVipModal());

  /**
   * Continúa sin VIP y cierra el modal
   */
  handleContinueStandard = () => { this.showVipModal = false; };
}

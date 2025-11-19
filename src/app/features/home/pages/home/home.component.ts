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
  isChristmasVisible = false;

  // Control del modal VIP
  showVipModal = false;

  // Estadísticas animadas
  animatedStats = {
    esiPrice: '0' as string | number,
    esiContent: 0,
    esiQuality: '',
    esiScreens: 0 as string | number
  };

  // Datos simulados para las secciones de contenido
  topVideos = [
    { title: 'Tutorial React Avanzado', tagLeft: 'VIP', tagRight: '18+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=600&fit=crop' },
    { title: "Review iPhone 15 Pro Max", tagLeft: 'New', tagRight: '16+', badgeRight: '4.7', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=600&fit=crop' },
    { title: 'Viaje por Europa 2024', tagLeft: 'HD', tagRight: '13+', badgeRight: '2h 01m', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop' },
    { title: 'Documental Cambio Climático', tagLeft: 'Top Rated', tagRight: 'All', badgeRight: 'Docu', image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=600&fit=crop' },
    { title: 'Gaming: Fortnite Championship', tagLeft: 'VIP', tagRight: '16+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop' },
    { title: 'Cocina Fácil: Pasta Italiana', tagLeft: 'New', tagRight: '13+', badgeRight: '4.8', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop' },
    { title: 'Misterios del Universo', tagLeft: 'HD', tagRight: '18+', badgeRight: '2h 15m', image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop' },
    { title: 'Historia Antigua: Roma', tagLeft: 'Top Rated', tagRight: 'All', badgeRight: 'Docu', image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400&h=600&fit=crop' },
    { title: 'Tutorial Photoshop 2024', tagLeft: 'VIP', tagRight: '16+', badgeRight: '4K', image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&h=600&fit=crop' },
    { title: 'Aventura en la Montaña', tagLeft: 'New', tagRight: '13+', badgeRight: '4.6', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop' }
  ];

  trendingAudios = [
    { title: 'Blinding Lights - The Weeknd', tagLeft: 'New', tagRight: '13+', badgeRight: 'Pop', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
    { title: 'Watermelon Sugar - Harry Styles', tagLeft: 'VIP', tagRight: '16+', badgeRight: 'Pop', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop' },
    { title: 'Levitating - Dua Lipa', tagLeft: 'Top', tagRight: 'All', badgeRight: 'Dance', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
    { title: 'Stay - The Kid Laroi & Justin Bieber', tagLeft: 'HD', tagRight: '18+', badgeRight: 'Hip Hop', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' }
  ];

  christmasVideos = [
    { title: 'Navidad Mágica en Familia', tagLeft: 'VIP', tagRight: '18+', badgeRight: 'Festivo', image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&h=800&fit=crop' },
    { title: 'Recetas Navideñas Tradicionales', tagLeft: 'New', tagRight: '16+', badgeRight: '4.8', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&h=800&fit=crop' },
    { title: 'Decoraciones de Navidad DIY', tagLeft: '4K', tagRight: '13+', badgeRight: 'Tutorial', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop' },
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
    { selector: '.showcase-section', property: 'isChristmasVisible' as const },
    { selector: '.features-section', property: 'isFeaturesVisible' as const },
    { selector: '.testimonials-section', property: 'isTestimonialsVisible' as const }
  ];

  // Configuración de animación de estadísticas
  private readonly statsAnimationConfig = {
    duration: 2000,
    frames: 60,
    finalStats: {
      esiPrice: '¡GRATIS!',
      esiContent: 15,
      esiQuality: '4K',
      esiScreens: 'ILIMITADAS'
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
    // Para el precio, mostrar "¡GRATIS!" desde el principio
    this.animatedStats.esiPrice = progress > 0.1 ? '¡GRATIS!' : '0';
    this.animatedStats.esiContent = Math.round(15 * progress);
    this.animatedStats.esiScreens = progress > 0.8 ? 'ILIMITADAS' : Math.round(5 * progress);
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

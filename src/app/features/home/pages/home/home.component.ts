import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { HeroComponent } from '../../../../shared/hero/hero.component';
import { SectionListComponent } from '../../../../shared/section-list/section-list.component';
import { ApiService } from '../../../../core/services/api.service';
import { fadeIn, slideInFromTop } from '../../../../core/animations/animations';

/*
 * HomeComponent
 * Página principal de ESIMedia que muestra el contenido destacado y secciones
 * de videos y audios. Incluye hero destacado, secciones categorizadas y
 * preparación para integración con backend cuando esté disponible.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, HeroComponent, SectionListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [fadeIn, slideInFromTop]
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  
  // Control de la pantalla de bienvenida
  hasScrolled = false;
  
  // Datos simulados para las secciones de contenido
  topVideos = [
    { title: 'Velocity X', tagLeft: 'VIP', tagRight: '18+', badgeRight: '4K', image: 'assets/placeholders/vid1.jpg' },
    { title: "Hallow's Gate", tagLeft: 'New', tagRight: '16+', badgeRight: '4.7', image: 'assets/placeholders/vid2.jpg' },
    { title: 'After the Rain', tagLeft: 'HD', tagRight: '13+', badgeRight: '2h 01m', image: 'assets/placeholders/vid3.jpg' },
    { title: 'Blue World', tagLeft: 'Top Rated', tagRight: 'All', badgeRight: 'Docu', image: 'assets/placeholders/vid4.jpg' }
  ];

  trendingAudios = [
    { title: 'Tech Unplugged', tagLeft: 'New', tagRight: '13+', badgeRight: 'Podcast', image: 'assets/placeholders/aud1.jpg' },
    { title: 'Arcane Tales', tagLeft: 'VIP', tagRight: '16+', badgeRight: 'Audiobook', image: 'assets/placeholders/aud2.jpg' },
    { title: 'Ocean Breath', tagLeft: 'Top', tagRight: 'All', badgeRight: 'Wellness', image: 'assets/placeholders/aud3.jpg' },
    { title: 'Case Files', tagLeft: 'HD', tagRight: '18+', badgeRight: 'Series', image: 'assets/placeholders/aud4.jpg' }
  ];

  halloweenFilms = [
    { title: 'The Manor', tagLeft: 'VIP', tagRight: '18+', badgeRight: 'Hot', image: 'assets/placeholders/hal1.jpg' },
    { title: 'Pumpkin Road', tagLeft: 'New', tagRight: '16+', badgeRight: '4.6', image: 'assets/placeholders/hal2.jpg' },
    { title: 'Moonlit Coven', tagLeft: '4K', tagRight: '13+', badgeRight: 'Fantasy', image: 'assets/placeholders/hal3.jpg' },
  ];

  ngOnInit(): void {
    // Mantener datos simulados mientras el backend no esté completamente integrado
    // El código comentado abajo está preparado para cuando se active la conexión real
    
    // Dejo el esqueleto preparado para reactivarlo cuando proceda:
    // this.api.getHomeSections().subscribe({
    //   next: (sections) => {
    //     if (!sections || sections.length === 0) return;
    //     const mapItem = (i: any) => ({
    //       title: i.title,
    //       tagLeft: i.vipOnly ? 'VIP' : (i.isNew ? 'New' : (i.qualityTag ?? undefined)),
    //       tagRight: i.ageRating ?? undefined,
    //       badgeRight: i.durationText || i.category || i.qualityTag,
    //       image: i.imageUrl || 'assets/placeholders/vid1.jpg',
    //     });
    //     for (const s of sections) {
    //       if (s.key === 'topVideos') this.topVideos = s.items.map(mapItem);
    //       if (s.key === 'trendingAudios') this.trendingAudios = s.items.map(mapItem);
    //       if (s.key === 'halloweenFilms') this.halloweenFilms = s.items.map(mapItem);
    //     }
    //   },
    //   error: (err) => {
    //     console.warn('API error; keeping mock data', err);
    //   },
    // });
  }

  /**
   * Detecta el scroll para ocultar la pantalla de bienvenida
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Ocultar pantalla de bienvenida cuando se hace scroll
    if (scrollTop > 100 && !this.hasScrolled) {
      this.hasScrolled = true;
    }
  }
}

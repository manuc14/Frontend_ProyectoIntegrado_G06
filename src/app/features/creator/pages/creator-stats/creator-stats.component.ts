import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { CreatorSidebarComponent } from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-creator-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, ContentCreatorHeaderComponent, CreatorSidebarComponent, FooterComponent],
  templateUrl: './creator-stats.component.html',
  styleUrls: ['./creator-stats.component.scss']
})
export class CreatorStatsComponent {
  // Datos de estadísticas (mockup)
  statsData = {
    totalViews: 45234,
    totalWatchTime: 8945,
    totalSubscribers: 2341,
    totalRevenue: 1234
  };

  // Datos para gráfico de visualizaciones mensuales
  monthlyViewsData = [
    { month: 'Ene', views: 4000, color: '#3b82f6' },
    { month: 'Feb', views: 3500, color: '#3b82f6' },
    { month: 'Mar', views: 5200, color: '#3b82f6' },
    { month: 'Abr', views: 4800, color: '#3b82f6' },
    { month: 'May', views: 6100, color: '#3b82f6' },
    { month: 'Jun', views: 7200, color: '#8b5cf6' }
  ];

  // Datos de contenido más visto
  topContent = [
    { title: 'Video Tutorial Angular', views: 12450, thumbnail: '/assets/brand/logo.svg' },
    { title: 'Curso TypeScript Completo', views: 9800, thumbnail: '/assets/brand/logo.svg' },
    { title: 'Guía de RxJS', views: 7650, thumbnail: '/assets/brand/logo.svg' }
  ];
}

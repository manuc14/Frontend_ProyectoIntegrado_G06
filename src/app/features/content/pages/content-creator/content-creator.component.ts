import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { CreatorSidebarComponent } from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import { Router } from '@angular/router';

interface ContentList {
  id: string;
  title: string;
  cover: string;
  itemCount: number;
}

interface RecentEdit {
  id: string;
  title: string;
  thumbnail: string;
  lastEdited: Date;
}

@Component({
  selector: 'app-content-creator',
  standalone: true,
  imports: [CommonModule, FooterComponent, ContentCreatorHeaderComponent, CreatorSidebarComponent],
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {

  private router = inject(Router);

  // Datos para las listas de contenido
  contentLists: ContentList[] = [];

  // Datos para ediciones recientes
  recentEdits: RecentEdit[] = [];

  // Datos de estadísticas (mockup)
  statsData = {
    views: 12547,
    viewsChange: '+18%',
    watchTime: '2.4k',
    watchTimeChange: '+12%',
    subscribers: 1234,
    subscribersChange: '+5%',
    revenue: '$342',
    revenueChange: '+23%'
  };

  // Datos para gráfico de visualizaciones (mockup)
  chartData = [
    { month: 'Ene', views: 4000 },
    { month: 'Feb', views: 3000 },
    { month: 'Mar', views: 5000 },
    { month: 'Abr', views: 4500 },
    { month: 'May', views: 6000 },
    { month: 'Jun', views: 7200 }
  ];

  ngOnInit(): void {
    // Mock data - por defecto vacío hasta integrar con API
    this.contentLists = [];
    this.recentEdits = [];
  }

  /* Navega al catálogo del creador */
  navigateToCreatorCatalog(): void {
    this.router.navigate(['/creator/catalog']);
  }

  /* Comienza a editar/crear contenido */
  startEditing(): void {
    this.router.navigate(['/upload-content']);
  }
}

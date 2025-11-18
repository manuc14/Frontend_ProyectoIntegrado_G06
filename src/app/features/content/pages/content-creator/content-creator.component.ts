import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { CreatorSidebarComponent } from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CreatorStatsService } from '../../../../core/services/creator-stats.service';

interface WeekData {
  day: string;
  views: number;
}

@Component({
  selector: 'app-creator-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, ContentCreatorHeaderComponent, CreatorSidebarComponent, FooterComponent],
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  dropdownTopAbierto = false;
  selectedTop = 5;
  topOptions = [5, 10, 15];

  statsData = {
    usuariosTotales: 0,
    usuariosVip: 0,
    reproduccionesTotales: 0
  };

  topReproductions: any[] = [];
  topRatings: any[] = [];
  topSpecialties: any[] = [];
  reproduccionesSemana: WeekData[] = [];

  constructor(
    private statsService: CreatorStatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.statsService.obtenerEstadisticasGlobales().subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);

        this.statsData = {
          usuariosTotales: data.usuariosTotales,
          usuariosVip: data.usuariosVip,
          reproduccionesTotales: data.reproduccionesTotales
        };

        this.topReproductions = data.topPorReproducciones.map((item, index) => ({
          title: item.nombre,
          views: this.formatearNumero(item.reproducciones),
          thumbnail: item.miniatura || '/assets/brand/logo.svg',
          rank: index + 1
        }));

        this.topRatings = data.topPorValoracion.map((item, index) => ({
          title: item.nombre,
          rating: item.valoracion.toFixed(1),
          thumbnail: item.miniatura || '/assets/brand/logo.svg',
          rank: index + 1
        }));

        this.topSpecialties = data.topPorEspecialidad.map((item, index) => ({
          title: item.especialidad,
          engagement: this.formatearNumero(item.reproducciones),
          rank: index + 1
        }));

        this.reproduccionesSemana = data.reproduccionesSemana.map((item) => ({
          day: this.formatearFecha(item.fecha),
          views: item.reproducciones
        }));

        console.log('Reproducciones semanales:', this.reproduccionesSemana);
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const diaAjustado = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return dias[diaAjustado];
  }

  formatearNumero(numero: number): string {
    if (numero >= 1000) {
      return `${(numero / 1000).toFixed(1)}K`;
    }
    return numero.toString();
  }

  get weeklyData(): WeekData[] {
    return this.reproduccionesSemana;
  }

  get textoBotonTop(): string {
    return `TOP ${this.selectedTop}`;
  }

  get maxValue(): number {
    const values = this.weeklyData.map(d => d.views);
    return Math.max(...values, 1);
  }

  getCurvePathSimple(): string {
    const data = this.weeklyData;
    const maxValue = this.maxValue;
    const numPoints = data.length;

    if (numPoints === 0) return '';

    let path = '';
    data.forEach((item, index) => {
      const x = (100 / (numPoints - 1)) * index;
      const y = 100 - ((item.views / maxValue) * 100);

      if (index === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prevItem = data[index - 1];
        const prevX = (100 / (numPoints - 1)) * (index - 1);
        const prevY = 100 - ((prevItem.views / maxValue) * 100);

        const cpX1 = prevX + ((x - prevX) / 3);
        const cpY1 = prevY;
        const cpX2 = x - ((x - prevX) / 3);
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${y}, ${x} ${y}`;
      }
    });

    return path;
  }

  seleccionarTop(top: number): void {
    this.selectedTop = top;
    this.dropdownTopAbierto = false;
  }

  cerrarDropdowns(): void {
    this.dropdownTopAbierto = false;
  }

  navigateToCreatorCatalog(): void {
    this.router.navigate(['/creator/catalog']);
  }

  navigateToUploadContent(): void {
    this.router.navigate(['/upload-content']);
  }

}

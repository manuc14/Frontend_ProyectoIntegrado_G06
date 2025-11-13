import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ContentCreatorHeaderComponent
} from '../../../../shared/components/content-creator-header/content-creator-header.component';
import {CreatorSidebarComponent} from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import {FooterComponent} from '../../../../shared/footer/footer.component';
import { CreatorStatsService, TopContent } from '../../../../core/services/creator-stats.service';
import { forkJoin } from 'rxjs';

interface MonthData {
  month: string;
  views: number;
  color?: string;
  x?: number;
}

@Component({
  selector: 'app-creator-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, ContentCreatorHeaderComponent, CreatorSidebarComponent, FooterComponent],
  templateUrl: './creator-stats.component.html',
  styleUrls: ['./creator-stats.component.scss']
})
export class CreatorStatsComponent implements OnInit {
  // Control de dropdowns
  dropdownTopAbierto = false;
  dropdownTiempoAbierto = false;
  dropdownTipoAbierto = false;

  // Control de hover para puntos de la curva
  hoveredCurvePoint: number | null = null;

  // Filtros seleccionados
  selectedTop = 5;
  selectedTime = '1semana';
  selectedType = 'Todos';

  // Opciones de filtros
  topOptions = [5, 10, 15];
  timeOptions = [
    { value: '1semana', label: '1 semana' },
    { value: '2semanas', label: '2 semanas' },
    { value: '1mes', label: '1 mes' },
    { value: '2meses', label: '2 meses' }
  ];
  typeOptions = ['Premium', 'Estándar', 'Todos'];

  // Datos de estadísticas (mockup)
  statsData = {
    totalWatchTime: 8945,
    totalSubscribers: 2341,
    totalRevenue: 1234
  };

  // TOP 5 - Datos del backend
  topReproductions: any[] = [];
  topRatings: any[] = [];
  topSpecialties: any[] = [];

  constructor(private statsService: CreatorStatsService) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    const { fechaInicio, fechaFin } = this.calcularRangoFechas();

    forkJoin({
      reproducciones: this.statsService.obtenerTopReproducciones(
        this.selectedTop, fechaInicio, fechaFin, this.selectedType
      ),
      valoraciones: this.statsService.obtenerTopValoraciones(
        this.selectedTop, fechaInicio, fechaFin, this.selectedType
      ),
      especialidades: this.statsService.obtenerTopEspecialidades(
        this.selectedTop, fechaInicio, fechaFin
      )
    }).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos del backend:', data); // ✅ AÑADE ESTO

        this.topReproductions = data.reproducciones.map((item: TopContent, index: number) => ({
          title: item.title,
          views: item.metricValue,
          thumbnail: item.thumbnail,
          rank: index + 1
        }));

        this.topRatings = data.valoraciones.map((item: TopContent, index: number) => ({
          title: item.title,
          rating: item.metricValue,
          thumbnail: item.thumbnail,
          rank: index + 1
        }));

        this.topSpecialties = data.especialidades.map((item: TopContent, index: number) => ({
          title: item.title,
          engagement: item.metricValue,
          thumbnail: item.thumbnail,
          rank: index + 1
        }));

        console.log('✅ Reproducciones:', this.topReproductions); // ✅ AÑADE ESTO
        console.log('✅ Valoraciones:', this.topRatings); // ✅ AÑADE ESTO
        console.log('✅ Especialidades:', this.topSpecialties); // ✅ AÑADE ESTO
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error); // ✅ AÑADE ESTO
      }
    });
  }


  calcularRangoFechas(): { fechaInicio?: string; fechaFin?: string } {
    const hoy = new Date();
    let fechaInicio: Date | undefined;

    switch (this.selectedTime) {
      case '1semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case '2semanas':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 14);
        break;
      case '1mes':
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case '2meses':
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 2);
        break;
    }

    return {
      fechaInicio: fechaInicio ? this.formatearFecha(fechaInicio) : undefined,
      fechaFin: this.formatearFecha(hoy)
    };
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Getters para datos filtrados
  get monthlyViewsData(): MonthData[] {
    return [];
  }

  get monthlyReproductionsData(): MonthData[] {
    return [];
  }

  // Métodos para obtener textos de botones
  get textoBotonTop(): string {
    return `TOP ${this.selectedTop}`;
  }

  get textoBotonTiempo(): string {
    const option = this.timeOptions.find(opt => opt.value === this.selectedTime);
    return option ? option.label : 'Tiempo';
  }

  get textoBotonTipo(): string {
    return this.selectedType;
  }

  // Getter para el texto del período en las gráficas
  get textoPeriodoGrafica(): string {
    return this.textoBotonTiempo;
  }

  // Metodo para obtener el valor máximo dinámico de las barras
  get maxBarValue(): number {
    const values = this.monthlyViewsData.map(d => d.views);
    return Math.max(...values, 1);
  }

  // Metodo para obtener el valor máximo dinámico de la curva
  get maxCurveValue(): number {
    const values = this.monthlyReproductionsData.map(d => d.views);
    return Math.max(...values, 1);
  }

  // Metodo para obtener la curva SVG path simplificado
  getCurvePathSimple(): string {
    const data = this.monthlyReproductionsData;
    const maxValue = this.maxCurveValue;
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

  // Métodos para seleccionar filtros
  seleccionarTop(top: number): void {
    this.selectedTop = top;
    this.dropdownTopAbierto = false;
    this.cargarEstadisticas();
  }

  seleccionarTiempo(tiempo: string): void {
    this.selectedTime = tiempo;
    this.dropdownTiempoAbierto = false;
    this.cargarEstadisticas();
  }

  seleccionarTipo(tipo: string): void {
    this.selectedType = tipo;
    this.dropdownTipoAbierto = false;
    this.cargarEstadisticas();
  }

  // Metodo para cerrar todos los dropdowns
  cerrarDropdowns(): void {
    this.dropdownTopAbierto = false;
    this.dropdownTiempoAbierto = false;
    this.dropdownTipoAbierto = false;
  }

  trackByRank(index: number, item: any): number {
    return item.rank;
  }

}

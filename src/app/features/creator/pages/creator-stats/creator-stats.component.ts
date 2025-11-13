import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ContentCreatorHeaderComponent
} from '../../../../shared/components/content-creator-header/content-creator-header.component';
import {CreatorSidebarComponent} from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import {FooterComponent} from '../../../../shared/footer/footer.component';

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
export class CreatorStatsComponent {
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

  // Datos completos por período de tiempo
  private allMonthlyViewsData = {
    '1semana': [
      { month: 'L', views: 580, color: '#3b82f6' },
      { month: 'M', views: 620, color: '#3b82f6' },
      { month: 'X', views: 550, color: '#3b82f6' },
      { month: 'J', views: 700, color: '#3b82f6' },
      { month: 'V', views: 820, color: '#3b82f6' },
      { month: 'S', views: 910, color: '#8b5cf6' },
      { month: 'D', views: 850, color: '#8b5cf6' }
    ],
    '2semanas': [
      { month: 'L', views: 1200, color: '#3b82f6' },
      { month: 'M', views: 1100, color: '#3b82f6' },
      { month: 'X', views: 1300, color: '#3b82f6' },
      { month: 'J', views: 1400, color: '#3b82f6' },
      { month: 'V', views: 1600, color: '#3b82f6' },
      { month: 'S', views: 1800, color: '#3b82f6' },
      { month: 'D', views: 1700, color: '#3b82f6' },
      { month: 'L', views: 1500, color: '#8b5cf6' },
      { month: 'M', views: 1650, color: '#8b5cf6' },
      { month: 'X', views: 1550, color: '#8b5cf6' },
      { month: 'J', views: 1750, color: '#8b5cf6' },
      { month: 'V', views: 1900, color: '#8b5cf6' },
      { month: 'S', views: 2100, color: '#8b5cf6' },
      { month: 'D', views: 2000, color: '#8b5cf6' }
    ],
    '1mes': [
      { month: 'Sem 1', views: 2800, color: '#3b82f6' },
      { month: 'Sem 2', views: 3200, color: '#3b82f6' },
      { month: 'Sem 3', views: 3600, color: '#3b82f6' },
      { month: 'Sem 4', views: 3900, color: '#8b5cf6' }
    ],
    '2meses': [
      { month: 'S1', views: 4000, color: '#3b82f6' },
      { month: 'S2', views: 3800, color: '#3b82f6' },
      { month: 'S3', views: 4200, color: '#3b82f6' },
      { month: 'S4', views: 4500, color: '#3b82f6' },
      { month: 'S1', views: 4300, color: '#8b5cf6' },
      { month: 'S2', views: 4700, color: '#8b5cf6' },
      { month: 'S3', views: 4400, color: '#8b5cf6' },
      { month: 'S4', views: 4900, color: '#8b5cf6' }
    ]
  };

  private allMonthlyReproductionsData = {
    '1semana': [
      { month: 'L', views: 300, x: 0 },
      { month: 'M', views: 680, x: 1 },
      { month: 'X', views: 520, x: 2 },
      { month: 'J', views: 780, x: 3 },
      { month: 'V', views: 650, x: 4 },
      { month: 'S', views: 920, x: 5 },
      { month: 'D', views: 840, x: 6 }
    ],
    '2semanas': [
      { month: 'L', views: 1100, x: 0 },
      { month: 'M', views: 1300, x: 1 },
      { month: 'X', views: 1200, x: 2 },
      { month: 'J', views: 1500, x: 3 },
      { month: 'V', views: 1400, x: 4 },
      { month: 'S', views: 1700, x: 5 },
      { month: 'D', views: 1600, x: 6 },
      { month: 'L', views: 1450, x: 7 },
      { month: 'M', views: 1750, x: 8 },
      { month: 'X', views: 1550, x: 9 },
      { month: 'J', views: 1850, x: 10 },
      { month: 'V', views: 1650, x: 11 },
      { month: 'S', views: 2000, x: 12 },
      { month: 'D', views: 1900, x: 13 }
    ],
    '1mes': [
      { month: 'Sem 1', views: 2600, x: 0 },
      { month: 'Sem 2', views: 3400, x: 1 },
      { month: 'Sem 3', views: 3100, x: 2 },
      { month: 'Sem 4', views: 3800, x: 3 }
    ],
    '2meses': [
      { month: 'S1', views: 3200, x: 0 },
      { month: 'S2', views: 3600, x: 1 },
      { month: 'S3', views: 4000, x: 2 },
      { month: 'S4', views: 4400, x: 3 },
      { month: 'S1', views: 3900, x: 4 },
      { month: 'S2', views: 4300, x: 5 },
      { month: 'S3', views: 3800, x: 6 },
      { month: 'S4', views: 4600, x: 7 }
    ]
  };

  // TOP 5 Reproducciones
  topReproductions = [
    { title: 'Susurros en la Noche', views: '12.4K', thumbnail: '/assets/brand/logo.svg', rank: 1 },
    { title: 'Neon City Stories', views: '10.9K', thumbnail: '/assets/brand/logo.svg', rank: 2 },
    { title: 'LoFi Study Beats', views: '9.3K', thumbnail: '/assets/brand/logo.svg', rank: 3 },
    { title: 'Run with Me Sunset', views: '8.7K', thumbnail: '/assets/brand/logo.svg', rank: 4 },
    { title: 'HIIT Total Body', views: '7.8K', thumbnail: '/assets/brand/logo.svg', rank: 5 },
    { title: 'Morning Meditation', views: '7.2K', thumbnail: '/assets/brand/logo.svg', rank: 6 },
    { title: 'Jazz Night Vibes', views: '6.9K', thumbnail: '/assets/brand/logo.svg', rank: 7 },
    { title: 'Cooking Masterclass', views: '6.5K', thumbnail: '/assets/brand/logo.svg', rank: 8 },
    { title: 'Tech Review 2024', views: '6.1K', thumbnail: '/assets/brand/logo.svg', rank: 9 },
    { title: 'Travel Diaries', views: '5.8K', thumbnail: '/assets/brand/logo.svg', rank: 10 },
    { title: 'Fitness Challenge', views: '5.5K', thumbnail: '/assets/brand/logo.svg', rank: 11 },
    { title: 'Art Tutorial', views: '5.2K', thumbnail: '/assets/brand/logo.svg', rank: 12 },
    { title: 'Gaming Stream', views: '4.9K', thumbnail: '/assets/brand/logo.svg', rank: 13 },
    { title: 'Book Review', views: '4.6K', thumbnail: '/assets/brand/logo.svg', rank: 14 },
    { title: 'DIY Projects', views: '4.3K', thumbnail: '/assets/brand/logo.svg', rank: 15 }
  ];

  // TOP 5 Valoración
  topRatings = [
    { title: 'Northern Lights Over', rating: '4.9', thumbnail: '/assets/brand/logo.svg', rank: 1 },
    { title: 'Watercolor Basics', rating: '4.8', thumbnail: '/assets/brand/logo.svg', rank: 2 },
    { title: 'Container Gardening', rating: '4.7', thumbnail: '/assets/brand/logo.svg', rank: 3 },
    { title: 'Perfect Pasta at Home', rating: '4.7', thumbnail: '/assets/brand/logo.svg', rank: 4 },
    { title: 'Susurros en la Noche', rating: '4.6', thumbnail: '/assets/brand/logo.svg', rank: 5 },
    { title: 'Photography Essentials', rating: '4.6', thumbnail: '/assets/brand/logo.svg', rank: 6 },
    { title: 'Yoga for Beginners', rating: '4.5', thumbnail: '/assets/brand/logo.svg', rank: 7 },
    { title: 'Digital Marketing', rating: '4.5', thumbnail: '/assets/brand/logo.svg', rank: 8 },
    { title: 'Piano Lessons', rating: '4.4', thumbnail: '/assets/brand/logo.svg', rank: 9 },
    { title: 'Woodworking Basics', rating: '4.4', thumbnail: '/assets/brand/logo.svg', rank: 10 },
    { title: 'Spanish Course', rating: '4.3', thumbnail: '/assets/brand/logo.svg', rank: 11 },
    { title: 'Web Development', rating: '4.3', thumbnail: '/assets/brand/logo.svg', rank: 12 },
    { title: 'Baking Mastery', rating: '4.2', thumbnail: '/assets/brand/logo.svg', rank: 13 },
    { title: 'Fitness Guide', rating: '4.2', thumbnail: '/assets/brand/logo.svg', rank: 14 },
    { title: 'Photography Pro', rating: '4.1', thumbnail: '/assets/brand/logo.svg', rank: 15 }
  ];

  // TOP 5 Especialidades
  topSpecialties = [
    { title: 'Terror Podcasts', engagement: '32', thumbnail: '/assets/brand/logo.svg', rank: 1 },
    { title: 'Fitness', engagement: '25', thumbnail: '/assets/brand/logo.svg', rank: 2 },
    { title: 'Viajes', engagement: '21', thumbnail: '/assets/brand/logo.svg', rank: 3 },
    { title: 'Cocina', engagement: '18', thumbnail: '/assets/brand/logo.svg', rank: 4 },
    { title: 'Arte', engagement: '15', thumbnail: '/assets/brand/logo.svg', rank: 5 },
    { title: 'Tecnología', engagement: '14', thumbnail: '/assets/brand/logo.svg', rank: 6 },
    { title: 'Música', engagement: '13', thumbnail: '/assets/brand/logo.svg', rank: 7 },
    { title: 'Deportes', engagement: '12', thumbnail: '/assets/brand/logo.svg', rank: 8 },
    { title: 'Educación', engagement: '11', thumbnail: '/assets/brand/logo.svg', rank: 9 },
    { title: 'Gaming', engagement: '10', thumbnail: '/assets/brand/logo.svg', rank: 10 },
    { title: 'Moda', engagement: '9', thumbnail: '/assets/brand/logo.svg', rank: 11 },
    { title: 'Ciencia', engagement: '8', thumbnail: '/assets/brand/logo.svg', rank: 12 },
    { title: 'Historia', engagement: '7', thumbnail: '/assets/brand/logo.svg', rank: 13 },
    { title: 'Negocios', engagement: '6', thumbnail: '/assets/brand/logo.svg', rank: 14 },
    { title: 'Salud', engagement: '5', thumbnail: '/assets/brand/logo.svg', rank: 15 }
  ];

  // Getters para datos filtrados
  get monthlyViewsData(): MonthData[] {
    return this.allMonthlyViewsData[this.selectedTime as keyof typeof this.allMonthlyViewsData] || this.allMonthlyViewsData['2meses'];
  }

  get monthlyReproductionsData(): MonthData[] {
    return this.allMonthlyReproductionsData[this.selectedTime as keyof typeof this.allMonthlyReproductionsData] || this.allMonthlyReproductionsData['2meses'];
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
    return Math.max(...values);
  }

  // Metodo para obtener el valor máximo dinámico de la curva
  get maxCurveValue(): number {
    const values = this.monthlyReproductionsData.map(d => d.views);
    return Math.max(...values);
  }

  // Metodo para obtener la curva SVG path simplificado
  getCurvePathSimple(): string {
    const data = this.monthlyReproductionsData;
    const maxValue = this.maxCurveValue;
    const numPoints = data.length;

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
  }

  seleccionarTiempo(tiempo: string): void {
    this.selectedTime = tiempo;
    this.dropdownTiempoAbierto = false;
  }

  seleccionarTipo(tipo: string): void {
    this.selectedType = tipo;
    this.dropdownTipoAbierto = false;
  }

  // Metodo para cerrar todos los dropdowns
  cerrarDropdowns(): void {
    this.dropdownTopAbierto = false;
    this.dropdownTiempoAbierto = false;
    this.dropdownTipoAbierto = false;
  }
}

// src/app/pages/ad-creators/ad-creators.component.ts
import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { CreatorService, CreatorEC } from '../../core/services/creator.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, HttpClientModule],
  providers: [CreatorService],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminCreatorsPage implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  sidebarVisible = false;
  creadores: CreatorEC[] = [];
  isLoading = true;
  error: string | null = null;

  // Para paginación dinámica
  currentPage = 1;
  pageSize = 5;
  totalCreadores = 0;

  // Constantes para el cálculo
  private readonly HEADER_HEIGHT = 64;
  private readonly TITLE_SECTION_HEIGHT = 80;
  private readonly SEARCH_SECTION_HEIGHT = 80;
  private readonly TABLE_HEADER_HEIGHT = 45;
  private readonly ROW_HEIGHT = 59;
  private readonly PAGINATION_HEIGHT = 80;
  private readonly PADDING = 48;

  constructor(
    private router: Router,
    private creatorService: CreatorService
  ) {}

  ngOnInit(): void {
    this.cargarCreadores();
  }

  ngAfterViewInit(): void {
    this.calcularPageSize();
    setTimeout(() => this.calcularPageSize(), 100);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
    this.calcularPageSize();
  }

  calcularPageSize(): void {
    const windowHeight = window.innerHeight;

    const availableHeight = windowHeight
      - this.HEADER_HEIGHT
      - this.TITLE_SECTION_HEIGHT
      - this.SEARCH_SECTION_HEIGHT
      - this.TABLE_HEADER_HEIGHT
      - this.PAGINATION_HEIGHT
      - this.PADDING;

    const filasQueCaben = Math.floor(availableHeight / this.ROW_HEIGHT);
    this.pageSize = Math.max(3, Math.min(filasQueCaben, 20));

    const totalPaginasNuevas = Math.ceil(this.totalCreadores / this.pageSize);
    if (this.currentPage > totalPaginasNuevas && totalPaginasNuevas > 0) {
      this.currentPage = totalPaginasNuevas;
    }

    console.log(`Altura disponible: ${availableHeight}px, Filas por página: ${this.pageSize}`);
  }

  cargarCreadores(): void {
    this.isLoading = true;
    this.error = null;

    this.creatorService.listarCreadores().subscribe({
      next: (data) => {
        this.creadores = data;
        this.totalCreadores = data.length;
        this.isLoading = false;

        setTimeout(() => this.calcularPageSize(), 100);
      },
      error: (err) => {
        console.error('Error al cargar creadores:', err);
        this.error = 'Error al cargar los creadores de contenido. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  get creadoresPaginados(): CreatorEC[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.creadores.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalCreadores / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.totalCreadores === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCreadores);
    return `${start}–${end} de ${this.totalCreadores}`;
  }

  paginaAnterior(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  paginaSiguiente(): void {
    if (this.currentPage < this.totalPaginas) {
      this.currentPage++;
    }
  }

  editarCreador(id: string): void {
    console.log('Editar creador:', id);
    // TODO: Implementar navegación a página de edición
  }

  eliminarCreador(id: string): void {
    console.log('Eliminar creador:', id);
    // TODO: Implementar diálogo de confirmación y eliminación
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
  }

  navigateToUsers(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-users']);
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-admin']);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    window.location.reload();
  }

  addNewCreator(): void {
    this.router.navigate(['/ad-creators-add']);
  }
}

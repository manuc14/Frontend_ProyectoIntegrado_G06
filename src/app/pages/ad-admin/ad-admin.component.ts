// src/app/pages/ad-admin/ad-admin.component.ts
import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { AdminService, AdminEV } from '../../core/services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, HttpClientModule],
  providers: [AdminService],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminAdmsPage implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  sidebarVisible = false;
  administradores: AdminEV[] = [];
  isLoading = true;
  error: string | null = null;

  // Para paginación dinámica
  currentPage = 1;
  pageSize = 5;
  totalAdministradores = 0;

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
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.cargarAdministradores();
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

    const totalPaginasNuevas = Math.ceil(this.totalAdministradores / this.pageSize);
    if (this.currentPage > totalPaginasNuevas && totalPaginasNuevas > 0) {
      this.currentPage = totalPaginasNuevas;
    }

    console.log(`Altura disponible: ${availableHeight}px, Filas por página: ${this.pageSize}`);
  }

  cargarAdministradores(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.listarAdministradores().subscribe({
      next: (data) => {
        this.administradores = data;
        this.totalAdministradores = data.length;
        this.isLoading = false;

        setTimeout(() => this.calcularPageSize(), 100);
      },
      error: (err) => {
        console.error('Error al cargar administradores:', err);
        this.error = 'Error al cargar los administradores. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  get administradoresPaginados(): AdminEV[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.administradores.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalAdministradores / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.totalAdministradores === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalAdministradores);
    return `${start}–${end} de ${this.totalAdministradores}`;
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

  editarAdministrador(id: string): void {
    console.log('Editar administrador:', id);
    // TODO: Implementar navegación a página de edición
  }

  eliminarAdministrador(id: string): void {
    console.log('Eliminar administrador:', id);
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
    window.location.reload();
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-creators']);
  }

  addNewAdmin(): void {
    this.router.navigate(['/ad-admin-add']);
  }
}

// src/app/pages/ad-users/ad-users.component.ts
import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { UserService, UserEV } from '../../core/services/user.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-adusers',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, HttpClientModule],
  providers: [UserService],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminUsersPage implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  sidebarVisible = false;
  usuarios: UserEV[] = [];
  isLoading = true;
  error: string | null = null;

  // Para paginación dinámica
  currentPage = 1;
  pageSize = 5; // Valor inicial, se calculará dinámicamente
  totalUsuarios = 0;

  // Constantes para el cálculo
  private readonly HEADER_HEIGHT = 64; // Altura del header principal
  private readonly TITLE_SECTION_HEIGHT = 80; // Altura de la sección "Usuarios"
  private readonly SEARCH_SECTION_HEIGHT = 80; // Altura de la sección de búsqueda
  private readonly TABLE_HEADER_HEIGHT = 45; // Altura de los encabezados de la tabla
  private readonly ROW_HEIGHT = 59; // Altura de cada fila (incluyendo borde)
  private readonly PAGINATION_HEIGHT = 80; // Altura de la sección de paginación
  private readonly PADDING = 48; // Padding total (24px arriba + 24px abajo)

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    // Calcular el tamaño de página inicial
    this.calcularPageSize();

    // Recalcular cuando cambie el tamaño de la ventana
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
    // Obtener la altura disponible para la tabla
    const windowHeight = window.innerHeight;

    const availableHeight = windowHeight
      - this.HEADER_HEIGHT
      - this.TITLE_SECTION_HEIGHT
      - this.SEARCH_SECTION_HEIGHT
      - this.TABLE_HEADER_HEIGHT
      - this.PAGINATION_HEIGHT
      - this.PADDING;

    // Calcular cuántas filas completas caben
    const filasQueCaben = Math.floor(availableHeight / this.ROW_HEIGHT);

    // Establecer un mínimo de 3 filas y un máximo de 20
    this.pageSize = Math.max(3, Math.min(filasQueCaben, 20));

    // Si estamos en una página que ya no existe después del recálculo, volver a la última válida
    const totalPaginasNuevas = Math.ceil(this.totalUsuarios / this.pageSize);
    if (this.currentPage > totalPaginasNuevas && totalPaginasNuevas > 0) {
      this.currentPage = totalPaginasNuevas;
    }

    console.log(`Altura disponible: ${availableHeight}px, Filas por página: ${this.pageSize}`);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();

    return `${dia}/${mes}/${anio}`;
  }

  cargarUsuarios(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.totalUsuarios = data.length;
        this.isLoading = false;

        // Recalcular el pageSize después de cargar los datos
        setTimeout(() => this.calcularPageSize(), 100);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'Error al cargar los usuarios. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  get usuariosPaginados(): UserEV[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.usuarios.slice(start, end);
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalUsuarios / this.pageSize);
  }

  get rangoMostrado(): string {
    if (this.totalUsuarios === 0) {
      return '0 de 0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalUsuarios);
    return `${start}–${end} de ${this.totalUsuarios}`;
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

  editarUsuario(id: string): void {
    console.log('Editar usuario:', id);
    // TODO: Implementar navegación a página de edición
    // this.router.navigate(['/ad-users/edit', id]);
  }

  eliminarUsuario(id: string): void {
    console.log('Eliminar usuario:', id);
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
    window.location.reload();
  }

  navigateToAdmins(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-admin']);
  }

  navigateToCreators(): void {
    this.closeSidebar();
    this.router.navigate(['/ad-creators']);
  }
}

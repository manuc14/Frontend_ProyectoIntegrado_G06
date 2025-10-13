import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';

// Interfaz para los datos de administrador
interface Admin {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adadmin',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent],
  templateUrl: './ad-admin.component.html',
  styleUrl: './ad-admin.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminAdmsPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Datos de administradores simulados
  allAdmins: Admin[] = [
    {
      id: '1',
      photo: 'assets/admin/admin1.png',
      name: 'María',
      lastName: 'González Pérez',
      email: 'maria.gonzalez@esimedia.com',
      department: 'Tecnología',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/admin2.png',
      name: 'Carlos',
      lastName: 'Rodríguez López',
      email: 'carlos.rodriguez@esimedia.com',
      department: 'Operaciones',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '3',
      photo: 'assets/admin/admin3.png',
      name: 'Ana',
      lastName: 'Martínez Silva',
      email: 'ana.martinez@esimedia.com',
      department: 'Marketing',
      role: 'Admin',
      status: 'bloqueado'
    },
    {
      id: '4',
      photo: 'assets/admin/admin4.png',
      name: 'David',
      lastName: 'López Fernández',
      email: 'david.lopez@esimedia.com',
      department: 'Finanzas',
      role: 'Admin',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/admin5.png',
      name: 'Laura',
      lastName: 'Sánchez Torres',
      email: 'laura.sanchez@esimedia.com',
      department: 'Recursos Humanos',
      role: 'Admin',
      status: 'activo'
    }
  ];

  // Lista filtrada que se muestra en la interfaz
  filteredAdmins: Admin[] = [];

  constructor(private router: Router) {
    // Inicializar con todos los administradores
    this.filteredAdmins = [...this.allAdmins];
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

  /**
   * Ejecuta la búsqueda de administradores - Evento del SearchBar component
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.performSearch();
  }

  /**
   * Realiza la búsqueda filtrada
   */
  private performSearch(): void {
    if (!this.searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los administradores
      this.filteredAdmins = [...this.allAdmins];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredAdmins = this.allAdmins.filter(admin => {
      return (
        admin.name.toLowerCase().includes(searchLower) ||
        admin.lastName.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower) ||
        admin.department.toLowerCase().includes(searchLower) ||
        admin.role.toLowerCase().includes(searchLower)
      );
    });
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    this.searchTerm = '';
    this.filteredAdmins = [...this.allAdmins];
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByAdminId(index: number, admin: Admin): string {
    return admin.id;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

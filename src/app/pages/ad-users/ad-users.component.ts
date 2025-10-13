import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';

// Interfaz para los datos de usuario
interface User {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  alias: string;
  email: string;
  birthDate: string;
  role: 'VIP' | 'Estándar';
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adusers',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminUsersPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Datos de usuarios simulados
  allUsers: User[] = [
    {
      id: '1',
      photo: 'assets/admin/user1.png',
      name: 'María',
      lastName: 'López Sánchez',
      alias: '@mlopez',
      email: 'maria.lopez@esimedia.com',
      birthDate: '12/03/1992',
      role: 'VIP',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/user2.png',
      name: 'Carlos',
      lastName: 'Pérez Gómez',
      alias: '@carlosp',
      email: 'carlos.perez@esimedia.com',
      birthDate: '28/11/1988',
      role: 'Estándar',
      status: 'bloqueado'
    },
    {
      id: '3',
      photo: 'assets/admin/user3.png',
      name: 'Lucía',
      lastName: 'Gómez Lozano',
      alias: '@lgomez',
      email: 'lucia.gomez@esimedia.com',
      birthDate: '04/06/1995',
      role: 'Estándar',
      status: 'activo'
    },
    {
      id: '4',
      photo: 'assets/admin/user4.png',
      name: 'Ana',
      lastName: 'Martínez Ribera',
      alias: '@amartinez',
      email: 'ana.martinez@esimedia.com',
      birthDate: '20/01/1990',
      role: 'VIP',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/user5.png',
      name: 'Diego',
      lastName: 'Ramírez González',
      alias: '@dramirez',
      email: 'diego.ramirez@esimedia.com',
      birthDate: '09/09/1987',
      role: 'Estándar',
      status: 'bloqueado'
    }
  ];

  // Lista filtrada de usuarios
  filteredUsers: User[] = [...this.allUsers];

  constructor(private router: Router) {}

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

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }

  /**
   * Ejecuta la búsqueda de usuarios - Evento del SearchBar component
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
      // Si no hay término de búsqueda, mostrar todos los usuarios
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredUsers = this.allUsers.filter(user => {
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.alias.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });

    console.log(`Búsqueda: "${this.searchTerm}" - Resultados: ${this.filteredUsers.length}`);
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    this.searchTerm = '';
    this.filteredUsers = [...this.allUsers];
  }

  /**
   * Limpia la búsqueda y restaura todos los usuarios (método legacy)
   */
  clearSearch(): void {
    this.onClearSearch();
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}

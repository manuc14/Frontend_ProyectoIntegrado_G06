import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { FilterPanelComponent, FilterGroup, AppliedFilters } from '../../shared/filter-panel/filter-panel.component';

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
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent, FilterPanelComponent],
  templateUrl: './ad-users.component.html',
  styleUrl: './ad-users.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, shakeError]
})
export class AdminUsersPage {
  sidebarVisible = false;
  searchTerm = '';
  showFilters = false;
  appliedFilters: AppliedFilters = {};
  
  // Configuración de filtros para usuarios
  filterGroups: FilterGroup[] = [
    {
      id: 'role',
      label: 'Rol de usuario',
      type: 'select',
      placeholder: 'Seleccionar rol...',
      options: [
        { value: 'VIP', label: 'VIP', count: 2 },
        { value: 'Estándar', label: 'Estándar', count: 3 }
      ]
    },
    {
      id: 'status',
      label: 'Estado',
      type: 'multiselect',
      options: [
        { value: 'activo', label: 'Activo', count: 4 },
        { value: 'bloqueado', label: 'Bloqueado', count: 1 }
      ]
    },
    {
      id: 'birthYear',
      label: 'Nacido después del año',
      type: 'date'
    }
  ];
  
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
   * Abre el panel de filtros
   */
  openFilters(): void {
    this.showFilters = true;
  }

  /**
   * Maneja los cambios en los filtros aplicados
   */
  onFiltersChanged(appliedFilters: AppliedFilters): void {
    this.appliedFilters = appliedFilters;
    this.applyFiltersToData();
  }

  /**
   * Maneja el reset de filtros
   */
  onFiltersReset(): void {
    this.appliedFilters = {};
    this.filteredUsers = [...this.allUsers];
    this.performSearch(); // Reaplica la búsqueda si hay término
  }

  /**
   * Aplica los filtros a los datos
   */
  private applyFiltersToData(): void {
    let data = [...this.allUsers];

    // Aplicar filtro de rol
    if (this.appliedFilters['role']) {
      const role = this.appliedFilters['role'] as string;
      data = data.filter(user => user.role === role);
    }

    // Aplicar filtro de estado (puede ser string o array para multiselect)
    if (this.appliedFilters['status']) {
      const status = this.appliedFilters['status'];
      if (Array.isArray(status)) {
        // Multiselect: incluir usuarios que tengan cualquiera de los estados seleccionados
        data = data.filter(user => status.includes(user.status));
      } else {
        // Select simple
        data = data.filter(user => user.status === status);
      }
    }

    // Aplicar filtro de año de nacimiento
    if (this.appliedFilters['birthYear']) {
      const year = parseInt(this.appliedFilters['birthYear'] as string);
      data = data.filter(user => {
        // Parsear fecha de nacimiento (formato DD/MM/YYYY)
        const [, , userYear] = user.birthDate.split('/').map(Number);
        return userYear >= year;
      });
    }

    this.filteredUsers = data;
    this.performSearch(); // Reaplica la búsqueda si hay término
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

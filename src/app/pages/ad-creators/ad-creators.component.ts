import {Component, HostListener} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';

// Interfaz para los datos de creador
interface Creator {
  id: string;
  photo: string;
  name: string;
  lastName: string;
  alias: string;
  email: string;
  category: string;
  followers: string;
  status: 'activo' | 'bloqueado';
}

@Component({
  selector: 'app-adcreators',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, SearchBarComponent],
  templateUrl: './ad-creators.component.html',
  styleUrl: './ad-creators.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminCreatorsPage {
  sidebarVisible = false;
  searchTerm = '';
  
  // Datos de creadores simulados
  allCreators: Creator[] = [
    {
      id: '1',
      photo: 'assets/admin/creator1.png',
      name: 'Isabella',
      lastName: 'Martín García',
      alias: '@isabellamartin',
      email: 'isabella.martin@esimedia.com',
      category: 'Lifestyle',
      followers: '2.5M',
      status: 'activo'
    },
    {
      id: '2',
      photo: 'assets/admin/creator2.png',
      name: 'Alejandro',
      lastName: 'Ruiz Fernández',
      alias: '@aleruiz',
      email: 'alejandro.ruiz@esimedia.com',
      category: 'Tecnología',
      followers: '1.8M',
      status: 'activo'
    },
    {
      id: '3',
      photo: 'assets/admin/creator3.png',
      name: 'Carmen',
      lastName: 'López Sánchez',
      alias: '@carmenlopez',
      email: 'carmen.lopez@esimedia.com',
      category: 'Cocina',
      followers: '3.2M',
      status: 'bloqueado'
    },
    {
      id: '4',
      photo: 'assets/admin/creator4.png',
      name: 'Miguel',
      lastName: 'Torres Jiménez',
      alias: '@migueltorres',
      email: 'miguel.torres@esimedia.com',
      category: 'Deportes',
      followers: '950K',
      status: 'activo'
    },
    {
      id: '5',
      photo: 'assets/admin/creator5.png',
      name: 'Sofía',
      lastName: 'Moreno Castillo',
      alias: '@sofiamoreno',
      email: 'sofia.moreno@esimedia.com',
      category: 'Arte',
      followers: '1.2M',
      status: 'activo'
    }
  ];

  // Lista filtrada que se muestra en la interfaz
  filteredCreators: Creator[] = [];

  constructor(private router: Router) {
    // Inicializar con todos los creadores
    this.filteredCreators = [...this.allCreators];
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

  /**
   * Ejecuta la búsqueda de creadores - Evento del SearchBar component
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
      // Si no hay término de búsqueda, mostrar todos los creadores
      this.filteredCreators = [...this.allCreators];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredCreators = this.allCreators.filter(creator => {
      return (
        creator.name.toLowerCase().includes(searchLower) ||
        creator.lastName.toLowerCase().includes(searchLower) ||
        creator.alias.toLowerCase().includes(searchLower) ||
        creator.email.toLowerCase().includes(searchLower) ||
        creator.category.toLowerCase().includes(searchLower)
      );
    });
  }

  /**
   * Limpia la búsqueda - Evento del SearchBar component
   */
  onClearSearch(): void {
    this.searchTerm = '';
    this.filteredCreators = [...this.allCreators];
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByCreatorId(index: number, creator: Creator): string {
    return creator.id;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

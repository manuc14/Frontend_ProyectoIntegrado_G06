import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { Router } from '@angular/router';

interface ContentList {
  id: string;
  title: string;
  cover: string;
  itemCount: number;
}

interface RecentEdit {
  id: string;
  title: string;
  thumbnail: string;
  lastEdited: Date;
}

@Component({
  selector: 'app-content-creator',
  standalone: true,
  imports: [CommonModule, FooterComponent, ContentCreatorHeaderComponent],
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  
  private router = inject(Router);

  // Datos para las listas de contenido
  contentLists: ContentList[] = [];
  
  // Datos para ediciones recientes
  recentEdits: RecentEdit[] = [];

  ngOnInit(): void {
    // Mock data - por defecto vacío hasta integrar con API
    this.contentLists = [];
    this.recentEdits = [];
  }

  /* Navega a diferentes páginas */
  navigateToUpload(): void {
    this.router.navigate(['/upload-content']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /* Crea una nueva lista de contenido */
  createNewList(): void {
    const listName = prompt('Nombre de la nueva lista:');
    if (listName) {
      this.contentLists.push({
        id: Date.now().toString(),
        title: listName,
        cover: '/assets/brand/logo.svg',
        itemCount: 0
      });
    }
  }

  /* Comienza a editar un nuevo video/audio */
  startEditing(): void {
    const title = prompt('Título del nuevo contenido:');
    if (title) {
      this.recentEdits.unshift({
        id: Date.now().toString(),
        title: title,
        thumbnail: '/assets/brand/logo.svg',
        lastEdited: new Date()
      });
      alert(`¡Contenido "${title}" agregado a ediciones recientes!`);
    }
  }

  /* Funcionalidad de edición, vista y gestión de contenido */
  editContent(contentId: string): void {
    alert(contentId ? `Editando contenido: ${contentId}` : 'Funcionalidad de edición general en desarrollo');
  }

  viewMyLists(): void {
    alert('Navegando a mis listas');
  }

  viewStatistics(): void {
    alert('Navegando a estadísticas');
  }

  createPublication(): void {
    alert('Funcionalidad de crear publicación en desarrollo');
  }

  deleteLists(): void {
    if (this.contentLists.length === 0) {
      alert('No hay listas para eliminar');
    } else if (confirm('¿Estás seguro de que quieres eliminar listas?')) {
      this.contentLists.pop();
      alert('Lista eliminada correctamente');
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  /**
   * Escucha el evento de navegación hacia atrás del navegador
   */
  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    this.logout();
  }
}

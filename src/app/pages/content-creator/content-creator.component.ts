import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../shared/footer/footer.component';
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
  imports: [CommonModule,FooterComponent],
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
    this.loadContentLists();
    this.loadRecentEdits();
  }

  /**
   * Carga las listas de contenido del usuario
   */
  loadContentLists(): void {
    // Mock data - reemplazar con llamada al API
    // Por defecto, no hay listas creadas
    this.contentLists = [];
  }

  /**
   * Carga las ediciones recientes
   */
  loadRecentEdits(): void {
    // Mock data - reemplazar con llamada al API
    // Por defecto, no hay ediciones recientes
    this.recentEdits = [];
  }

  /**
   * Navega a la página de subida de contenido
   */
  navigateToUpload(): void {
    this.router.navigate(['/upload-content']);
  }

  /**
   * Navega a la página de inicio
   */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Crea una nueva lista de contenido
   */
  createNewList(): void {
    const listName = prompt('Nombre de la nueva lista:');
    if (listName) {
      const newList: ContentList = {
        id: Date.now().toString(),
        title: listName,
        cover: '/assets/brand/logo.svg',
        itemCount: 0
      };
      this.contentLists.push(newList);
    }
  }

  /**
   * Comienza a editar un nuevo video/audio
   */
  startEditing(): void {
    const title = prompt('Título del nuevo contenido:');
    if (title) {
      const newEdit: RecentEdit = {
        id: Date.now().toString(),
        title: title,
        thumbnail: '/assets/brand/logo.svg',
        lastEdited: new Date()
      };
      this.recentEdits.unshift(newEdit); // Agregar al inicio
      alert(`¡Contenido "${title}" agregado a ediciones recientes!`);
    }
  }

  /**
   * Edita contenido específico
   */
  editContent(contentId: string): void {
    if (contentId) {
      alert(`Editando contenido: ${contentId}`);
    } else {
      alert('Funcionalidad de edición general en desarrollo');
    }
  }

  /**
   * Muestra las listas del usuario
   */
  viewMyLists(): void {
    alert('Navegando a mis listas');
  }

  /**
   * Muestra las estadísticas del canal
   */
  viewStatistics(): void {
    alert('Navegando a estadísticas');
  }

  /**
   * Elimina listas seleccionadas
   */
  deleteLists(): void {
    if (this.contentLists.length === 0) {
      alert('No hay listas para eliminar');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar listas?')) {
      // Por simplicidad, eliminaremos la última lista
      this.contentLists.pop();
      alert('Lista eliminada correctamente');
    }
  }

  /**
   * Crea una nueva publicación
   */
  createPublication(): void {
    alert('Funcionalidad de crear publicación en desarrollo');
  }
}

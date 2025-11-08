import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CatalogComponent } from '../../../content/pages/catalog/catalog.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { CreatorSidebarComponent } from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-creator-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogComponent, ContentCreatorHeaderComponent, CreatorSidebarComponent, FooterComponent],
  templateUrl: './creator-catalog.component.html',
  styleUrls: ['./creator-catalog.component.scss']
})
export class CreatorCatalogComponent {
  // Estado del sidebar
  sidebarCollapsed = false;

  constructor(private router: Router) {}

  onAddContent(listId: string): void {
    console.log('➕ Añadir contenido a lista:', listId);
    this.router.navigate(['/add-content', listId]);
  }


  onEditList(section: string): void {
    console.log('CreatorCatalog: Received editList for', section);
    let id: string | undefined;
    switch(section) {
      case 'tendencias':
        id = '1';
        break;
      case 'nuevos':
        id = '2';
        break;
      case 'recomendado':
        id = '3';
        break;
      default:
        console.warn('Sección no mapeada:', section);
        return;
    }

    if (id) {
      console.log('Navigating to edit-list/', id);
      this.router.navigate(['/edit-list', id]);
    }
  }

  onDeleteList(section: string): void {
    console.log('CreatorCatalog: Received deleteList for', section);
  }
}

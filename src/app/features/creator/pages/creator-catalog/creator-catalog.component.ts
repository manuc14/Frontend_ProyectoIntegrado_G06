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

  onEditList(listId: string): void {
    sessionStorage.setItem('editListId', listId);
    this.router.navigate(['/edit-list']);
  }

  onDeleteList(listId: string): void {
    // El componente catalog ya maneja la eliminación
    console.log('DeleteList delegado al catalog component para:', listId);
  }
}

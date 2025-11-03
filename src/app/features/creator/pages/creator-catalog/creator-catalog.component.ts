import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogComponent } from '../../../content/pages/catalog/catalog.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';

@Component({
  selector: 'app-creator-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogComponent, ContentCreatorHeaderComponent, FooterComponent],
  templateUrl: './creator-catalog.component.html',
  styleUrls: ['./creator-catalog.component.scss']
})
export class CreatorCatalogComponent {
  // Estado del sidebar
  sidebarCollapsed = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Métodos para los botones de acción (por ahora solo logs)
  onAddContent(section: string): void {
    console.log('Añadir contenido a:', section);
    // TODO: Implementar lógica
  }

  onEditList(section: string): void {
    console.log('Editar lista:', section);
    // TODO: Implementar lógica
  }
}

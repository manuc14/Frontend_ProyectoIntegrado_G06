import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { PublicListService } from '../../../../core/services/public-list.service';
import { ContentSelectorComponent, SuggestedContent } from '../../../../shared/content-selector/content-selector.component';
import { initializeListComponent } from '../../../../shared/utils/list-init.util';

@Component({
  selector: 'app-add-content',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentSelectorComponent],
  templateUrl: './add-content.component.html',
  styleUrls: ['./add-content.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn]
})
export class AddContentComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly publicListService = inject(PublicListService);
  listId: string = '';
  listName: string = '';
  listType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  selectedContent: SuggestedContent[] = [];
  isSubmitting = false;
  error: string | null = null;
  ngOnInit(): void {
    initializeListComponent(this.router, this.route, (listId) => {
      this.listId = listId;
      this.loadListData();
    });
  }
  private loadListData(): void {
    this.publicListService.getListById(this.listId).subscribe({
      next: (lista) => {
        this.listName = lista.nombre;
        this.listType = lista.dominantType as 'VIDEO' | 'AUDIO';
      },
      error: (error) => {
        this.error = 'Error al cargar la información de la lista.';
      }
    });
  }
  onSubmit(): void {
    this.error = null;
    if (this.selectedContent.length === 0) {
      this.error = 'Debes seleccionar al menos un contenido.';
      return;
    }
    const contenidosToAdd = this.selectedContent.map(c => ({
      id: c.id,
      titulo: c.title,
      descripcion: c.descripcion,
      miniaturaUrl: c.thumbnail,
      ficheroUrl: c.ficheroUrl ?? '',
      tipo: c.tipo ?? this.listType,
      autorId: c.autorId ?? '',
      duracion: this.parseDuration(c.duration)
    }));
    this.isSubmitting = true;
    this.publicListService.addContentsToList(this.listId, contenidosToAdd).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/creator/catalog']);
      },
      error: () => {
        this.isSubmitting = false;
        this.error = 'Error al agregar los contenidos a la lista.';
      }
    });
  }
  private parseDuration(duration: string): number {
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  }
  goBack(): void {
    if (this.selectedContent.length > 0) {
      const confirmLeave = confirm(
        '¿Estás seguro de que deseas salir? Los contenidos seleccionados no se añadirán.'
      );
      if (confirmLeave) {
        this.router.navigate(['/creator/catalog']);
      }
    } else {
      this.router.navigate(['/creator/catalog']);
    }
  }
}

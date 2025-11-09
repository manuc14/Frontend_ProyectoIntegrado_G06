import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { ErrorContainerComponent } from '../../../../shared/error-container/error-container.component';
import { PublicListService, ListaPublicaResponse } from '../../../../core/services/public-list.service';
import { ContentSelectorComponent, SuggestedContent } from '../../../../shared/content-selector/content-selector.component';
import { handleListSubmit } from '../../../../shared/utils/list-init.util';

export interface PrivateListForm {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-edit-private-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    TextAreaFieldComponent,
    ErrorContainerComponent,
    ContentSelectorComponent
  ],
  templateUrl: './edit-private-list.component.html',
  styleUrls: ['./edit-private-list.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn]
})
export class EditPrivateListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly formBaseService = inject(FormBaseService);
  private readonly publicListService = inject(PublicListService);
  
  listForm!: FormGroup;
  formId: string = 'edit-private-list';
  currentFormState: any = {};
  addedContent: SuggestedContent[] = [];
  selectedContentType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  isPrivateMode = true;
  listId: string = '';
  initialList?: ListaPublicaResponse;
  preselectedIds: string[] = [];

  ngOnInit(): void {
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.listId = sessionStorage.getItem('editPrivateListId') ?? '';
    if (!this.listId) {
      this.router.navigate(['/my-lists']);
      return;
    }

    this.formBaseService.createFormState(this.formId, {});
    this.formBaseService.getFormState(this.formId)?.subscribe(state => {
      this.currentFormState = state;
    });

    this.listForm = this.formBaseService.createFormGroup<PrivateListForm>({
      nombre: '',
      descripcion: ''
    });

    this.loadListData();
  }

  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
    sessionStorage.removeItem('editPrivateListId');
  }

  private loadListData(): void {
    this.publicListService.getPrivateLists().subscribe({
      next: (listas) => {
        const lista = listas.find(l => l.id === this.listId);
        if (!lista) {
          this.router.navigate(['/my-lists']);
          return;
        }

        this.initialList = lista;
        this.listForm.patchValue({
          nombre: lista.nombre,
          descripcion: lista.descripcion
        });

        this.selectedContentType = lista.dominantType as 'VIDEO' | 'AUDIO';
        this.preselectedIds = lista.items.map(item => item._id);
      },
      error: () => {
        this.formBaseService.updateFormState(this.formId, {
          error: 'Error al cargar la lista'
        });
      }
    });
  }

  onSubmit(): void {
    const request = handleListSubmit(
      this.listForm,
      this.addedContent,
      this.selectedContentType,
      false, // Las listas privadas siempre son no visibles
      this.formBaseService,
      this.formId
    );

    if (request) {
      this.formBaseService.updateFormState(this.formId, { isSubmitting: true });
      this.publicListService.updatePrivateList(this.listId, request).subscribe({
        next: () => {
          this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
          this.router.navigate(['/my-lists']);
        },
        error: (error) => {
          this.formBaseService.updateFormState(this.formId, {
            error: error.message || 'Error al actualizar la lista privada. Inténtalo de nuevo.',
            isSubmitting: false
          });
        }
      });
    }
  }

  goBack(): void {
    if (this.listForm.dirty || this.hasContentChanged()) {
      if (confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/my-lists']);
      }
    } else {
      this.router.navigate(['/my-lists']);
    }
  }

  private hasContentChanged(): boolean {
    if (!this.initialList) return false;
    const initialIds = this.initialList.items.map(i => i._id).sort((a, b) => a.localeCompare(b));
    const currentIds = this.addedContent.map(i => i.id).sort((a, b) => a.localeCompare(b));
    return JSON.stringify(initialIds) !== JSON.stringify(currentIds);
  }
}

// Updated EditPublicListComponent.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { ErrorContainerComponent } from '../../../../shared/error-container/error-container.component';
import { PublicListService } from '../../../../core/services/public-list.service';
import { ContentSelectorComponent, SuggestedContent } from '../../../../shared/content-selector/content-selector.component';
import { initializeListComponent , handleListSubmit } from '../../../../shared/utils/list-init.util';

export interface PublicListForm {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-edit-public-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    TextAreaFieldComponent,
    ErrorContainerComponent,
    ContentSelectorComponent
  ],
  templateUrl: './edit-public-list.component.html',
  styleUrls: ['./edit-public-list.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn]
})
export class EditPublicListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBaseService = inject(FormBaseService);
  private readonly publicListService = inject(PublicListService);
  listForm!: FormGroup;
  formId: string = 'edit-public-list';
  currentFormState: any = {};
  listId: string = '';
  addedContent: SuggestedContent[] = [];
  selectedContentType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  isVisible: boolean = true;
  isLoadingList = false;
  preselectedIds: string[] = [];
  ngOnInit(): void {
    initializeListComponent(this.router, this.route, (listId) => {
      this.listId = listId;
      // Limpiar sessionStorage después de obtener el ID
      sessionStorage.removeItem('editListId');
      
      this.formBaseService.createFormState(this.formId, {});
      this.formBaseService.getFormState(this.formId)?.subscribe(state => {
        this.currentFormState = state;
      });
      this.listForm = this.formBaseService.createFormGroup<PublicListForm>({
        nombre: '',
        descripcion: ''
      });
      this.loadListData();
    });
  }
  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
  }
  private loadListData(): void {
    this.isLoadingList = true;
    this.publicListService.getListById(this.listId).subscribe({
      next: (lista) => {
        this.listForm.patchValue({
          nombre: lista.nombre,
          descripcion: lista.descripcion
        });
        this.isVisible = lista.visible;
        this.selectedContentType = lista.dominantType as 'VIDEO' | 'AUDIO';
        this.preselectedIds = lista.items.map(item => item._id);
        this.isLoadingList = false;
      },
      error: (error) => {
        this.formBaseService.updateFormState(this.formId, {
          error: 'Error al cargar la información de la lista.'
        });
        this.isLoadingList = false;
      }
    });
  }
  onVisibilityChange(visible: boolean): void {
    this.isVisible = visible;
  }
  onContentTypeChange(type: 'VIDEO' | 'AUDIO'): void {
    this.selectedContentType = type;
  }
  onSelectedChange(selected: SuggestedContent[]): void {
    this.addedContent = selected;
  }
  onSubmit(): void {
    const request = handleListSubmit(
      this.listForm,
      this.addedContent,
      this.selectedContentType,
      this.isVisible,
      this.formBaseService,
      this.formId
    );
    if (request) {
      this.formBaseService.updateFormState(this.formId, { isSubmitting: true });
      this.publicListService.updatePublicList(this.listId, request).subscribe({
        next: () => {
          this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
          this.router.navigate(['/creator/catalog']);
        },
        error: (error) => {
          this.formBaseService.updateFormState(this.formId, {
            error: error.message || 'Error al actualizar la lista. Inténtalo de nuevo.',
            isSubmitting: false
          });
        }
      });
    }
  }
  goBack(): void {
    if (this.listForm.dirty || this.addedContent.length > 0) {
      if (confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/creator/catalog']);
      }
    } else {
      this.router.navigate(['/creator/catalog']);
    }
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { ErrorContainerComponent } from '../../../../shared/error-container/error-container.component';
import { PublicListService } from '../../../../core/services/public-list.service';
import { ContentSelectorComponent, SuggestedContent } from '../../../../shared/content-selector/content-selector.component';
import { handleListSubmit } from '../../../../shared/utils/list-init.util';
import { checkAuthenticationOrRedirect, executeObservableOperation, navigateWithUnsavedCheck } from '../../../../core/utils/observable.helpers';

export interface PrivateListForm {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-create-private-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    TextAreaFieldComponent,
    ErrorContainerComponent,
    ContentSelectorComponent
  ],
  templateUrl: './create-private-list.component.html',
  styleUrls: ['./create-private-list.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn]
})
export class CreatePrivateListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly formBaseService = inject(FormBaseService);
  private readonly publicListService = inject(PublicListService);
  
  listForm!: FormGroup;
  formId: string = 'create-private-list';
  currentFormState: any = {};
  addedContent: SuggestedContent[] = [];
  selectedContentType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  isPrivateMode = true;

  ngOnInit(): void {
    if (!checkAuthenticationOrRedirect(this.router)) return;

    this.formBaseService.createFormState(this.formId, {});
    this.formBaseService.getFormState(this.formId)?.subscribe(state => {
      this.currentFormState = state;
    });

    this.listForm = this.formBaseService.createFormGroup<PrivateListForm>({
      nombre: '',
      descripcion: ''
    });
  }

  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
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

    if (!request) return;

    executeObservableOperation(
      this.publicListService.createPrivateList(request),
      {
        formId: this.formId,
        formService: this.formBaseService,
        successRoute: '/my-lists',
        router: this.router,
        defaultErrorMessage: 'Error al crear la lista privada. Inténtalo de nuevo.'
      }
    );
  }

  goBack(): void {
    navigateWithUnsavedCheck(
      this.listForm.dirty || this.addedContent.length > 0,
      {
        targetRoute: '/my-lists',
        router: this.router
      }
    );
  }
}

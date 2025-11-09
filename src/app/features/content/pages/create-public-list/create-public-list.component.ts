// Updated CreatePublicListComponent.ts
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

export interface PublicListForm {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-create-public-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    TextAreaFieldComponent,
    ErrorContainerComponent,
    ContentSelectorComponent
  ],
  templateUrl: './create-public-list.component.html',
  styleUrls: ['./create-public-list.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn]
})
export class CreatePublicListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly formBaseService = inject(FormBaseService);
  private readonly publicListService = inject(PublicListService);
  listForm!: FormGroup;
  formId: string = 'create-public-list';
  currentFormState: any = {};
  addedContent: SuggestedContent[] = [];
  selectedContentType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  isVisible: boolean = true;
  ngOnInit(): void {
    if (!checkAuthenticationOrRedirect(this.router)) return;

    this.formBaseService.createFormState(this.formId, {});
    this.formBaseService.getFormState(this.formId)?.subscribe(state => {
      this.currentFormState = state;
    });
    this.listForm = this.formBaseService.createFormGroup<PublicListForm>({
      nombre: '',
      descripcion: ''
    });
  }

  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
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

    if (!request) return;

    executeObservableOperation(
      this.publicListService.createPublicList(request),
      {
        formId: this.formId,
        formService: this.formBaseService,
        successRoute: '/content-creator',
        router: this.router,
        defaultErrorMessage: 'Error al crear la lista. Inténtalo de nuevo.'
      }
    );
  }

  goBack(): void {
    navigateWithUnsavedCheck(
      this.listForm.dirty || this.addedContent.length > 0,
      {
        targetRoute: '/content-creator',
        router: this.router
      }
    );
  }
}

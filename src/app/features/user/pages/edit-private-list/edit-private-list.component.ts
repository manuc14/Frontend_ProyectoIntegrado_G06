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
import { ApiService } from '../../../../core/services/api.service';
import { handleListSubmit } from '../../../../shared/utils/list-init.util';
import { checkAuthenticationOrRedirect, executeObservableOperation, navigateWithUnsavedCheck } from '../../../../core/utils/observable.helpers';

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
  private readonly apiService = inject(ApiService);
  
  listForm!: FormGroup;
  formId: string = 'edit-private-list';
  currentFormState: any = {};
  addedContent: SuggestedContent[] = [];
  selectedContentType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  isPrivateMode = true;
  listId: string = '';
  initialList?: ListaPublicaResponse;
  preselectedIds: string[] = [];
  preselectedContent: SuggestedContent[] = [];

  ngOnInit(): void {
    if (!checkAuthenticationOrRedirect(this.router)) return;

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
        this.preselectedContent = lista.items.map(item => this.mapContenidoToSuggestedContent(item));
      },
      error: () => {
        this.formBaseService.updateFormState(this.formId, {
          error: 'Error al cargar la lista'
        });
      }
    });
  }

  private mapContenidoToSuggestedContent(contenido: any): SuggestedContent {
    const { _id, titulo, descripcion, ficheroUrl, miniaturaUrl, duracion, tipoArchivo, creador } = contenido;
    const channel = creador?.nombre || 'Desconocido';

    return {
      id: _id,
      thumbnail: miniaturaUrl || 'assets/default-thumbnail.png',
      title: titulo,
      channel,
      duration: this.formatDuration(duracion),
      added: true, // Los contenidos de la lista ya están seleccionados
      tipo: tipoArchivo,
      ficheroUrl,
      autorAlias: channel,
      descripcion
    };
  }

  private formatDuration(duracion: number): string {
    // Si duracion es menor a 60, asumir que son minutos
    // Si es mayor o igual a 60, asumir que son segundos
    let totalSeconds: number;
    if (duracion < 60) {
      // Tratar como minutos
      totalSeconds = duracion * 60;
    } else {
      // Tratar como segundos
      totalSeconds = duracion;
    }

    const minutos = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const segundos = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
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
      this.publicListService.updatePrivateList(this.listId, request),
      {
        formId: this.formId,
        formService: this.formBaseService,
        successRoute: '/my-lists',
        router: this.router,
        defaultErrorMessage: 'Error al actualizar la lista privada. Inténtalo de nuevo.'
      }
    );
  }

  goBack(): void {
    navigateWithUnsavedCheck(
      () => this.listForm.dirty || this.hasContentChanged(),
      {
        targetRoute: '/my-lists',
        router: this.router
      }
    );
  }

  private hasContentChanged(): boolean {
    if (!this.initialList) return false;
    const initialIds = this.initialList.items.map(i => i._id).sort((a, b) => a.localeCompare(b));
    const currentIds = this.addedContent.map(i => i.id).sort((a, b) => a.localeCompare(b));
    return JSON.stringify(initialIds) !== JSON.stringify(currentIds);
  }
}

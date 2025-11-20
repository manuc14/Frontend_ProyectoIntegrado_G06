import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminEntityService, BackendErrorResponse } from '../../core/services/admin-entity.service';
import { ApiService } from '../../core/services/api.service';
import { FormBaseService, FormState } from '../../core/services/form-base.service';
import { fadeIn } from '../../core/animations/animations';
import { ModalHeaderComponent } from '../modal-header/modal-header.component';
import { ErrorContainerComponent } from '../error-container/error-container.component';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { TextAreaFieldComponent } from '../textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { ToggleBlockButtonComponent } from '../toggle-block-button/toggle-block-button.component';
import { FormActionsComponent } from '../form-actions/form-actions.component';
import { FormDateComponent } from '../form-components/form-date/form-date.component';
import { FormInputComponent } from '../form-components/form-input/form-input.component';
import { EntityType, EntityData } from './entity-types';
import { ENTITY_CONFIGS } from './entity-configs';

@Component({
  selector: 'app-admin-entity-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalHeaderComponent,
    ErrorContainerComponent,
    AvatarSelectorComponent,
    TextAreaFieldComponent,
    SelectFieldComponent,
    ToggleBlockButtonComponent,
    FormActionsComponent,
    FormDateComponent,
    FormInputComponent
  ],
  templateUrl: './admin-entity-edit-form.component.html',
  styleUrl: './admin-entity-edit-form.component.scss',
  animations: [fadeIn]
})
export class AdminEntityEditFormComponent implements OnInit, OnDestroy {
  @Input() entityType: EntityType = 'admin';
  @Input() entityId: string = '';
  @Input() titulo: string = 'Editar entidad';

  // Estado centralizado del formulario
  formState$!: BehaviorSubject<FormState<EntityData>>;
  form!: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adminEntityService: AdminEntityService,
    public api: ApiService,
    private formBaseService: FormBaseService
  ) {}

  /* Helpers para el template */
  getAvailableAvatars(state: FormState<EntityData> | null): string[] {
    return state?.imageState.images?.map(img => this.api.getFullResourceUrl(img)) || [];
  }

  getEntityField(state: FormState<EntityData> | null, field: string): any {
    return (state?.data as any)?.[field] || '';
  }

  ngOnInit(): void {
    // Verificar que haya token en sessionStorage
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }

    // Inicializar estado del formulario
    this.formState$ = this.formBaseService.createFormState<EntityData>(`edit-${this.entityType}`, {} as EntityData);

    // Crear formulario basado en el tipo de entidad
    this.createForm();
    this.initializeEntity();
  }

  ngOnDestroy(): void {
    // Limpiar estado del formulario
    this.formBaseService.destroyFormState(`edit-${this.entityType}`);
  }

  private createForm(): void {
    const config = ENTITY_CONFIGS[this.entityType];
    this.form = this.formBaseService.createFormGroup<EntityData>(config.formConfig, [], `edit-${this.entityType}`);
  }

  private initializeEntity(): void {
    if (!this.entityId) {
      this.entityId = this.route.snapshot.paramMap.get('id') ?? '';
      if (!this.entityId) {
        console.error('No se proporcionó ID de entidad');
        this.navigateBack();
        return;
      }
    }

    // Cargar imágenes primero y esperar a que se complete
    this.formBaseService.loadImages('avatar');

    // Suscribirse al estado de las imágenes para saber cuándo se han cargado
    const formState = this.formBaseService.getFormState(`edit-${this.entityType}`);
    if (formState) {
      const imageStateSubscription = formState.subscribe(state => {
        // Si las imágenes ya se cargaron (no está loading), cargar datos de entidad
        if (!state.imageState.loading) {
          imageStateSubscription.unsubscribe();
          this.loadEntityData();
        }
      });
    } else {
      // Si no hay estado, cargar datos directamente
      this.loadEntityData();
    }
  }

  private navigateBack() {
    const routes: Record<EntityType, string> = {
      admin: '/ad-admin',
      creator: '/ad-creators',
      user: '/ad-users'
    };
    this.router.navigate([routes[this.entityType]]).then(() => {
      window.location.reload();
    });
  }

  private loadEntity(listObservable: Observable<any[]>, errorMessage: string): void {
    listObservable.subscribe({
      next: (entities: any[]) => {
        const entity = entities.find(e => e.id === this.entityId);
        if (!entity) {
          this.formBaseService.updateFormState(`edit-${this.entityType}`, {
            error: errorMessage,
            isLoading: false
          });
          this.navigateBack();
          return;
        }

        const config = ENTITY_CONFIGS[this.entityType];
        const entityData = config.mapEntityToData(entity);

        this.form.patchValue(entityData);
        this.formBaseService.updateFormState(`edit-${this.entityType}`, {
          data: entityData,
          originalData: { ...entityData },
          isLoading: false
        });

        // Seleccionar avatar actual
        const avatarPath = entityData.foto ?? '';
        let fullAvatarUrl = avatarPath;
        if (avatarPath && !avatarPath.includes('/') && !avatarPath.includes('http')) {
          fullAvatarUrl = this.api.getFullResourceUrl(`/resources/avatars/${avatarPath}`);
        } else if (avatarPath && !avatarPath.includes('http')) {
          fullAvatarUrl = this.api.getFullResourceUrl(avatarPath);
        }
        this.formBaseService.selectImage(fullAvatarUrl, 'avatar');
      },
      error: (err: any) => {
        this.formBaseService.updateFormState(`edit-${this.entityType}`, {
          error: err?.message || 'Error loading entity',
          isLoading: false
        });
      }
    });
  }

  private loadEntityData(): void {
    this.formBaseService.updateFormState(`edit-${this.entityType}`, { isLoading: true });

    const config = ENTITY_CONFIGS[this.entityType];
    const errorMessage = `${this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)} no encontrado`;

    this.loadEntity(config.listMethod(this.adminEntityService), errorMessage);
  }

  onAvatarSelected(avatarUrl: string): void {
    this.formBaseService.selectImage(avatarUrl, 'avatar');
    const currentData = this.formState$.value?.data;
    if (currentData) {
      // Extraer el nombre del archivo para guardar en los datos
      currentData.foto = this.extractRelativePath(avatarUrl);
      this.formBaseService.updateFormState(`edit-${this.entityType}`, { data: currentData });
    }
  }

  private extractRelativePath(fullUrl: string): string {
    // Si la URL contiene '/resources/avatars/', extraer el nombre del archivo
    if (fullUrl.includes('/resources/avatars/')) {
      return fullUrl.split('/resources/avatars/')[1];
    }
    // Si es solo el nombre del archivo o para otros casos, extraer la última parte
    return fullUrl.includes('/') ? (fullUrl.split('/').pop() ?? '') : fullUrl;
  }

  saveChanges(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentState = this.formState$.value;
    if (!currentState) return;

    this.formBaseService.updateFormState(`edit-${this.entityType}`, { isSubmitting: true, error: null });

    const changes = this.prepareChanges(this.form.value, currentState.originalData, currentState.data.foto, currentState.data.activo);
    const config = ENTITY_CONFIGS[this.entityType];
    
    config.editMethod(this.adminEntityService)(this.entityId, changes).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (err: BackendErrorResponse) => this.handleSaveError(err)
    });
  }

  private handleSaveSuccess(): void {
    const currentState = this.formState$.value;
    if (currentState) {
      this.formBaseService.updateFormState(`edit-${this.entityType}`, {
        isSubmitting: false,
        data: { ...currentState.data },
        originalData: { ...currentState.data }
      });
    }
    this.navigateBack();
  }

  private handleSaveError(err: BackendErrorResponse): void {
    this.formBaseService.handleBackendError(`edit-${this.entityType}`, this.form, err);
    this.formBaseService.updateFormState(`edit-${this.entityType}`, { isSubmitting: false });
  }

  private prepareChanges(currentData: any, originalData: any, currentFoto?: string, currentActivo?: boolean): any {
    const config = ENTITY_CONFIGS[this.entityType];
    const nonEditableFields = ['correo', 'tipoContenido'];

    const changes: any = {};

    // Incluir campos obligatorios
    config.requiredFields.forEach(field => {
      changes[field] = currentData[field];
    });

    // Incluir activo del estado actual
    changes.activo = currentActivo ?? originalData.activo;

    // Agregar campos que han cambiado (excluyendo no editables y foto)
    Object.keys(currentData)
      .filter(key => !nonEditableFields.includes(key) && key !== 'foto' && currentData[key] !== originalData[key])
      .forEach(key => {
        changes[key] = currentData[key];
      });

    // Manejar foto
    changes.foto = this.formBaseService.extractImageFileName(currentFoto ?? originalData.foto);

    return changes;
  }

  cancel(): void {
    this.navigateBack();
  }

  hasChanges(): boolean {
    const state = this.formState$.value;
    return state ? this.formBaseService.hasChanges(state.data, state.originalData) : false;
  }

  toggleActive(): void {
    const currentState = this.formState$.value;
    if (currentState?.data) {
      const updatedData = { ...currentState.data, activo: !currentState.data.activo };
      this.formBaseService.updateFormState(`edit-${this.entityType}`, { data: updatedData });
    }
  }
}
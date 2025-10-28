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
import { InputFieldComponent } from '../input-field/input-field.component';
import { TextAreaFieldComponent } from '../textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { ToggleBlockButtonComponent } from '../toggle-block-button/toggle-block-button.component';
import { FormActionsComponent } from '../form-actions/form-actions.component';
import { FormDateComponent } from '../form-components/form-date/form-date.component';

export type EntityType = 'admin' | 'creator' | 'user';

interface BaseEntityData {
  nombre: string;
  apellidos: string;
  alias: string;
  foto?: string;
  activo: boolean;
}

interface AdminEntityData extends BaseEntityData {
  correo: string; // Solo para mostrar, no editable
  departamento: string;
}

interface CreatorEntityData extends BaseEntityData {
  correo: string; // Solo para mostrar, no editable
  descripcion: string;
  especialidad: string;
  tipoContenido: string; // Solo para mostrar, no editable
}

interface UserEntityData extends BaseEntityData {
  correo: string; // Solo para mostrar, no editable
  fechaNacimiento: string;
}

type EntityData = AdminEntityData | CreatorEntityData | UserEntityData;

@Component({
  selector: 'app-admin-entity-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalHeaderComponent,
    ErrorContainerComponent,
    AvatarSelectorComponent,
    InputFieldComponent,
    TextAreaFieldComponent,
    SelectFieldComponent,
    ToggleBlockButtonComponent,
    FormActionsComponent,
    FormDateComponent
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
  private currentState: FormState<EntityData> | null = null;
  form!: FormGroup;

  // Propiedades calculadas para compatibilidad con template
  get selectedAvatar(): string {
    const state = this.getCurrentState();
    return state?.imageState.selectedImageUrl || '';
  }

  get availableAvatars(): string[] {
    const state = this.getCurrentState();
    const images = state?.imageState.images || [];
    // Convertir rutas relativas a URLs completas
    return images.map(image => this.api.getFullAvatarUrl(image));
  }

  get isLoadingAvatars(): boolean {
    const state = this.getCurrentState();
    return state?.imageState.loading || false;
  }

  get avatarLoadError(): boolean {
    const state = this.getCurrentState();
    return state?.imageState.error || false;
  }

  get isSaving(): boolean {
    const state = this.getCurrentState();
    return state?.isSubmitting || false;
  }

  get isLoading(): boolean {
    const state = this.getCurrentState();
    return state?.isLoading || false;
  }

  get currentEntityData(): EntityData | null {
    return this.getCurrentState()?.data || null;
  }

  get error(): string | null {
    const state = this.getCurrentState();
    return state?.error ?? null;
  }

  get isActivo(): boolean {
    const data = this.currentEntityData;
    return (data as any)?.activo || false;
  }

  get entityCorreo(): string {
    const data = this.currentEntityData;
    return (data as any)?.correo || '';
  }

  get creatorTipoContenido(): string {
    const data = this.currentEntityData;
    return (data as any)?.tipoContenido || '';
  }

  // Opciones específicas
  departamentos = [
    'Operaciones','Seguridad','Marketing','Soporte','Recursos Humanos','Finanzas','Desarrollo','Legal'
  ];

  especialidades = [
    'Música','Educación','Tecnología','Cocina','Deportes','Arte','Ciencia','Viajes'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adminEntityService: AdminEntityService,
    private api: ApiService,
    private formBaseService: FormBaseService
  ) {}

  private getCurrentState(): FormState<EntityData> | null {
    return this.currentState;
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
    this.formState$.subscribe(state => this.currentState = state);

    // Crear formulario basado en el tipo de entidad
    this.createForm();
    this.initializeEntity();
  }

  ngOnDestroy(): void {
    // Limpiar estado del formulario
    this.formBaseService.destroyFormState(`edit-${this.entityType}`);
  }

  private createForm(): void {
    const formConfig: Record<string, any> = {};

    // Campos comunes
    formConfig['nombre'] = '';
    formConfig['apellidos'] = '';

    // Campos específicos por tipo
    switch (this.entityType) {
      case 'admin':
        formConfig['departamento'] = 'Operaciones';
        break;
      case 'creator':
        formConfig['alias'] = '';
        formConfig['descripcion'] = '';
        formConfig['especialidad'] = 'Música';
        formConfig['correo'] = ''; // Solo para mostrar, no editable
        formConfig['tipoContenido'] = 'VIDEO'; // Solo para mostrar, no editable
        break;
      case 'user':
        formConfig['fechaNacimiento'] = '';
        break;
    }

    this.form = this.formBaseService.createFormGroup<EntityData>(formConfig, []);
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
    this.router.navigate([routes[this.entityType]]);
  }

  private mapEntityToData(entity: any, type: EntityType): EntityData {
    const base = {
      nombre: entity.nombre ?? '',
      apellidos: entity.apellidos ?? '',
      alias: entity.alias ?? '',
      correo: entity.correo ?? '',
      foto: entity.foto ?? '',
      activo: entity.activo ?? true
    };

    switch (type) {
      case 'admin':
        return { ...base, departamento: entity.departamento ?? 'Operaciones' } as AdminEntityData;
      case 'creator':
        return {
          ...base,
          descripcion: entity.descripcion ?? '',
          especialidad: entity.especialidad ?? 'Música',
          tipoContenido: entity.tipoContenido ?? 'VIDEO'
        } as CreatorEntityData;
      case 'user':
        return { ...base, fechaNacimiento: entity.fechaNacimiento ?? '' } as UserEntityData;
      default:
        throw new Error(`Tipo de entidad desconocido: ${type}`);
    }
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

        const entityData = this.mapEntityToData(entity, this.entityType);

        this.form.patchValue(entityData);
        this.formBaseService.updateFormState(`edit-${this.entityType}`, {
          data: entityData,
          originalData: { ...entityData },
          isLoading: false
        });

        // Seleccionar avatar actual
        this.formBaseService.selectImage(entityData.foto ?? '', 'avatar');
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

    const listMethods: Record<EntityType, () => Observable<any[]>> = {
      admin: () => this.adminEntityService.listarAdministradores(),
      creator: () => this.adminEntityService.listarCreadores(),
      user: () => this.adminEntityService.listarUsuarios()
    };

    const errorMessages: Record<EntityType, string> = {
      admin: 'Administrador no encontrado',
      creator: 'Creador no encontrado',
      user: 'Usuario no encontrado'
    };

    this.loadEntity(listMethods[this.entityType](), errorMessages[this.entityType]);
  }

  onAvatarSelected(avatarUrl: string): void {
    // Extraer la ruta relativa de la URL completa
    const relativePath = this.extractRelativePath(avatarUrl);
    this.formBaseService.selectImage(relativePath, 'avatar');
    const currentData = this.getCurrentState()?.data;
    if (currentData) {
      currentData.foto = relativePath;
      this.formBaseService.updateFormState(`edit-${this.entityType}`, { data: currentData });
    }
  }

  private extractRelativePath(fullUrl: string): string {
    // Si la URL contiene '/resources/avatars/', extraer el nombre del archivo
    if (fullUrl.includes('/resources/avatars/')) {
      return fullUrl.split('/resources/avatars/')[1];
    }
    // Si es solo el nombre del archivo, devolverlo tal cual
    if (!fullUrl.includes('/')) {
      return fullUrl;
    }
    // Para otros casos, extraer la última parte
    return fullUrl.split('/').pop() ?? '';
  }

  saveChanges(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentState = this.getCurrentState();
    if (!currentState) return;

    this.formBaseService.updateFormState(`edit-${this.entityType}`, { isSubmitting: true, error: null });

    const formValue = this.form.value;
    const changes = this.prepareChanges(formValue, currentState.originalData, currentState.data.foto);

    const editMethods: Record<EntityType, (id: string, changes: any) => Observable<any>> = {
      admin: (id, ch) => this.adminEntityService.editarAdministrador(id, ch),
      creator: (id, ch) => this.adminEntityService.editarCreador(id, ch),
      user: (id, ch) => this.adminEntityService.editarUsuario(id, ch)
    };

    editMethods[this.entityType](this.entityId, changes).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (err: BackendErrorResponse) => this.handleSaveError(err)
    });
  }

  private handleSaveSuccess(): void {
    const currentState = this.getCurrentState();
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

  private prepareChanges(currentData: any, originalData: any, currentFoto?: string): any {
    const requiredFields: Record<EntityType, string[]> = {
      admin: ['nombre', 'apellidos', 'departamento'],
      creator: ['nombre', 'apellidos', 'descripcion', 'especialidad', 'alias'],
      user: ['nombre', 'apellidos', 'fechaNacimiento']
    };

    const nonEditableFields = ['correo', 'tipoContenido'];

    const changes: any = {};

    // Incluir campos obligatorios
    requiredFields[this.entityType].forEach(field => {
      changes[field] = currentData[field];
    });

    // Incluir activo del original
    changes.activo = originalData.activo;

    // Agregar campos que han cambiado (excluyendo no editables y foto)
    Object.keys(currentData)
      .filter(key => !nonEditableFields.includes(key) && key !== 'foto' && currentData[key] !== originalData[key])
      .forEach(key => {
        changes[key] = currentData[key];
      });

    // Manejar foto
    changes.foto = originalData.foto;
    if (currentFoto && currentFoto !== originalData.foto) {
      changes.foto = this.formBaseService.extractImageFileName(currentFoto);
    }

    return changes;
  }

  cancel(): void {
    this.navigateBack();
  }

  hasChanges(): boolean {
    const state = this.getCurrentState();
    return state ? this.formBaseService.hasChanges(state.data, state.originalData) : false;
  }

  toggleActive(): void {
    const currentState = this.getCurrentState();
    if (currentState?.data) {
      const updatedData = { ...currentState.data, activo: !currentState.data.activo };
      this.formBaseService.updateFormState(`edit-${this.entityType}`, { data: updatedData });
    }
  }
}
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AdminEntityService, BackendErrorResponse, AdminEV, UserEV, CreatorEC } from '../../core/services/admin-entity.service';
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
import { DateFieldComponent } from '../date-field/date-field.component';
import { BaseEditService } from '../base-edit/base-edit.service';

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
    DateFieldComponent
  ],
  templateUrl: './admin-entity-edit-form.component.html',
  styleUrl: './admin-entity-edit-form.component.scss',
  animations: [fadeIn]
})
export class AdminEntityEditFormComponent implements OnInit, OnDestroy {
  @Input() entityType: EntityType = 'admin';
  @Input() entityId: string = '';

  // Estado centralizado del formulario
  formState$!: BehaviorSubject<FormState<EntityData>>;
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
    return state?.error || null;
  }

  get isActivo(): boolean {
    const data = this.currentEntityData;
    return (data as any)?.activo || false;
  }

  get adminCorreo(): string {
    const data = this.currentEntityData;
    return (data as any)?.correo || '';
  }

  get creatorCorreo(): string {
    const data = this.currentEntityData;
    return (data as any)?.correo || '';
  }

  get creatorTipoContenido(): string {
    const data = this.currentEntityData;
    return (data as any)?.tipoContenido || '';
  }

  get entityCorreo(): string {
    const data = this.currentEntityData;
    return (data as any)?.correo || '';
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
    private baseEditService: BaseEditService,
    private api: ApiService,
    private formBaseService: FormBaseService
  ) {}

  private getCurrentState(): FormState<EntityData> | null {
    let currentState: FormState<EntityData> | null = null;
    this.formState$.subscribe(state => currentState = state).unsubscribe();
    return currentState;
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

  private initializeFormState(): void {
    this.formState$ = this.formBaseService.createFormState<EntityData>(`edit-${this.entityType}`, {} as EntityData);
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

    // Crear estado inicial del formulario
    this.initializeFormState();

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
    switch (this.entityType) {
      case 'admin':
        this.router.navigate(['/ad-admin']);
        break;
      case 'creator':
        this.router.navigate(['/ad-creators']);
        break;
      case 'user':
        this.router.navigate(['/ad-users']);
        break;
    }
  }

  private loadEntityData(): void {
    this.formBaseService.updateFormState(`edit-${this.entityType}`, { isLoading: true });

    switch (this.entityType) {
      case 'admin':
        this.adminEntityService.listarAdministradores().subscribe({
          next: (admins: AdminEV[]) => {
            const admin = admins.find(a => a.id === this.entityId);
            if (!admin) {
              this.formBaseService.updateFormState(`edit-${this.entityType}`, {
                error: 'Administrador no encontrado',
                isLoading: false
              });
              this.navigateBack();
              return;
            }

            const entityData: AdminEntityData = {
              nombre: admin.nombre ?? '',
              apellidos: admin.apellidos ?? '',
              alias: admin.alias ?? '',
              correo: admin.correo ?? '', // Solo para mostrar
              departamento: admin.departamento ?? 'Operaciones',
              foto: admin.foto ?? '',
              activo: admin.activo ?? true
            };

            this.form.patchValue(entityData);
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              data: entityData,
              originalData: { ...entityData },
              isLoading: false
            });

            // Seleccionar avatar actual
            this.formBaseService.selectImage(entityData.foto || '', 'avatar');
          },
          error: (err: any) => {
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              error: this.baseEditService.handleError(err),
              isLoading: false
            });
          }
        });
        break;

      case 'creator':
        this.adminEntityService.listarCreadores().subscribe({
          next: (creators: CreatorEC[]) => {
            const creator = creators.find(c => c.id === this.entityId);
            if (!creator) {
              this.formBaseService.updateFormState(`edit-${this.entityType}`, {
                error: 'Creador no encontrado',
                isLoading: false
              });
              this.navigateBack();
              return;
            }

            const entityData: CreatorEntityData = {
              nombre: creator.nombre ?? '',
              apellidos: creator.apellidos ?? '',
              correo: creator.correo ?? '', // Solo para mostrar
              alias: creator.alias ?? '',
              descripcion: creator.descripcion ?? '',
              especialidad: creator.especialidad ?? 'Música',
              foto: creator.foto ?? '',
              activo: creator.activo ?? true,
              tipoContenido: creator.tipoContenido ?? 'VIDEO' // Solo para mostrar
            };

            this.form.patchValue(entityData);
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              data: entityData,
              originalData: { ...entityData },
              isLoading: false
            });

            // Seleccionar avatar actual
            this.formBaseService.selectImage(entityData.foto || '', 'avatar');
          },
          error: (err: any) => {
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              error: this.baseEditService.handleError(err),
              isLoading: false
            });
          }
        });
        break;

      case 'user':
        this.adminEntityService.listarUsuarios().subscribe({
          next: (users: UserEV[]) => {
            const user = users.find(u => u.id === this.entityId);
            if (!user) {
              this.formBaseService.updateFormState(`edit-${this.entityType}`, {
                error: 'Usuario no encontrado',
                isLoading: false
              });
              this.navigateBack();
              return;
            }

            const entityData: UserEntityData = {
              nombre: user.nombre ?? '',
              apellidos: user.apellidos ?? '',
              alias: user.alias ?? '',
              correo: user.correo ?? '',
              fechaNacimiento: user.fechaNacimiento ?? '',
              foto: user.foto ?? '',
              activo: user.activo ?? true
            };

            this.form.patchValue(entityData);
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              data: entityData,
              originalData: { ...entityData },
              isLoading: false
            });

            // Seleccionar avatar actual
            this.formBaseService.selectImage(entityData.foto || '', 'avatar');
          },
          error: (err: any) => {
            this.formBaseService.updateFormState(`edit-${this.entityType}`, {
              error: this.baseEditService.handleError(err),
              isLoading: false
            });
          }
        });
        break;
    }
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
    return fullUrl.split('/').pop() || '';
  }

  private getSaveMethod(): string {
    switch (this.entityType) {
      case 'admin': return 'editarAdministrador';
      case 'creator': return 'editarCreador';
      case 'user': return 'editarUsuario';
      default: return 'editarUsuario';
    }
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
    const changes = this.prepareChanges(formValue, currentState.originalData);

    switch (this.entityType) {
      case 'admin':
        this.adminEntityService.editarAdministrador(this.entityId, changes).subscribe({
          next: () => this.handleSaveSuccess(),
          error: (err: BackendErrorResponse) => this.handleSaveError(err)
        });
        break;
      case 'creator':
        this.adminEntityService.editarCreador(this.entityId, changes).subscribe({
          next: () => this.handleSaveSuccess(),
          error: (err: BackendErrorResponse) => this.handleSaveError(err)
        });
        break;
      case 'user':
        this.adminEntityService.editarUsuario(this.entityId, changes).subscribe({
          next: () => this.handleSaveSuccess(),
          error: (err: BackendErrorResponse) => this.handleSaveError(err)
        });
        break;
    }
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

  private prepareChanges(currentData: any, originalData: any): any {
    const changes: any = {};

    // Incluir campos obligatorios según el tipo
    switch (this.entityType) {
      case 'admin':
        changes.nombre = currentData.nombre;
        changes.apellidos = currentData.apellidos;
        changes.departamento = currentData.departamento;
        changes.activo = originalData.activo;
        // No incluir correo ya que no es editable
        break;
      case 'creator':
        changes.nombre = currentData.nombre;
        changes.apellidos = currentData.apellidos;
        changes.descripcion = currentData.descripcion;
        changes.especialidad = currentData.especialidad;
        changes.alias = currentData.alias;
        changes.activo = originalData.activo;
        // No incluir correo ni tipoContenido ya que no son editables
        break;
      case 'user':
        changes.nombre = currentData.nombre;
        changes.apellidos = currentData.apellidos;
        changes.fechaNacimiento = currentData.fechaNacimiento;
        changes.activo = originalData.activo;
        break;
    }

    // Agregar campos que han cambiado (excluyendo campos no editables)
    for (const key in currentData) {
      if (key !== 'foto' && key !== 'correo' && key !== 'tipoContenido' && currentData[key] !== originalData[key]) {
        changes[key] = currentData[key];
      }
    }

    // Siempre incluir foto: si cambió, el nuevo valor; si no, el original para no modificar
    changes.foto = originalData.foto;
    if (currentData.foto !== originalData.foto) {
      changes.foto = this.formBaseService.extractImageFileName(currentData.foto);
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

  getTitle(): string {
    if (this.entityType == 'creator') {
      return 'Editar creador de contenido';
    } else if (this.entityType == 'admin') {
      return 'Editar administrador';
    } else {
      return 'Editar entidad';
    }
  }

  onCerrar(): void {
    this.cancel();
  }
}
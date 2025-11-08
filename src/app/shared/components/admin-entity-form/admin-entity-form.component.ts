import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn } from '../../../core/animations/animations';
import { FormBaseService } from '../../../core/services/form-base.service';
import { FormInputComponent } from '../../form-components/form-input/form-input.component';
import { FormPasswordComponent } from '../../form-components/form-password/form-password.component';
import { TextAreaFieldComponent } from '../../textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../select-field/select-field.component';
import { AvatarSelectorComponent } from '../../avatar-selector/avatar-selector.component';
import { ErrorContainerComponent } from '../../error-container/error-container.component';
import { FormActionsComponent } from '../../form-actions/form-actions.component';

export type EntityType = 'admin' | 'creator';

// Configuración por tipo de entidad
const ENTITY_CONFIGS = {
  admin: {
    submitButtonText: (isSubmitting: boolean) => isSubmitting ? 'Creando...' : 'Crear administrador',
    emailPlaceholder: 'email@empresa.com',
    selectOptions: ['Operaciones', 'Marketing', 'Finanzas', 'Recursos Humanos', 'Soporte'],
    selectFieldName: 'departamento',
    selectLabel: 'Departamento *',
    defaultSelectValue: 'Operaciones',
    sendFoto: false
  },
  creator: {
    submitButtonText: (isSubmitting: boolean) => isSubmitting ? 'Creando...' : 'Crear creador',
    emailPlaceholder: 'email@plataforma.com',
    selectOptions: ['Música', 'Educación', 'Tecnología', 'Cocina', 'Deportes', 'Arte', 'Ciencia', 'Viajes'],
    selectFieldName: 'especialidad',
    selectLabel: 'Especialidad *',
    defaultSelectValue: 'Música',
    sendFoto: true
  }
};

// Interfaces tipadas para formularios
export interface AdminForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  repetirPassword: string;
  departamento: string;
}

export interface CreatorForm {
  nombre: string;
  apellidos: string;
  email: string;
  alias: string;
  password: string;
  repetirPassword: string;
  especialidad: string;
  tipoContenido: string;
  descripcion: string;
}

@Component({
  selector: 'app-admin-entity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    FormPasswordComponent,
    TextAreaFieldComponent,
    SelectFieldComponent,
    AvatarSelectorComponent,
    ErrorContainerComponent,
    FormActionsComponent
  ],
  templateUrl: './admin-entity-form.component.html',
  styleUrl: './admin-entity-form.component.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class AdminEntityFormComponent implements OnInit, OnDestroy {
  @Input() entityType: EntityType = 'admin';
  @Input() service: any; // AdminService or CreatorService
  @Input() title: string = '';
  @Input() backRoute: string = '';
  @Input() successRoute: string = '';

  entityForm!: FormGroup;
  formId: string = '';

  // Estado centralizado gestionado por FormBaseService
  currentFormState: any = {};

  showTooltipPassword = false;
  showAvatarModal = false;

  get config() {
    return ENTITY_CONFIGS[this.entityType];
  }

  constructor(
    private router: Router,
    private formBaseService: FormBaseService
  ) {
    // Form will be created in ngOnInit after inputs are set
  }

  private createForm(): void {
    if (this.entityType === 'admin') {
      this.entityForm = this.formBaseService.createFormGroup<AdminForm>({
        nombre: '',
        apellidos: '',
        email: '',
        password: '',
        repetirPassword: '',
        departamento: this.config.defaultSelectValue
      }, [FormBaseService.passwordMatchValidator('password', 'repetirPassword')], 'admin');
    } else {
      this.entityForm = this.formBaseService.createFormGroup<CreatorForm>({
        nombre: '',
        apellidos: '',
        email: '',
        alias: '',
        password: '',
        repetirPassword: '',
        especialidad: this.config.defaultSelectValue,
        tipoContenido: '',
        descripcion: ''
      }, [FormBaseService.passwordMatchValidator('password', 'repetirPassword')], 'creator');
    }
  }

  ngOnInit(): void {
    // Verificar que haya token en sessionStorage
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }

    // Crear ID único para el formulario
    this.formId = `create-${this.entityType}`;

    // Crear estado del formulario
    this.formBaseService.createFormState(this.formId, {});

    // Suscribirse al estado del formulario
    this.formBaseService.getFormState(this.formId)?.subscribe(state => {
      this.currentFormState = state;
    });

    // Crear form con campos comunes
    this.createForm();
    // Cargar avatares
    this.formBaseService.loadImages('avatar');
  }

  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
  }

  onAvatarSelected(avatar: string): void {
    this.formBaseService.selectImage(avatar, 'avatar');
    this.closeAvatarModal();
  }

  onToggleTooltipPassword(): void {
    this.showTooltipPassword = !this.showTooltipPassword;
  }

  openAvatarModal(): void {
    this.showAvatarModal = true;
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
  }

  onModalKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAvatarModal();
    }
  }

  onSubmit(): void {
    this.formBaseService.updateFormState(this.formId, { error: null });

    if (this.entityForm.invalid) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'Por favor revisa los campos que son obligatorios.'
      });
      return;
    }

    this.formBaseService.updateFormState(this.formId, { isSubmitting: true });
    const entityData = this.prepareEntityData();

    this.service.crearEntidad(this.entityType, entityData).subscribe({
      next: (response: any) => this.handleSuccess(response),
      error: (error: any) => this.handleError(error)
    });
  }

  private prepareEntityData(): any {
    const getValue = (field: string, trim: boolean = false): string => {
      const value = this.entityForm.get(field)?.value || '';
      return trim ? value.trim() : value;
    };

    const data: any = {
      nombre: getValue('nombre', true),
      apellidos: getValue('apellidos', true),
      correo: getValue('email', true),
      contrasena: getValue('password'),
      confirmarContrasena: getValue('repetirPassword')
    };

    if (this.entityType === 'admin') {
      data.departamento = getValue('departamento');
    } else {
      data.alias = getValue('alias', true);
      data.especialidad = getValue('especialidad');
      data.tipoContenido = getValue('tipoContenido');
      data.descripcion = getValue('descripcion', true);
    }

    const fotoNombre = this.formBaseService.extractImageFileName(this.currentFormState?.imageState?.selectedImage);
    if (this.config.sendFoto && fotoNombre) {
      data.foto = fotoNombre;
    }

    return data;
  }

  private handleSuccess(response: any): void {
    console.log(`${this.entityType} creado exitosamente:`, response);
    
    const getValue = (field: string, trim: boolean = true): string => {
      const value = this.entityForm.get(field)?.value;
      return trim ? (value?.trim() || '') : (value || '');
    };

    const foto = response.foto || this.getAvatarPath() || 
      (this.entityType === 'admin' ? 'assets/admin/default.png' : 'assets/admin/admin_default.png');

    const commonData = {
      nombre: getValue('nombre'),
      apellidos: getValue('apellidos'),
      correo: getValue('email'),
      foto
    };

    const stateData = this.entityType === 'admin' ? {
      adminData: {
        ...commonData,
        departamento: getValue('departamento', false)
      }
    } : {
      creatorData: {
        ...commonData,
        alias: getValue('alias'),
        especialidad: getValue('especialidad', false),
        tipoContenido: getValue('tipoContenido', false),
        descripcion: getValue('descripcion')
      }
    };

    this.router.navigate([this.successRoute], { state: stateData });
  }

  private handleError(error: any): void {
    console.error(`Error al crear ${this.entityType}:`, error);
    
    // Si es un error de autenticación (401), el interceptor ya redirigió
    if (error.status === 401) return;
    
    // Para otros errores, delegar al FormBaseService
    this.formBaseService.handleBackendError(this.formId, this.entityForm, error);
    this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
  }

  private getAvatarPath(): string | null {
    const selectedAvatar = this.currentFormState?.imageState?.selectedImage;
    if (!selectedAvatar) return null;

    return selectedAvatar.startsWith('avatars/')
      ? selectedAvatar
      : 'avatars/' + selectedAvatar.split('/').pop();
  }

  goBack(): void {
    if (this.entityForm.dirty) {
      const confirmLeave = confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.');
      if (confirmLeave) {
        this.router.navigate([this.backRoute]);
      }
    } else {
      this.router.navigate([this.backRoute]);
    }
  }
}
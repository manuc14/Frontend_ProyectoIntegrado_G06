import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { CreatorProfileResponse, UpdateCreatorProfileRequest } from '../../../../core/services/api.service';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { BaseProfileComponent } from '../../../../shared/base-profile/base-profile.component';
import { FormState } from '../../../../core/services/form-base.service';
import { Observable, map } from 'rxjs';

// Especialidades disponibles para creadores (reutilizando de admin-config)
const CREATOR_SPECIALTIES = ['Música', 'Educación', 'Tecnología', 'Cocina', 'Deportes', 'Arte', 'Ciencia', 'Viajes'];

// Tipos de contenido disponibles
const CONTENT_TYPES = ['VIDEO', 'AUDIO'];

@Component({
  selector: 'app-content-creator-consultprofile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderComponent,
    SelectFieldComponent,
    AvatarSelectorComponent,
    FormInputComponent,
    TextAreaFieldComponent
  ],
  templateUrl: './content-creator-consultprofile.component.html',
  styleUrls: ['./content-creator-consultprofile.component.scss']
})
export class ContentCreatorConsultprofileComponent extends BaseProfileComponent implements OnDestroy {

  // ========= ESTADO DEL FORMULARIO GESTIONADO POR FORM-BASE =========
  private readonly FORM_ID = 'creator-profile';
  formState$: Observable<FormState> | null = null;

  // ========= PROPIEDADES ESPECÍFICAS DEL CREADOR =========
  specialtyOptions: { value: string; label: string }[] = CREATOR_SPECIALTIES.map(specialty => ({ 
    value: specialty, 
    label: specialty 
  }));

  contentTypeOptions: { value: string; label: string }[] = CONTENT_TYPES.map(type => ({ 
    value: type, 
    label: type 
  }));

  // Constantes de límites para usar en el template
  readonly maxNombre = 20;
  readonly maxApellidos = 20;
  readonly maxAlias = 20;
  readonly maxEmail = FORM_LIMITS.emailMax;
  readonly maxDescripcion = 500;

  // Control de errores específicos
  aliasErrorMessage: string = '';

  // Getter específico para el alias
  get aliasControl() { return this.profileForm.get('alias'); }

  // ========= IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS =========

  protected override initializeObservables(): void {
    // Configurar Observable para el estado de submitting usando FormBaseService
    this.isSubmitting$ = this.formState$?.pipe(
      map(state => state?.isSubmitting || false)
    ) || new Observable<boolean>(observer => observer.next(false));
  }

  protected override initializeForms(): void {
    // Inicializar estado del formulario con FormBaseService
    const initialData = {
      firstName: '',
      lastName: '',
      alias: '',
      email: '',
      description: '',
      specialty: '',
      contentType: ''
    };

    // Crear estado del formulario y suscribirse
    this.formState$ = this.formBaseService.getFormState(this.FORM_ID);
    if (!this.formState$) {
      this.formBaseService.createFormState(this.FORM_ID, initialData);
      this.formState$ = this.formBaseService.getFormState(this.FORM_ID);
    }

    // Crear formulario con validadores automáticos basados en nombres de campos
    this.profileForm = this.formBaseService.createFormGroup<typeof initialData>({
      firstName: '', // FormBaseService aplicará automáticamente nombre + required + maxLength
      lastName: '',  // FormBaseService aplicará automáticamente apellidos + required + maxLength
      alias: '',     // FormBaseService aplicará automáticamente alias + maxLength
      email: '',     // FormBaseService aplicará automáticamente email + required + email validation
      description: '', // FormBaseService aplicará automáticamente descripcion + maxLength
      specialty: '', // Sin validadores automáticos
      contentType: '' // Sin validadores automáticos
    });

    // Escuchar cambios en el formulario usando FormBaseService
    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChangesWithFormBase();
    });

    // Limpiar error de alias cuando cambie el valor usando FormBaseService
    this.profileForm.get('alias')?.valueChanges.subscribe(() => {
      this.formBaseService.updateFormState(this.FORM_ID, { 
        fieldErrors: { alias: '' } 
      });
      this.aliasErrorMessage = '';
    });
  }



  protected override loadUserData(): void {
    // Actualizar estado a "cargando" usando FormBaseService
    this.formBaseService.updateFormState(this.FORM_ID, { 
      isLoading: true, 
      error: null 
    });

    this.api.getCreatorProfile().subscribe({
      next: (profile: CreatorProfileResponse) => {
        this.populateFormWithProfile(profile);
        this.configureAvatar(profile);
        this.configureReadOnlyFields();
        this.finalizeFormSetup();
        
        // Actualizar estado a "cargado" con datos
        this.formBaseService.updateFormState(this.FORM_ID, { 
          isLoading: false,
          data: this.profileForm.getRawValue(),
          originalData: this.profileForm.getRawValue()
        });
      },
      error: (error) => {
        // Manejar error de carga con FormBaseService
        this.formBaseService.handleBackendError(this.FORM_ID, this.profileForm, error);
        this.formBaseService.updateFormState(this.FORM_ID, { isLoading: false });
        
        this.handleAuthError(error);
        this.loadFallbackData();
      }
    });
  }

  protected override getEditableFields(): string[] {
    return ['firstName', 'lastName', 'alias', 'description', 'specialty'];
  }

  private loadFallbackData(): void {
    this.profileForm.get('email')?.disable();
    this.profileForm.get('contentType')?.disable();
    this.applyEditMode();
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }



  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      // Actualizar estado a "enviando" usando FormBaseService
      this.formBaseService.updateFormState(this.FORM_ID, { 
        isSubmitting: true, 
        error: null, 
        fieldErrors: {} 
      });

      const formData = this.profileForm.getRawValue();
      const payload = this.buildUpdatePayload(formData);
      
      this.api.updateCreatorProfile(payload).subscribe({
        next: (response: any) => {
          console.log('✅ Perfil de creador actualizado exitosamente:', response);
          
          // Actualizar estado a "completado" con FormBaseService
          this.formBaseService.updateFormState(this.FORM_ID, { 
            isSubmitting: false,
            data: formData,
            originalData: formData // Actualizar también originalData
          });
          
          this.updateStateAfterSave(formData);
        },
        error: (error) => {
          console.error('❌ Error al actualizar perfil:', error);
          
          // Actualizar estado a "error" con FormBaseService
          this.formBaseService.updateFormState(this.FORM_ID, { 
            isSubmitting: false 
          });
          
          // Usar FormBaseService para manejar errores del backend
          this.formBaseService.handleBackendError(this.FORM_ID, this.profileForm, error);
          
          // Manejar errores específicos de alias que no maneja el FormBaseService
          this.handleSpecificAliasError(error);
        }
      });
    }
  }

  public override onCancelChanges(): void {
    console.log('🔄 Cancelando cambios...');
    
    // Resetear estado del FormBaseService
    this.formBaseService.updateFormState(this.FORM_ID, { 
      isSubmitting: false,
      error: null,
      fieldErrors: {}
    });
    
    // Resetear formulario a valores originales usando FormBaseService
    const stateSubscription = this.formBaseService.getFormState(this.FORM_ID)?.subscribe(state => {
      if (state?.originalData) {
        this.profileForm.patchValue(state.originalData);
        this.formBaseService.updateFormState(this.FORM_ID, { 
          data: state.originalData 
        });
      }
    });
    
    if (stateSubscription) {
      stateSubscription.unsubscribe();
    }
    
    // Llamar al método de la clase base
    super.onCancelChanges();
  }

  protected override updateStateAfterSave(formData: any): void {
    // Actualizar estado de edición
    this.hasUnsavedChanges = false;
    this.isEditMode = false;
    
    // Actualizar datos originales en FormBaseService
    this.formBaseService.updateFormState(this.FORM_ID, { 
      originalData: formData,
      data: formData
    });
    
    // Mostrar mensaje de éxito
    this.showSuccessNotification();
    
    console.log('✅ Estado actualizado después de guardar');
  }

  // ========= MÉTODOS ESPECÍFICOS DEL CREADOR =========

  private populateFormWithProfile(profile: CreatorProfileResponse): void {
    const formValues = {
      firstName: profile.nombre || '',
      lastName: profile.apellidos || '',
      alias: profile.alias || '',
      email: profile.email || '',
      description: profile.descripcion || '',
      specialty: this.getValidSpecialty(profile.especialidad),
      contentType: profile.contentType || ''
    };
    
    this.profileForm.patchValue(formValues);
  }

  private getValidSpecialty(specialty: string): string {
    if (!specialty) return '';
    
    const isValid = CREATOR_SPECIALTIES.includes(specialty);
    if (!isValid) {
      console.warn('Specialty inválida recibida del backend:', specialty);
      return CREATOR_SPECIALTIES[0];
    }
    
    return specialty;
  }

  private configureAvatar(profile: CreatorProfileResponse): void {
    // Usar FormBaseService para obtener URL completa de avatar
    const avatarPath = profile.avatar || 'assets/admin/admin_default.png';
    this.selectedAvatar = this.formBaseService.getFullImageUrl(avatarPath, 'avatar');
    this.initialAvatar = this.selectedAvatar;
    
    // Procesar avatares disponibles con URLs completas
    this.availableAvatars = (profile.availableAvatars || []).map(avatar => 
      this.formBaseService.getFullImageUrl(avatar, 'avatar')
    );
    
    // Cargar imágenes de avatar usando FormBaseService
    this.formBaseService.loadImages('avatar');
  }

  private configureReadOnlyFields(): void {
    this.profileForm.get('email')?.disable();
    this.profileForm.get('contentType')?.disable();
  }

  private finalizeFormSetup(): void {
    this.applyEditMode();
    this.initialFormValue = this.profileForm.getRawValue();
  }

  private buildUpdatePayload(formData: any): UpdateCreatorProfileRequest {
    return {
      nombre: formData.firstName || '',
      apellidos: formData.lastName || '',
      alias: formData.alias || '',
      descripcion: formData.description || '',
      especialidad: formData.specialty || '',
      avatar: this.formBaseService.extractImageFileName(this.selectedAvatar || '')
    };
  }

  private handleSpecificAliasError(error: any): void {
    // Manejar solo errores específicos que el FormBaseService no maneja automáticamente
    if (error.status === 409 && error.error?.message?.includes('alias')) {
      this.aliasErrorMessage = 'Ese alias ya existe';
    } else if (error.status === 401 || error.status === 403) {
      this.handleAuthError(error);
    } else {
      // Para otros errores relacionados con el alias
      this.aliasErrorMessage = 'Ese alias ya existe';
    }
    
    // Limpiar el error general del FormBaseService para que no se muestre
    this.formBaseService.updateFormState(this.FORM_ID, { 
      error: null 
    });
  }

  /**
   * Detecta cambios usando FormBaseService en lugar de la implementación manual
   */
  private checkForChangesWithFormBase(): void {
    const stateSubscription = this.formState$?.subscribe(state => {
      if (state) {
        const currentData = this.profileForm.getRawValue();
        const hasChanges = this.formBaseService.hasChanges(currentData, state.originalData);
        this.hasUnsavedChanges = hasChanges;
      }
    });
    
    if (stateSubscription) {
      stateSubscription.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    // Limpiar recursos del FormBaseService
    this.formBaseService.destroyFormState(this.FORM_ID);
  }

  protected override handleAuthError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      console.error('❌ [Profile] Error de autorización - cerrando sesión');
      this.authService.logout();
    }
  }
}
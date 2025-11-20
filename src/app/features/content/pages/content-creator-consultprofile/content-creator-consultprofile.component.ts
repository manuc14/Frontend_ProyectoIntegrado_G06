import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { CreatorProfileResponse, UpdateCreatorProfileRequest } from '../../../../core/services/api.service';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { BaseProfileComponent } from '../../../../shared/base-profile/base-profile.component';


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
export class ContentCreatorConsultprofileComponent extends BaseProfileComponent {

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

  protected override initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      alias: [''],
      email: [''],
      description: [''],
      specialty: [''],
      contentType: ['']
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });

    // Limpiar error de alias cuando cambie el valor
    this.profileForm.get('alias')?.valueChanges.subscribe(() => {
      this.aliasErrorMessage = '';
    });
  }



  protected override loadUserData(): void {
    this.api.getCreatorProfile().subscribe({
      next: (profile: CreatorProfileResponse) => {
        
        this.profileForm.patchValue({
          firstName: profile.nombre,
          lastName: profile.apellidos,
          alias: profile.alias,
          email: profile.email,
          description: profile.descripcion,
          specialty: profile.especialidad,
          contentType: profile.contentType
        });

        this.selectedAvatar = this.api.getFullResourceUrl(profile.avatar) || 'assets/admin/admin_default.png';
        this.initialAvatar = this.selectedAvatar;
        this.availableAvatars = profile.availableAvatars?.map(avatar => this.api.getFullResourceUrl(avatar)) || [];
        
        // Configurar campos de solo lectura
        this.profileForm.get('email')?.disable();
        this.profileForm.get('contentType')?.disable();
        
        this.applyEditMode();
        this.initialFormValue = this.profileForm.getRawValue();
      },
      error: (error: any) => {
        this.handleAuthError(error);
        this.loadFallbackData(['email', 'contentType']);
      }
    });
  }

  protected override getEditableFields(): string[] {
    return ['firstName', 'lastName', 'alias', 'description', 'specialty'];
  }



  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      const payload = this.buildUpdatePayload(formData);
      
      this.api.updateCreatorProfile(payload).subscribe({
        next: (response: any) => {
          // Update the current user in auth service with the new avatar filename
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            // Extract filename from the full URL for storage
            const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar || '');
            currentUser.foto = avatarFilename;
            currentUser.avatar = avatarFilename;
            this.authService.setCurrentUser(currentUser);
          }
          
          this.updateStateAfterSave(formData);
        },
        error: (error: any) => {
          this.handleSpecificAliasError(error);
        }
      });
    }
  }



  protected override updateStateAfterSave(formData: any): void {
    // Actualizar estado de edición
    this.hasUnsavedChanges = false;
    this.isEditMode = false;
    
    // Mostrar mensaje de éxito
    this.showSuccessNotification();
  }

  // ========= MÉTODOS ESPECÍFICOS DEL CREADOR =========



  private buildUpdatePayload(formData: any): UpdateCreatorProfileRequest {
    const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar);
    
    return {
      nombre: formData.firstName,
      apellidos: formData.lastName,
      alias: formData.alias,
      descripcion: formData.description,
      especialidad: formData.specialty,
      avatar: avatarFilename
    };
  }

  private handleSpecificAliasError(error: any): void {
    if (error.status === 409 && error.error?.message?.includes('alias')) {
      this.aliasErrorMessage = 'Ese alias ya existe';
    } else if (error.status === 401 || error.status === 403) {
      this.handleAuthError(error);
    } else {
      // Para otros errores relacionados con el alias
      this.aliasErrorMessage = 'Ese alias ya existe';
    }
  }


}
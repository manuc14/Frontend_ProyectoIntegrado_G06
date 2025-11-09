import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { AdminProfileResponse, UpdateAdminProfileRequest } from '../../../../core/services/api.service';
import { toDateInputFormat } from '../../../../core/utils/date-utils';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { BaseProfileComponent } from '../../../../shared/base-profile/base-profile.component';

// Departamentos disponibles para administradores
const ADMIN_DEPARTMENTS = ['Operaciones', 'Marketing', 'Finanzas', 'Recursos Humanos', 'Soporte'];

@Component({
  selector: 'app-ad-consultprofile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderComponent,
    SelectFieldComponent,
    AvatarSelectorComponent,
    FormInputComponent,
    FormDateComponent
  ],
  templateUrl: './ad-consultprofile.component.html',
  styleUrls: ['./ad-consultprofile.component.scss']
})
export class AdConsultprofileComponent extends BaseProfileComponent {

  // ========= PROPIEDADES ESPECÍFICAS DEL ADMIN =========
  departmentOptions: { value: string; label: string }[] = ADMIN_DEPARTMENTS.map(dept => ({ 
    value: dept, 
    label: dept 
  }));

  // Constantes de límites para usar en el template
  readonly maxNombre = 20;
  readonly maxApellidos = 20;
  readonly maxEmail = FORM_LIMITS.emailMax;

  // ========= IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS =========

  protected override initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [''],
      department: [''],
      startDate: ['']
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  protected override loadUserData(): void {
    console.log('🔄 [Profile] Cargando datos del administrador desde el backend...');
    
    this.api.getAdminProfile().subscribe({
      next: (profile: AdminProfileResponse) => {
        console.log('✅ [Profile] Datos del perfil cargados:', profile);
        
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          department: profile.department,
          startDate: toDateInputFormat(profile.registrationDate)
        });

        this.selectedAvatar = profile.avatar || 'assets/admin/admin_default.png';
        this.initialAvatar = this.selectedAvatar;
        this.availableAvatars = profile.availableAvatars || [];
        
        // Configurar campos de solo lectura
        this.profileForm.get('startDate')?.disable();
        this.profileForm.get('email')?.disable();
        
        this.applyEditMode();
        this.initialFormValue = this.profileForm.getRawValue();
        
        console.log('✅ [Profile] Formulario poblado correctamente');
      },
      error: (error: any) => {
        console.error('❌ [Profile] Error al cargar datos del perfil:', error);
        this.handleAuthError(error);
        this.loadFallbackData();
      }
    });
  }

  protected override getEditableFields(): string[] {
    return ['firstName', 'lastName', 'department'];
  }

  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      
      const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar || '');
      
      const payload: UpdateAdminProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        avatar: avatarFilename
      };
      
      console.log('Guardando cambios del perfil:', payload);
      
      this.api.updateAdminProfile(payload).subscribe({
        next: (response: any) => {
          console.log('✅ Perfil actualizado exitosamente:', response);
          this.updateStateAfterSave(formData);
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar perfil:', error);
        }
      });
    }
  }

  // ========= MÉTODOS ESPECÍFICOS DEL ADMIN =========

  protected override handleAuthError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      console.error('❌ [Profile] Error de autorización - cerrando sesión');
      this.authService.logout(true);
    }
  }

  private loadFallbackData(): void {
    this.profileForm.get('startDate')?.disable();
    this.profileForm.get('email')?.disable();
    this.applyEditMode();
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }
}

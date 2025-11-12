import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { toDateInputFormat } from '../../../../core/utils/date-utils';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { BaseProfileComponent } from '../../../../shared/base-profile/base-profile.component';
import { UserProfileResponse, UpdateUserProfileRequest } from '../../../../core/services/api.service';

@Component({
  selector: 'app-user-consultprofile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderComponent,
    AvatarSelectorComponent,
    FormInputComponent,
    FormDateComponent
  ],
  templateUrl: './user-consultprofile.component.html',
  styleUrls: ['./user-consultprofile.component.scss']
})
export class UserConsultprofileComponent extends BaseProfileComponent {

  // ========= PROPIEDADES ESPECÍFICAS DEL USUARIO =========

  // Constantes de límites para usar en el template
  readonly maxNombre = 20;
  readonly maxApellidos = 20;
  readonly maxEmail = FORM_LIMITS.emailMax;

  // Control de suscripción VIP
  isVipUser = false;
  vipExpirationDate: string = '';
  vipRegistrationDate: string = '-'; // Fecha de registro VIP o guión si nunca fue VIP

  // Control de autenticación de dos factores
  twoFactorEnabled = false;

  // ========= IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS =========

  /**
   * Override del método de selección de avatar para añadir logging
   */
  override onAvatarSelected(avatar: string): void {
    console.log('🎭 [Profile] Avatar seleccionado:', avatar);
    super.onAvatarSelected(avatar);
    console.log('🎭 [Profile] this.selectedAvatar después de selección:', this.selectedAvatar);
  }

  protected override initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(this.maxNombre)]],
      lastName: ['', [Validators.required, Validators.maxLength(this.maxApellidos)]],
      email: [''],
      birthDate: [''],
      alias: ['']
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  protected override loadUserData(): void {
    console.log('🔄 [Profile] Cargando datos del usuario desde el backend...');
    
    this.api.getUserProfile().subscribe({
      next: (profile: UserProfileResponse) => {
        console.log('✅ [Profile] Datos del perfil cargados:', profile);
        
        this.profileForm.patchValue({
          firstName: profile.nombre,
          lastName: profile.apellidos,
          email: profile.email,
          birthDate: profile.fechaNacimiento ? toDateInputFormat(profile.fechaNacimiento) : '',
          alias: profile.alias
        });

        this.selectedAvatar = profile.avatar || 'assets/admin/admin_default.png';
        this.initialAvatar = this.selectedAvatar;
        
        // Cargar avatares desde el perfil o desde el endpoint de avatares como fallback
        if (profile.availableAvatars && profile.availableAvatars.length > 0) {
          this.availableAvatars = profile.availableAvatars.map(avatar => this.api.getFullAvatarUrl(avatar));
        } else {
          this.loadAvatarsFromEndpoint();
        }
        
        // Información VIP
        this.isVipUser = profile.estadoVIP;
        this.vipExpirationDate = ''; // Este campo no viene en la respuesta del backend actual
        
        // Determinar la fecha de registro VIP
        if (this.isVipUser) {
          // Si es VIP, usar la fecha de registro como fecha VIP temporal
          this.vipRegistrationDate = this.formatDateForDisplay(profile.registrationDate);
        } else {
          // Si nunca fue VIP, mantener el guión
          this.vipRegistrationDate = '-';
        }
        
        // Configurar campos de solo lectura
        this.profileForm.get('email')?.disable();
        this.profileForm.get('birthDate')?.disable();
        
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

  /**
   * Carga avatares desde el endpoint cuando no están disponibles en el perfil
   */
  private loadAvatarsFromEndpoint(): void {
    this.api.getAvatars().subscribe({
      next: (response) => {
        this.availableAvatars = response.avatars.map((avatar: string) => this.api.getFullAvatarUrl(avatar));
        console.log('✅ [Profile] Avatares cargados desde endpoint:', this.availableAvatars.length);
      },
      error: (error) => {
        console.error('❌ [Profile] Error al cargar avatares:', error);
        // Usar avatares por defecto si hay error
        this.availableAvatars = [
          'assets/admin/admin_default.png',
          'assets/admin/avatar1.png', 
          'assets/admin/avatar2.png'
        ];
      }
    });
  }

  protected override getEditableFields(): string[] {
    return ['firstName', 'lastName', 'alias'];
  }

  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      const payload = this.buildUpdatePayload(formData);
      
      console.log('🔄 [Profile] Guardando cambios del perfil:', payload);
      console.log('🔄 [Profile] Avatar seleccionado:', this.selectedAvatar);
      
      this.api.updateUserProfile(payload).subscribe({
        next: (response: any) => {
          console.log('✅ Perfil de usuario actualizado exitosamente:', response);
          this.updateStateAfterSave(formData);
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar perfil:', error);
          this.handleSpecificErrors(error);
        }
      });
    }
  }

  // ========= MÉTODOS ESPECÍFICOS DEL USUARIO =========

  private loadFallbackData(): void {
    this.profileForm.get('email')?.disable();
    this.profileForm.get('birthDate')?.disable();
    this.applyEditMode();
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }

  private buildUpdatePayload(formData: any): UpdateUserProfileRequest {
    // Extraer nombre del archivo de avatar desde la URL completa
    const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar);
    
    return {
      nombre: formData.firstName,
      apellidos: formData.lastName,
      alias: formData.alias,
      avatar: avatarFilename
    };
  }

  /**
   * Maneja errores específicos del usuario como alias duplicado
   */
  private handleSpecificErrors(error: any): void {
    if (error.status === 409 && error.error?.message?.includes('alias')) {
      // Error de alias duplicado
      console.error('❌ [Profile] Alias ya existe');
      // Aquí podrías mostrar un mensaje específico al usuario
    } else if (error.status === 401 || error.status === 403) {
      this.handleAuthError(error);
    } else {
      console.error('❌ [Profile] Error general al actualizar perfil');
      // Manejar otros errores generales
    }
  }

  /**
   * Formatea una fecha ISO para mostrar en formato DD/MM/AAAA
   */
  public formatDateForDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '-';
    }
  }

  // ========= MÉTODOS PARA GESTIÓN VIP (PLACEHOLDER PARA TDD) =========

  /**
   * Método placeholder para actualizar a VIP
   * Se implementará con TDD más adelante
   */
  onUpgradeToVip(): void {
    console.log('🔄 [VIP] Upgrade to VIP - Placeholder for TDD implementation');
    // Placeholder method - implementation pending with TDD approach
  }

  /**
   * Método placeholder para gestionar funcionalidades VIP
   * Se implementará con TDD más adelante
   */
  onManageVipFeatures(): void {
    console.log('🔄 [VIP] Manage VIP features - Placeholder for TDD implementation');
    // Placeholder method - implementation pending with TDD approach
  }

  /**
   * Método placeholder para cancelar suscripción VIP
   * Se implementará con TDD más adelante
   */
  onCancelVipSubscription(): void {
    console.log('🔄 [VIP] Cancel VIP subscription - Placeholder for TDD implementation');
    // Placeholder method - implementation pending with TDD approach
  }

  /**
   * Método placeholder para eliminar cuenta
   * Se implementará con TDD más adelante
   */
  onDeleteAccount(): void {
    console.log('🔄 [Account] Delete account - Placeholder for TDD implementation');
    // Placeholder method - implementation pending with TDD approach
  }

  /**
   * Maneja el cambio del checkbox de autenticación de dos factores
   */
  onTwoFactorChange(event: any): void {
    this.twoFactorEnabled = event.target.checked;
    console.log('🔐 [2FA] Two-factor authentication:', this.twoFactorEnabled ? 'habilitado' : 'deshabilitado');
    this.checkForChanges(); // Marcar como cambio no guardado
  }
}
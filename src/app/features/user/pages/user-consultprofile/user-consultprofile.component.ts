import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { UserSidebarComponent } from '../../../../shared/components/user-sidebar/user-sidebar.component';
import { fadeIn } from '../../../../core/animations/animations';
import { toDateInputFormat } from '../../../../core/utils/date-utils';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { BaseProfileComponent } from '../../../../shared/base-profile/base-profile.component';
import { UserProfileResponse, UpdateUserProfileRequest } from '../../../../core/services/api.service';
import { minAgeValidator, maxAgeValidator } from '../../../../core/validators/form.validators';

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
    FormDateComponent,
    UserSidebarComponent
  ],
  templateUrl: './user-consultprofile.component.html',
  styleUrl: './user-consultprofile.component.scss',
  animations: [fadeIn]
})
export class UserConsultprofileComponent extends BaseProfileComponent {

  // ========= PROPIEDADES ESPECÍFICAS DEL USUARIO =========

  // Constantes de límites para usar en el template
  readonly maxNombre = 20;
  readonly maxApellidos = 20;
  readonly maxEmail = FORM_LIMITS.emailMax;

  // Getters para acceder a los controles del formulario desde el template
  get f() { return this.profileForm.controls; }

  // Control de suscripción VIP
  isVipUser = false;
  vipExpirationDate: string = '';
  vipRegistrationDate: string = '-'; // Fecha de registro VIP o guión si nunca fue VIP

  // Control de autenticación de dos factores
  twoFactorEnabled = false;
  private initialTwoFactorState = false; // Guardar estado inicial para detectar cambios

  // Control del modal de eliminación de cuenta
  showDeleteModal = false;
  deleteAccountPassword = '';             // Contraseña ingresada en el modal
  showDeletePassword = false;             // Mostrar/ocultar contraseña
  deletePasswordValid = false;            // Si la contraseña es válida (correcta)
  deletePasswordError: string | null = null; // Mensaje de error de contraseña
  isCheckingPassword = false;             // Loading mientras se valida

  // Control del modal de cancelación de VIP
  showCancelVipModal = false;

  // ========= IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS =========

  /**
   * Override del método de selección de avatar para añadir logging
   */
  override onAvatarSelected(avatar: string): void {
    super.onAvatarSelected(avatar);
  }

  protected override initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(this.maxNombre)]],
      lastName: ['', [Validators.required, Validators.maxLength(this.maxApellidos)]],
      email: [''],
      birthDate: ['', [minAgeValidator(4), maxAgeValidator()]],
      alias: ['']
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  protected override loadUserData(): void {
    this.api.getUserProfile().subscribe({
      next: (profile: UserProfileResponse) => {
        
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
        this.vipExpirationDate = '';
        
        // Determinar la fecha de última actualización de estado VIP
        // Solo usar el valor del backend (fechaAltaVip)
        if (profile.fechaAltaVip) {
          this.vipRegistrationDate = this.formatDateForDisplay(profile.fechaAltaVip);
        } else {
          this.vipRegistrationDate = '-';
        }
        
        // Configurar campos de solo lectura
        this.profileForm.get('email')?.disable();
        
        // Cargar estado del tercer factor
        this.twoFactorEnabled = profile.tercerFactor || false;
        this.initialTwoFactorState = this.twoFactorEnabled; // Guardar estado inicial
        
        this.applyEditMode();
        this.initialFormValue = this.profileForm.getRawValue();
      },
      error: (error: any) => {
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
      },
      error: (error) => {
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
    return ['firstName', 'lastName', 'alias', 'birthDate'];
  }

  /**
   * Override de checkForChanges para incluir el checkbox del tercer factor
   */
  protected override checkForChanges(): void {
    // Verificar cambios en el formulario
    if (!this.initialFormValue) return;
    
    const currentValue = this.profileForm.getRawValue();
    const formHasChanges = JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
    
    // Verificar cambios en el estado del tercer factor
    const twoFactorHasChanged = this.twoFactorEnabled !== this.initialTwoFactorState;
    
    // Marcar como cambios no guardados si hay cambios en el formulario O en el tercer factor
    this.hasUnsavedChanges = formHasChanges || twoFactorHasChanged;
  }

  /**
   * Override de onCancelChanges para resetear también el tercer factor
   */
  override onCancelChanges(): void {
    super.onCancelChanges();
    // Resetear el estado del tercer factor al valor inicial
    this.twoFactorEnabled = this.initialTwoFactorState;
  }

  /**
   * Override de updateStateAfterSave para guardar también el estado del tercer factor
   */
  protected override updateStateAfterSave(formData: any): void {
    super.updateStateAfterSave(formData);
    // Guardar el estado actual del tercer factor como el nuevo estado inicial
    this.initialTwoFactorState = this.twoFactorEnabled;
  }

  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      
      console.log('💾 [Guardar] Estado actual del tercer factor:', this.twoFactorEnabled);
      console.log('💾 [Guardar] Estado inicial del tercer factor:', this.initialTwoFactorState);
      console.log('💾 [Guardar] Cambió?', this.twoFactorEnabled !== this.initialTwoFactorState);
      
      const payload = this.buildUpdatePayload(formData);
      
      this.api.updateUserProfile(payload).subscribe({
        next: (response: any) => {
          console.log('✅ [Guardar] Respuesta del backend:', response);
          
          // Verificar si el tercer factor fue HABILITADO (cambió de false a true)
          const tercerFactorHabilitado = this.twoFactorEnabled && !this.initialTwoFactorState;
          
          if (tercerFactorHabilitado) {
            // Restablecer mensaje por defecto antes de mostrar
            this.successMessage = 'Perfil actualizado correctamente';
            // Mostrar mensaje de éxito antes de cerrar sesión
            this.showSuccessNotification();
            // Cerrar sesión después de guardar (con pequeño delay para que se vea el mensaje)
            setTimeout(() => {
              this.logoutAndRedirect();
            }, 1500);
          } else {
            // Si solo se deshabilitó o cambió otra cosa, restablecer mensaje por defecto y actualizar normalmente
            this.successMessage = 'Perfil actualizado correctamente';
            this.updateStateAfterSave(formData);
          }
        },
        error: (error: any) => {
          this.handleSpecificErrors(error);
        }
      });
    }
  }

  /**
   * Cierra sesión y redirige al login
   */
  private logoutAndRedirect(): void {
    this.authService.logout(true);
    // El logout ya redirige a login automáticamente
  }

  // ========= MÉTODOS ESPECÍFICOS DEL USUARIO =========

  private loadFallbackData(): void {
    this.profileForm.get('email')?.disable();
    this.applyEditMode();
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }

  private buildUpdatePayload(formData: any): UpdateUserProfileRequest {
    // Extraer nombre del archivo de avatar desde la URL completa
    const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar);
    
    const payload: UpdateUserProfileRequest = {
      nombre: formData.firstName,
      apellidos: formData.lastName,
      alias: formData.alias,
      avatar: avatarFilename
    };
    
    // Incluir fecha de nacimiento si fue modificada
    if (formData.birthDate && formData.birthDate !== '') {
      payload.fechaNacimiento = formData.birthDate;
      console.log('📅 [Perfil] Fecha de nacimiento a enviar:', formData.birthDate);
    }
    
    // Incluir tercer factor si cambió (tanto si se habilitó como si se deshabilitó)
    if (this.twoFactorEnabled !== this.initialTwoFactorState) {
      payload.tercerFactor = this.twoFactorEnabled;
      console.log('🔐 [Perfil] Tercer factor a enviar:', this.twoFactorEnabled);
    }
    
    console.log('📤 [Perfil] Payload completo:', payload);
    return payload;
  }

  /**
   * Maneja errores específicos del usuario como alias duplicado
   */
  private handleSpecificErrors(error: any): void {
    if (error.status === 409 && error.error?.message?.includes('alias')) {
      // Error de alias duplicado
      // Aquí podrías mostrar un mensaje específico al usuario
    } else if (error.status === 401 || error.status === 403) {
      this.handleAuthError(error);
    }
    // Manejar otros errores generales
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
    } catch {
      return '-';
    }
  }

  // ========= MÉTODOS PARA GESTIÓN VIP =========

  /**
   * Activa la suscripción VIP del usuario.
   * 
   * Envía una petición PATCH al backend para establecer esVip=true.
   * Al completarse con éxito:
   * - Muestra mensaje "Enhorabuena, ya eres VIP"
   * - Actualiza el estado local isVipUser
   * - Recarga los datos del perfil para reflejar cambios
   */
  onUpgradeToVip(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return;
    }
    
    this.api.activateVip(String(currentUser.id)).subscribe({
      next: (response) => {
        // Actualizar estado local
        this.isVipUser = true;
        
        // Actualizar sessionStorage inmediatamente
        const updatedUser = { ...currentUser, esVip: true };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Si el backend devuelve vipActivationDate, usarlo directamente
        if (response.vipActivationDate) {
          this.vipRegistrationDate = this.formatDateForDisplay(response.vipActivationDate);
        }
        
        // Mostrar mensaje de éxito
        this.successMessage = 'Enhorabuena, ya eres VIP';
        this.showSuccessNotification();
        
        // Recargar datos del perfil para obtener fechas actualizadas del backend
        this.loadUserData();
      },
      error: (error) => {
        this.handleAuthError(error);
      }
    });
  }

  /**
   * Método placeholder para gestionar funcionalidades VIP
   * Se implementará con TDD más adelante
   */
  onManageVipFeatures(): void {
    // Placeholder method - implementation pending with TDD approach
  }

  /**
   * Abre el modal de confirmación para cancelar suscripción VIP
   */
  onCancelVipSubscription(): void {
    this.showCancelVipModal = true;
  }

  /**
   * Cancela el modal de desactivación VIP
   */
  cancelVipCancellation(): void {
    this.showCancelVipModal = false;
  }

  /**
   * Confirma y desactiva la suscripción VIP del usuario.
   * 
   * Envía una petición DELETE al backend para establecer esVip=false.
   * Al completarse con éxito:
   * - Muestra mensaje "Ha cambiado al plan estándar"
   * - Actualiza el estado local isVipUser
   * - Recarga los datos del perfil para reflejar cambios
   */
  confirmVipCancellation(): void {
    this.showCancelVipModal = false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return;
    }
    
    this.api.deactivateVip(String(currentUser.id)).subscribe({
      next: (response) => {
        
        // Actualizar estado local
        this.isVipUser = false;
        
        // Actualizar sessionStorage inmediatamente
        const updatedUser = { ...currentUser, esVip: false };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Mostrar mensaje de éxito
        this.successMessage = 'Ha cambiado al plan estándar';
        this.showSuccessNotification();
        
        // Recargar datos del perfil para obtener fechas actualizadas
        this.loadUserData();
      },
      error: (error) => {
        console.error('❌ [VIP] Error al desactivar VIP:', error);
        this.handleAuthError(error);
      }
    });
  }

  /**
   * Método legacy mantenido para compatibilidad (redirige al modal)
   * @deprecated Usar onCancelVipSubscription() en su lugar
   */
  confirmVipCancellationLegacy(): void {
    // Método vacío - redirige a confirmVipCancellation
  }

  /**
   * Abre el modal de confirmación para eliminar cuenta
   */
  onDeleteAccount(): void {
    // Resetear formulario del modal
    this.deleteAccountPassword = '';
    this.showDeletePassword = false;
    this.deletePasswordValid = false;
    this.deletePasswordError = null;
    this.isCheckingPassword = false;
    
    this.showDeleteModal = true;
  }

  /**
   * Valida la contraseña ingresada en el modal
   */
  validateDeletePassword(): void {
    this.deletePasswordError = null;
    this.isCheckingPassword = true;

    if (!this.deleteAccountPassword || this.deleteAccountPassword.trim() === '') {
      this.deletePasswordError = 'La contraseña es obligatoria';
      this.deletePasswordValid = false;
      this.isCheckingPassword = false;
      return;
    }

    // Llamar al backend para validar la contraseña
    this.api.verifyPassword(this.deleteAccountPassword).subscribe({
      next: (response: any) => {
        if (response.valid || response.success) {
          this.deletePasswordValid = true;
          this.deletePasswordError = null;
          console.log('✅ [VerifyPassword] Contraseña correcta');
        } else {
          this.deletePasswordValid = false;
          this.deletePasswordError = 'La contraseña no es correcta';
          console.log('❌ [VerifyPassword] Contraseña incorrecta');
        }
        this.isCheckingPassword = false;
      },
      error: (error: any) => {
        console.error('❌ [VerifyPassword] Error al validar contraseña:', error);
        this.deletePasswordValid = false;
        
        // Mensaje de error específico basado en el tipo de error
        if (error.status === 401 || error.status === 403) {
          this.deletePasswordError = 'La contraseña no es correcta';
        } else if (error.status === 0) {
          this.deletePasswordError = 'Error de conexión con el servidor';
        } else {
          this.deletePasswordError = 'Error al validar la contraseña';
        }
        
        this.isCheckingPassword = false;
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña en el modal
   */
  toggleDeletePasswordVisibility(): void {
    this.showDeletePassword = !this.showDeletePassword;
  }

  /**
   * Confirma y ejecuta la eliminación de la cuenta del usuario
   */
  confirmDeleteAccount(): void {
    this.api.deleteUserAccount().subscribe({
      next: (response: any) => {
        console.log('✅ [DeleteAccount] Cuenta eliminada:', response);
        
        // Cerrar el modal
        this.showDeleteModal = false;
        
        // Personalizar el mensaje de éxito
        this.successMessage = 'Cuenta eliminada correctamente';
        this.showSuccessNotification();
        
        // Redirigir al login después de mostrar el mensaje (3 segundos)
        setTimeout(() => {
          this.authService.logout(true);
        }, 3000);
      },
      error: (error: any) => {
        console.error('❌ [DeleteAccount] Error al eliminar cuenta:', error);
        this.showDeleteModal = false;
        this.handleAuthError(error);
      }
    });
  }

  /**
   * Cancela la eliminación y cierra el modal
   */
  cancelDeleteAccount(): void {
    this.showDeleteModal = false;
  }

  /**
   * Maneja el cambio del checkbox de autenticación de dos factores
   */
  onTwoFactorChange(event: any): void {
    this.twoFactorEnabled = event.target.checked;
    console.log('🔄 [TwoFactor] Checkbox cambiado a:', this.twoFactorEnabled);
    console.log('🔄 [TwoFactor] Estado inicial:', this.initialTwoFactorState);
    this.checkForChanges(); // Marcar como cambio no guardado
  }
}
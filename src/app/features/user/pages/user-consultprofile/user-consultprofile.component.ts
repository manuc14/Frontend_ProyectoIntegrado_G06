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
  showThirdFactorInfo = false; // Mostrar/ocultar tooltip de información

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

        this.loadAvatars(profile.avatar, profile.availableAvatars);
        
        this.isVipUser = profile.estadoVIP;
        this.vipExpirationDate = '';
        this.vipRegistrationDate = profile.fechaAltaVip ? this.formatDateForDisplay(profile.fechaAltaVip) : '-';
        
        this.profileForm.get('email')?.disable();
        
        this.twoFactorEnabled = profile.tercerFactor || false;
        this.initialTwoFactorState = this.twoFactorEnabled;
        
        this.applyEditMode();
        this.initialFormValue = this.profileForm.getRawValue();
      },
      error: (error: any) => {
        this.handleAuthError(error);
        this.loadFallbackData(['email']);
      }
    });
  }

  protected override getEditableFields(): string[] {
    return ['firstName', 'lastName', 'alias', 'birthDate'];
  }

  protected override checkForChanges(): void {
    if (!this.initialFormValue) {
      return;
    }
    
    const currentValue = this.profileForm.getRawValue();
    const formChanged = JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
    const twoFactorChanged = this.twoFactorEnabled !== this.initialTwoFactorState;
    
    this.hasUnsavedChanges = formChanged || twoFactorChanged;
  }

  override onCancelChanges(): void {
    super.onCancelChanges();
    this.twoFactorEnabled = this.initialTwoFactorState;
  }

  protected override updateStateAfterSave(formData: any): void {
    super.updateStateAfterSave(formData);
    this.initialTwoFactorState = this.twoFactorEnabled;
  }

  public override onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      const payload = this.buildUpdatePayload(formData);
      
      this.api.updateUserProfile(payload).subscribe({
        next: () => {
          this.successMessage = 'Perfil actualizado correctamente';
          
          if (this.twoFactorEnabled && !this.initialTwoFactorState) {
            this.showSuccessNotification();
            setTimeout(() => this.authService.logout(true), 1500);
          } else {
            this.updateStateAfterSave(formData);
          }
        },
        error: (error: any) => this.handleAuthError(error)
      });
    }
  }

  // ========= MÉTODOS ESPECÍFICOS DEL USUARIO =========

  private buildUpdatePayload(formData: any): UpdateUserProfileRequest {
    const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar);
    
    const payload: UpdateUserProfileRequest = {
      nombre: formData.firstName,
      apellidos: formData.lastName,
      alias: formData.alias,
      avatar: avatarFilename
    };
    
    if (formData.birthDate) {
      payload.fechaNacimiento = formData.birthDate;
    }
    
    if (this.twoFactorEnabled !== this.initialTwoFactorState) {
      payload.tercerFactor = this.twoFactorEnabled;
    }
    
    return payload;
  }

  // ========= MÉTODOS PARA GESTIÓN VIP =========

  onUpgradeToVip(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return;
    }
    
    this.api.activateVip(String(currentUser.id)).subscribe({
      next: (response) => {
        this.isVipUser = true;
        
        const updatedUser = { ...currentUser, esVip: true };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        if (response.vipActivationDate) {
          this.vipRegistrationDate = this.formatDateForDisplay(response.vipActivationDate);
        }
        
        this.successMessage = 'Enhorabuena, ya eres VIP';
        this.showSuccessNotification();
        this.loadUserData();
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  onCancelVipSubscription(): void {
    this.showCancelVipModal = true;
  }

  cancelVipCancellation(): void {
    this.showCancelVipModal = false;
  }

  confirmVipCancellation(): void {
    this.showCancelVipModal = false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return;
    }
    
    this.api.deactivateVip(String(currentUser.id)).subscribe({
      next: () => {
        this.isVipUser = false;
        
        const updatedUser = { ...currentUser, esVip: false };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        this.successMessage = 'Ha cambiado al plan estándar';
        this.showSuccessNotification();
        this.loadUserData();
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  // ========= MÉTODOS PARA ELIMINACIÓN DE CUENTA =========

  onDeleteAccount(): void {
    this.deleteAccountPassword = '';
    this.showDeletePassword = false;
    this.deletePasswordValid = false;
    this.deletePasswordError = null;
    this.isCheckingPassword = false;
    this.showDeleteModal = true;
  }

  validateDeletePassword(): void {
    this.deletePasswordError = null;
    this.isCheckingPassword = true;

    this.api.verifyPassword(this.deleteAccountPassword || '').subscribe({
      next: (response: any) => {
        this.deletePasswordValid = response.valid || response.success;
        this.deletePasswordError = this.deletePasswordValid ? null : 'La contraseña no es correcta';
        this.isCheckingPassword = false;
      },
      error: () => {
        this.deletePasswordValid = false;
        this.deletePasswordError = 'La contraseña no es correcta';
        this.isCheckingPassword = false;
      }
    });
  }

  toggleDeletePasswordVisibility(): void {
    this.showDeletePassword = !this.showDeletePassword;
  }

  confirmDeleteAccount(): void {
    this.api.deleteUserAccount().subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.successMessage = 'Cuenta eliminada correctamente';
        this.showSuccessNotification();
        setTimeout(() => this.authService.logout(true), 3000);
      },
      error: (error: any) => {
        this.showDeleteModal = false;
        this.handleAuthError(error);
      }
    });
  }

  cancelDeleteAccount(): void {
    this.showDeleteModal = false;
  }

  // ========= MÉTODOS PARA TERCER FACTOR =========

  onTwoFactorChange(event: any): void {
    this.twoFactorEnabled = event.target.checked;
    this.checkForChanges();
  }

  toggleThirdFactorInfo(): void {
    this.showThirdFactorInfo = !this.showThirdFactorInfo;
  }
}
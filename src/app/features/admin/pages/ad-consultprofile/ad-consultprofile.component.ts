import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormPasswordComponent } from '../../../../shared/form-components/form-password/form-password.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { ApiService, AdminProfileResponse } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { toDateInputFormat } from '../../../../core/utils/date-utils';
import { fadeIn, buttonHover, buttonPress } from '../../../../core/animations/animations';

@Component({
  selector: 'app-ad-consultprofile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    FormInputComponent,
    FormPasswordComponent,
    AvatarSelectorComponent
  ],
  templateUrl: './ad-consultprofile.component.html',
  styleUrls: ['./ad-consultprofile.component.scss'],
  animations: [fadeIn, buttonHover, buttonPress]
})
export class AdConsultprofileComponent implements OnInit, OnDestroy {
  
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private formBaseService = inject(FormBaseService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Propiedades para el selector de avatar
  availableAvatars: string[] = [];
  selectedAvatar: string = '';

  // Propiedades para el modal de contraseña
  showModal = false;
  passwordFieldsEnabled = false;
  currentPasswordValue = '';
  currentPasswordError: any = null;
  currentPasswordTouched = false;

  // Propiedades para el tooltip de ayuda de contraseña
  showPasswordTooltip = false;

  constructor() {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
    this.initializeFormBaseService();
    this.loadAvailableAvatars();
    
    // Listener para cerrar tooltip al hacer click fuera
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  private initializeFormBaseService(): void {
    // Crear estado del formulario para el perfil usando FormBaseService
    this.formBaseService.createFormState('ad-consultprofile', {});
    
    // Cargar imágenes de avatar
    this.formBaseService.loadImages('avatar');
  }

  ngOnDestroy(): void {
    // Limpiar estado del formulario
    this.formBaseService.destroyFormState('ad-consultprofile');
    
    // Remover listener del documento
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  private initializeForms(): void {
    // Formulario de información personal (sin dateOfBirth, con email y departamento)
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      alias: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      department: ['', [Validators.required, Validators.maxLength(100)]],
      startDate: ['', [Validators.required]] // Campo deshabilitado, solo lectura
    });

    // Formulario de cambio de contraseña (sin currentPassword)
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  private loadUserData(): void {
    console.log('🔄 [Profile] Cargando datos del administrador desde el backend...');
    
    // El authGuard ya validó la autenticación y el rol, proceder directamente
    this.api.getAdminProfile().subscribe({
      next: (profile: AdminProfileResponse) => {
        console.log('✅ [Profile] Datos del perfil cargados:', profile);
        console.log('🔍 [Profile] Fecha de registro:', profile.registrationDate);
        console.log('🔍 [Profile] Fecha de nacimiento:', profile.dateOfBirth);
        
        // Poblar formulario con datos reales del backend (sin dateOfBirth, con email y departamento)
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          alias: profile.alias,
          email: profile.email,
          department: profile.department,
          startDate: toDateInputFormat(profile.registrationDate)
        });

        console.log('📅 [Profile] Fecha de alta para input:', toDateInputFormat(profile.registrationDate));

        // Cargar avatar actual y avatares disponibles
        this.selectedAvatar = profile.avatar;
        this.availableAvatars = profile.availableAvatars;
        
        // Deshabilitar campos informativos (solo lectura)
        this.profileForm.get('startDate')?.disable();
        this.profileForm.get('email')?.disable();
        this.profileForm.get('department')?.disable();

        // Deshabilitar campos de contraseña hasta validar contraseña actual
        this.passwordForm.get('newPassword')?.disable();
        this.passwordForm.get('confirmPassword')?.disable();
        
        console.log('✅ [Profile] Formulario poblado correctamente');
      },
      error: (error: any) => {
        console.error('❌ [Profile] Error al cargar datos del perfil:', error);
        
        // Si hay error de autenticación, dejar que el authService maneje el logout
        if (error.status === 401 || error.status === 403) {
          console.error('❌ [Profile] Error de autorización - cerrando sesión');
          this.authService.logout(true);
          return;
        }
        
        // Para otros errores, usar fallback
        this.loadFallbackData();
      }
    });
  }

  /**
   * Método de fallback para inicializar formularios vacíos si falla el backend
   */
  private loadFallbackData(): void {
    console.log('⚠️ [Profile] Error al cargar datos - iniciando formularios vacíos');
    
    // No cargar datos de ejemplo, dejar formularios vacíos
    // Solo configurar los campos de solo lectura
    this.profileForm.get('startDate')?.disable();
    this.profileForm.get('email')?.disable();
    this.profileForm.get('department')?.disable();

    // Deshabilitar campos de contraseña hasta validar contraseña actual
    this.passwordForm.get('newPassword')?.disable();
    this.passwordForm.get('confirmPassword')?.disable();

    // Avatar por defecto
    this.selectedAvatar = 'assets/admin/admin_default.png';
  }

  private loadAvailableAvatars(): void {
    // Los avatares disponibles se cargan directamente desde getAdminProfile()
    console.log('ℹ️ [Profile] Avatares se cargan desde backend endpoint');
  }

  selectAvatar(avatar: string): void {
    // Seguir el mismo patrón que admin-entity-edit-form
    // Extraer la ruta relativa de la URL completa
    const relativePath = this.extractRelativePath(avatar);
    
    // Usar FormBaseService para seleccionar la imagen
    this.formBaseService.selectImage(relativePath, 'avatar');
    
    // Actualizar la selección local
    this.selectedAvatar = avatar;
    console.log('Avatar selected:', avatar, 'Relative path:', relativePath);
  }

  private extractRelativePath(fullUrl: string): string {
    // Si la URL contiene '/resources/avatars/', extraer el nombre del archivo
    if (fullUrl.includes('/resources/avatars/')) {
      return fullUrl.split('/resources/avatars/')[1];
    }
    // Si es solo el nombre del archivo o para otros casos, extraer la última parte
    return fullUrl.includes('/') ? (fullUrl.split('/').pop() ?? '') : fullUrl;
  }

  onSaveChanges(): void {
    if (this.profileForm.valid) {
      // Aquí implementarías la lógica para guardar los cambios
      console.log('Profile data to save:', this.profileForm.value);
      // Mostrar mensaje de éxito
    }

    if (this.passwordForm.valid && this.isPasswordFormTouched()) {
      // Aquí implementarías la lógica para cambiar la contraseña
      console.log('Password change requested');
      // Mostrar mensaje de éxito
    }
  }
  private isPasswordFormTouched(): boolean {
    return this.passwordForm.get('newPassword')?.value ||
           this.passwordForm.get('confirmPassword')?.value;
  }

  // Métodos para el modal de contraseña
  showPasswordModal(): void {
    this.showModal = true;
    this.currentPasswordValue = '';
    this.currentPasswordError = null;
    this.currentPasswordTouched = false;
  }

  hidePasswordModal(): void {
    this.showModal = false;
    this.currentPasswordValue = '';
    this.currentPasswordError = null;
    this.currentPasswordTouched = false;
    
    // Si no se han habilitado los campos de contraseña, asegurar que permanezcan deshabilitados
    if (!this.passwordFieldsEnabled) {
      this.passwordForm.get('newPassword')?.disable();
      this.passwordForm.get('confirmPassword')?.disable();
    }
  }

  confirmPasswordChange(): void {
    if (!this.currentPasswordValue) {
      this.currentPasswordError = { required: true };
      this.currentPasswordTouched = true;
      return;
    }

    // Aquí validarías la contraseña actual con el backend
    console.log('Validating current password:', this.currentPasswordValue);
    
    // Simulando validación exitosa
    this.passwordFieldsEnabled = true;
    this.hidePasswordModal();
    
    // Habilitar los campos de contraseña después de validar contraseña actual
    this.passwordForm.get('newPassword')?.enable();
    this.passwordForm.get('confirmPassword')?.enable();
    
    // Mostrar mensaje de éxito
    console.log('Password fields enabled');
  }

  // Métodos para obtener errores de validación
  getFieldError(form: FormGroup, fieldName: string) {
    const field = form.get(fieldName);
    return field?.errors && field?.touched ? field.errors : null;
  }

  isFieldTouched(form: FormGroup, fieldName: string): boolean {
    return form.get(fieldName)?.touched || false;
  }

  // Métodos para el tooltip de ayuda de contraseña
  togglePasswordTooltip(): void {
    this.showPasswordTooltip = !this.showPasswordTooltip;
  }

  /**
   * Cierra el tooltip cuando se hace click fuera de él
   */
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.help') && this.showPasswordTooltip) {
      this.showPasswordTooltip = false;
    }
  }
}
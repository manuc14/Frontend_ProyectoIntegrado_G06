import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { ApiService, AdminProfileResponse, UpdateAdminProfileRequest } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { toDateInputFormat } from '../../../../core/utils/date-utils';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';

// Importar la configuración de departamentos de admin-entity-form para reutilizar
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
export class AdConsultprofileComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private formBaseService = inject(FormBaseService);

  profileForm!: FormGroup;

  // Propiedades para el selector de avatar
  availableAvatars: string[] = [];
  selectedAvatar: string = '';
  private initialAvatar: string = ''; // Guardar avatar inicial para reset

  // Propiedades para opciones del selector de departamento
  // Reutilizamos la misma lista que usa admin-entity-form para mantener consistencia
  departmentOptions: { value: string; label: string }[] = ADMIN_DEPARTMENTS.map(dept => ({ 
    value: dept, 
    label: dept 
  }));

  // Control de cambios y modo edición
  hasUnsavedChanges = false;
  isEditMode = false; // Nueva propiedad para controlar el modo edición
  private initialFormValue: any;

  // Control de mensajes de éxito
  showSuccessMessage = false;
  successMessage = 'Datos actualizados correctamente';

  // Constantes de límites para usar en el template - simplificadas
  readonly maxNombre = 20;
  readonly maxApellidos = 20;
  readonly maxEmail = FORM_LIMITS.emailMax;

  constructor() {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  // Getters para fácil acceso a controles y validaciones en el template
  get firstNameControl() { return this.profileForm.get('firstName'); }
  get lastNameControl() { return this.profileForm.get('lastName'); }

  // Métodos helper para mostrar errores de validación
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.errors?.[errorType] && (field.dirty || field.touched));
  }

  private initializeForms(): void {
    // Formulario de información personal simplificado
    // Las validaciones se manejan directamente en los componentes FormInputComponent
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]], // Solo required, maxLength se maneja en HTML
      lastName: ['', [Validators.required]], // Solo required, maxLength se maneja en HTML
      email: [''], // Sin validaciones, siempre deshabilitado
      department: [''], // Sin required, siempre habrá uno seleccionado en el desplegable
      startDate: [''] // Sin validaciones, siempre deshabilitado
    });

    // Escuchar cambios en el formulario
    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  private checkForChanges(): void {
    if (!this.initialFormValue) return;
    
    const currentValue = this.profileForm.getRawValue();
    this.hasUnsavedChanges = JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  }

  private loadUserData(): void {
    console.log('🔄 [Profile] Cargando datos del administrador desde el backend...');
    
    this.api.getAdminProfile().subscribe({
      next: (profile: AdminProfileResponse) => {
        console.log('✅ [Profile] Datos del perfil cargados:', profile);
        console.log('🔍 [Profile] Departamento del usuario desde backend:', profile.department);
        console.log('🔍 [Profile] Departamentos disponibles:', ADMIN_DEPARTMENTS);
        
        // Poblar formulario con datos reales del backend
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          department: profile.department,
          startDate: toDateInputFormat(profile.registrationDate)
        });

        console.log('🔍 [Profile] Valor del campo department después del patchValue:', this.profileForm.get('department')?.value);

        // Cargar avatar actual y avatares disponibles
        this.selectedAvatar = profile.avatar || 'assets/admin/admin_default.png';
        this.initialAvatar = this.selectedAvatar; // Guardar avatar inicial
        this.availableAvatars = profile.availableAvatars || [];
        
        // Deshabilitar campos de solo lectura
        this.profileForm.get('startDate')?.disable();
        this.profileForm.get('email')?.disable();
        
        // Aplicar modo inicial (campos editables deshabilitados)
        this.applyEditMode();
        
        // Guardar valores iniciales para detectar cambios
        this.initialFormValue = this.profileForm.getRawValue();
        
        console.log('✅ [Profile] Formulario poblado correctamente');
      },
      error: (error: any) => {
        console.error('❌ [Profile] Error al cargar datos del perfil:', error);
        
        if (error.status === 401 || error.status === 403) {
          console.error('❌ [Profile] Error de autorización - cerrando sesión');
          this.authService.logout(true);
          return;
        }
        
        this.loadFallbackData();
      }
    });
  }

  private loadFallbackData(): void {
    console.log('⚠️ [Profile] Error al cargar datos - iniciando formularios vacíos');
    
    this.profileForm.get('startDate')?.disable();
    this.profileForm.get('email')?.disable();
    this.applyEditMode(); // Aplicar modo inicial también en fallback
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }

  // Método para aplicar el estado de edición a los campos
  private applyEditMode(): void {
    const editableFields = ['firstName', 'lastName', 'department'];
    
    editableFields.forEach(fieldName => {
      const field = this.profileForm.get(fieldName);
      if (field) {
        if (this.isEditMode) {
          field.enable();
        } else {
          field.disable();
        }
      }
    });
  }

  // Método para toggle del modo edición (conectado al botón lápiz)
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.applyEditMode();
    
    console.log('Modo edición:', this.isEditMode ? 'Activado' : 'Desactivado');
    
    // Si salimos del modo edición, resetear avatar y formulario si hay cambios
    if (!this.isEditMode) {
      if (this.hasUnsavedChanges) {
        this.onCancelChanges(); // Esto ya resetea el avatar
      } else {
        // Resetear avatar aunque no haya otros cambios
        this.selectedAvatar = this.initialAvatar;
        console.log('Avatar reseteado a:', this.initialAvatar);
      }
    }
  }

  onAvatarSelected(avatar: string): void {
    if (this.isEditMode) { // Solo permitir cambio de avatar en modo edición
      this.selectedAvatar = avatar;
      this.hasUnsavedChanges = true;
    }
  }

  onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      
      // Usar el método existente para extraer el filename del avatar
      const avatarFilename = this.formBaseService.extractImageFileName(this.selectedAvatar || '');
      
      // Preparar payload para el backend
      const payload: UpdateAdminProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        avatar: avatarFilename
      };
      
      console.log('Guardando cambios del perfil:', payload);
      
      // Llamar al método centralizado en el servicio API
      this.api.updateAdminProfile(payload).subscribe({
        next: (response: any) => {
          console.log('✅ Perfil actualizado exitosamente:', response);
          
          // Actualizar valores iniciales después de guardar
          this.initialFormValue = formData;
          this.initialAvatar = this.selectedAvatar; // Actualizar avatar inicial
          this.hasUnsavedChanges = false;
          
          // Desactivar modo edición
          this.isEditMode = false;
          this.applyEditMode();
          
          // Mostrar mensaje de éxito
          this.showSuccessNotification();
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar perfil:', error);
          // Aquí puedes manejar el error, mostrar mensaje al usuario, etc.
        }
      });
    }
  }

  onCancelChanges(): void {
    if (this.initialFormValue) {
      this.profileForm.patchValue(this.initialFormValue);
      this.selectedAvatar = this.initialAvatar; // Restaurar avatar inicial
      this.hasUnsavedChanges = false;
      console.log('Cambios cancelados, avatar restaurado a:', this.initialAvatar);
    }
  }

  // Método para mostrar mensaje de éxito
  private showSuccessNotification(): void {
    this.showSuccessMessage = true;
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }
}
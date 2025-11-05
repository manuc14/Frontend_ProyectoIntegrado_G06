import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { AvatarSelectorComponent } from '../../../../shared/avatar-selector/avatar-selector.component';
import { ApiService, AdminProfileResponse } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { toDateInputFormat } from '../../../../core/utils/date-utils';

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
    AvatarSelectorComponent
  ],
  templateUrl: './ad-consultprofile.component.html',
  styleUrls: ['./ad-consultprofile.component.scss']
})
export class AdConsultprofileComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  profileForm!: FormGroup;

  // Propiedades para el selector de avatar
  availableAvatars: string[] = [];
  selectedAvatar: string = '';

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

  constructor() {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  private initializeForms(): void {
    // Formulario de información personal
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      alias: ['', [Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      department: ['', [Validators.required, Validators.maxLength(100)]],
      startDate: ['', [Validators.required]]
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
          alias: profile.alias,
          email: profile.email,
          department: profile.department,
          startDate: toDateInputFormat(profile.registrationDate)
        });

        console.log('🔍 [Profile] Valor del campo department después del patchValue:', this.profileForm.get('department')?.value);

        // Cargar avatar actual y avatares disponibles
        this.selectedAvatar = profile.avatar;
        this.availableAvatars = profile.availableAvatars;
        
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
    const editableFields = ['firstName', 'lastName', 'alias', 'department'];
    
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
    
    // Si salimos del modo edición sin guardar, preguntar si desea descartar cambios
    if (!this.isEditMode && this.hasUnsavedChanges) {
      this.onCancelChanges();
    }
  }

  onAvatarSelected(avatar: string): void {
    this.selectedAvatar = avatar;
    this.hasUnsavedChanges = true;
    console.log('Avatar seleccionado:', avatar);
  }

  onSaveChanges(): void {
    if (this.profileForm.valid && this.hasUnsavedChanges) {
      const formData = this.profileForm.getRawValue();
      console.log('Datos del perfil a guardar:', formData);
      console.log('Avatar seleccionado:', this.selectedAvatar);
      
      // Aquí implementarías la lógica para guardar los cambios en el backend
      // this.api.updateAdminProfile(formData, this.selectedAvatar).subscribe(...)
      
      // Actualizar valores iniciales después de guardar
      this.initialFormValue = formData;
      this.hasUnsavedChanges = false;
    }
  }

  onCancelChanges(): void {
    if (this.initialFormValue) {
      this.profileForm.patchValue(this.initialFormValue);
      this.hasUnsavedChanges = false;
      console.log('Cambios cancelados');
    }
  }
}
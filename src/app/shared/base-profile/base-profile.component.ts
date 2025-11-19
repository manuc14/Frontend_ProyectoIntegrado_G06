import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { FormBaseService } from '../../core/services/form-base.service';
import { HeaderComponent } from '../header/header.component';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';

/**
 * Componente base para perfiles que contiene toda la estructura HTML común
 * y la lógica compartida entre AdminConsultProfile y ContentCreatorConsultProfile
 * 
 * Funcionalidades compartidas:
 * - Inyección de servicios comunes
 * - Gestión de formularios y validaciones
 * - Manejo de avatares
 * - Control de modo de edición
 * - Gestión de cambios y cancelación
 * - Notificaciones de éxito
 */
@Component({
  selector: 'app-base-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    AvatarSelectorComponent
  ],
  templateUrl: './base-profile.component.html',
  styleUrls: ['./base-profile.component.scss']
})
export class BaseProfileComponent implements OnInit {
  
  // ========= INYECCIÓN DE SERVICIOS COMUNES =========
  protected fb = inject(FormBuilder);
  protected api = inject(ApiService);
  protected authService = inject(AuthService);
  protected formBaseService = inject(FormBaseService);

  // ========= INPUTS PARA PERSONALIZACIÓN DEL TEMPLATE =========
  @Input() title: string = 'Mi Perfil';
  @Input() sectionTitle?: string;
  @Input() cancelButtonText?: string;
  @Input() saveButtonText?: string;
  @Input() savingButtonText?: string;

  // ========= PROPIEDADES COMPARTIDAS DEL FORMULARIO =========
  profileForm!: FormGroup;

  // ========= PROPIEDADES PARA MANEJO DE AVATARES =========
  availableAvatars: string[] = [];
  selectedAvatar: string = '';
  protected initialAvatar: string = '';

  // ========= CONTROL DE MODO DE EDICIÓN Y CAMBIOS =========
  isEditMode = false;
  hasUnsavedChanges = false;
  protected initialFormValue: any;

  // ========= CONTROL DE MENSAJES DE ÉXITO =========
  showSuccessMessage = false;
  successMessage = 'Perfil actualizado correctamente';

  // ========= OBSERVABLES PARA EL TEMPLATE =========
  isSubmitting$?: Observable<boolean>;

  // ========= MÉTODOS VIRTUALES (PUEDEN SER SOBRESCRITOS POR LAS CLASES HIJAS) =========
  protected initializeForms(): void {
    // Implementación por defecto vacía - debe ser sobrescrita
    console.warn('initializeForms() should be overridden in child components');
  }

  protected loadUserData(): void {
    // Implementación por defecto vacía - debe ser sobrescrita
    console.warn('loadUserData() should be overridden in child components');
  }

  protected getEditableFields(): string[] {
    // Implementación por defecto vacía - debe ser sobrescrita
    console.warn('getEditableFields() should be overridden in child components');
    return [];
  }

  public onSaveChanges(): void {
    // Implementación por defecto vacía - debe ser sobrescrita
    console.warn('onSaveChanges() should be overridden in child components');
  }

  // ========= CICLO DE VIDA =========
  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
    
    // Inicializar Observable para el estado de submitting
    this.initializeObservables();
  }

  // ========= INICIALIZACIÓN DE OBSERVABLES =========
  protected initializeObservables(): void {
    // Por defecto, usar un Observable que siempre devuelve false
    // Los componentes hijos pueden sobrescribir esto
    this.isSubmitting$ = new Observable<boolean>(observer => {
      observer.next(false);
    });
  }

  // ========= GESTIÓN DE MODO DE EDICIÓN =========
  /**
   * Toggle del modo edición con reseteo automático de cambios
   */
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.applyEditMode();

    // Si salimos del modo edición, resetear avatar y formulario si hay cambios
    if (!this.isEditMode) {
      if (this.hasUnsavedChanges) {
        this.onCancelChanges();
      } else {
        // Resetear avatar aunque no haya otros cambios
        this.selectedAvatar = this.initialAvatar;
      }
    }
  }

  /**
   * Aplica el estado de edición a los campos especificados por cada componente
   */
  protected applyEditMode(): void {
    const editableFields = this.getEditableFields();
    
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

  // ========= GESTIÓN DE AVATARES =========
  /**
   * Maneja la selección de avatar en modo edición
   */
  onAvatarSelected(avatar: string): void {
    if (this.isEditMode) {
      this.selectedAvatar = avatar;
      this.hasUnsavedChanges = true;
    }
  }

  // ========= DETECCIÓN Y GESTIÓN DE CAMBIOS =========
  /**
   * Detecta cambios en el formulario comparando con valores iniciales
   */
  protected checkForChanges(): void {
    if (!this.initialFormValue) return;
    
    const currentValue = this.profileForm.getRawValue();
    this.hasUnsavedChanges = JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  }

  /**
   * Cancela los cambios y restaura valores iniciales
   */
  onCancelChanges(): void {
    if (this.initialFormValue) {
      this.profileForm.patchValue(this.initialFormValue);
      this.selectedAvatar = this.initialAvatar;
      this.hasUnsavedChanges = false;
    }
  }

  // ========= NOTIFICACIONES DE ÉXITO =========
  /**
   * Muestra la notificación de éxito con duración automática
   */
  protected showSuccessNotification(): void {
    this.showSuccessMessage = true;
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  // ========= UTILIDADES PARA VALIDACIÓN =========
  /**
   * Método helper para mostrar errores de validación
   */
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.errors?.[errorType] && (field.dirty || field.touched));
  }

  // ========= GETTERS COMUNES =========
  get firstNameControl() { return this.profileForm.get('firstName'); }
  get lastNameControl() { return this.profileForm.get('lastName'); }

  // ========= MÉTODO HELPER PARA ACTUALIZAR ESTADO DESPUÉS DE GUARDAR =========
  /**
   * Actualiza el estado interno después de guardar cambios exitosamente
   * Debe ser llamado por las implementaciones de onSaveChanges()
   */
  protected updateStateAfterSave(formData: any): void {
    this.initialFormValue = formData;
    this.initialAvatar = this.selectedAvatar;
    this.hasUnsavedChanges = false;
    
    // Desactivar modo edición
    this.isEditMode = false;
    this.applyEditMode();
    
    // Mostrar mensaje de éxito
    this.showSuccessNotification();
  }

  // ========= MÉTODO HELPER PARA MANEJO DE ERRORES DE AUTORIZACIÓN =========
  /**
   * Maneja errores de autorización comunes
   */
  protected handleAuthError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      console.error('❌ [Profile] Error de autorización - cerrando sesión');
      this.authService.logout();
    }
  }

  // ========= MÉTODOS COMUNES PARA AVATARES Y FORMATEO =========
  /**
   * Carga avatares desde el endpoint cuando no están disponibles en el perfil
   */
  protected loadAvatarsFromEndpoint(): void {
    this.api.getAvatars().subscribe({
      next: (response) => {
        this.availableAvatars = response.avatars.map((avatar: string) => this.api.getFullResourceUrl(avatar));
      },
      error: () => {
        this.availableAvatars = [
          'assets/admin/admin_default.png',
          'assets/admin/avatar1.png', 
          'assets/admin/avatar2.png'
        ];
      }
    });
  }

  /**
   * Formatea una fecha ISO para mostrar en formato DD/MM/AAAA
   */
  protected formatDateForDisplay(dateString: string): string {
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

  /**
   * Carga y configura avatares desde el perfil
   */
  protected loadAvatars(avatarUrl: string | undefined, availableAvatars: string[] | undefined): void {
    this.selectedAvatar = avatarUrl ? this.api.getFullResourceUrl(avatarUrl) : 'assets/admin/admin_default.png';
    this.initialAvatar = this.selectedAvatar;
    
    if (availableAvatars?.length) {
      this.availableAvatars = availableAvatars.map(avatar => this.api.getFullResourceUrl(avatar));
    } else {
      this.loadAvatarsFromEndpoint();
    }
  }

  /**
   * Carga datos por defecto cuando hay error al cargar perfil
   */
  protected loadFallbackData(fieldsToDisable: string[]): void {
    fieldsToDisable.forEach(field => this.profileForm.get(field)?.disable());
    this.applyEditMode();
    this.selectedAvatar = 'assets/admin/admin_default.png';
    this.initialFormValue = this.profileForm.getRawValue();
  }
}
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../core/animations/animations';
import { ApiService } from '../../../core/services/api.service';
import { ImageSelectorService } from '../../../core/services/image-selector.service';
import { FormBaseService } from '../../../core/services/form-base.service';
import { Subscription } from 'rxjs';

export type EntityType = 'admin' | 'creator';

// Interfaces tipadas para formularios
export interface AdminForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  repetirPassword: string;
  departamento: string;
}

export interface CreatorForm {
  nombre: string;
  apellidos: string;
  email: string;
  alias: string;
  password: string;
  repetirPassword: string;
  especialidad: string;
  tipoContenido: string;
  descripcion: string;
}

@Component({
  selector: 'app-admin-entity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-entity-form.component.html',
  styleUrl: './admin-entity-form.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminEntityFormComponent implements OnInit, OnDestroy {
  @Input() entityType: EntityType = 'admin';
  @Input() service: any; // AdminService or CreatorService
  @Input() title: string = '';
  @Input() backRoute: string = '';
  @Input() successRoute: string = '';

  entityForm!: FormGroup;
  formId: string = '';

  // Estado centralizado gestionado por FormBaseService
  private currentFormState: any = {};

  // Propiedades calculadas para compatibilidad con template
  get selectedAvatar(): string {
    return this.currentFormState?.imageState?.selectedImage || '';
  }

  get previewUrl(): string {
    return this.currentFormState?.imageState?.selectedImageUrl || 'assets/admin/foto_upload.svg';
  }

  get isDefaultIcon(): boolean {
    return !this.currentFormState?.imageState?.selectedImage;
  }

  get availableAvatars(): string[] {
    return this.currentFormState?.imageState?.images || [];
  }

  get isLoadingAvatars(): boolean {
    return this.currentFormState?.imageState?.loading || false;
  }

  get avatarLoadError(): boolean {
    return this.currentFormState?.imageState?.error || false;
  }

  get isSubmitting(): boolean {
    return this.currentFormState?.isSubmitting || false;
  }

  get errorMessage(): string | null {
    return this.currentFormState?.error || null;
  }

  showAvatarModal = false;

  // Configuración específica por tipo
  get isPhotoRequired(): boolean {
    return this.entityType === 'creator';
  }

  get photoLabel(): string {
    return this.isPhotoRequired ? 'Avatar *' : 'Avatar (opcional)';
  }

  get submitButtonText(): string {
    const entityName = this.entityType === 'admin' ? 'administrador' : 'creador';
    return this.isSubmitting ? 'Creando...' : `Crear ${entityName}`;
  }

  get aliasPlaceholder(): string {
    return this.entityType === 'creator' ? '@alias_unico' : '';
  }

  get aliasHelpText(): string {
    return this.entityType === 'creator' ? '(no repetible)' : '';
  }

  get emailPlaceholder(): string {
    return this.entityType === 'creator' ? 'email@plataforma.com' : 'email@empresa.com';
  }

  // Opciones específicas
  get selectOptions(): string[] {
    if (this.entityType === 'admin') {
      return [
        'Operaciones',
        'Marketing',
        'Finanzas',
        'Recursos Humanos',
        'Soporte'
      ];
    } else {
      return [
        'Música',
        'Educación',
        'Tecnología',
        'Cocina',
        'Deportes',
        'Arte',
        'Ciencia',
        'Viajes'
      ];
    }
  }

  get selectFieldName(): string {
    return this.entityType === 'admin' ? 'departamento' : 'especialidad';
  }

  get selectLabel(): string {
    return this.entityType === 'admin' ? 'Departamento *' : 'Especialidad *';
  }

  formSubmitted = false;

  // Validaciones de contraseña en tiempo real
  passwordStrength = {
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  private imageStateSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public apiService: ApiService,
    private imageSelectorService: ImageSelectorService,
    private formBaseService: FormBaseService
  ) {
    // Form will be created in ngOnInit after inputs are set
  }

  private createForm(): void {
    if (this.entityType === 'admin') {
      this.entityForm = this.formBaseService.createFormGroup<AdminForm>({
        nombre: '',
        apellidos: '',
        email: '',
        password: '',
        repetirPassword: '',
        departamento: 'Operaciones'
      }, [FormBaseService.passwordMatchValidator('password', 'repetirPassword')]);
    } else {
      this.entityForm = this.formBaseService.createFormGroup<CreatorForm>({
        nombre: '',
        apellidos: '',
        email: '',
        alias: '',
        password: '',
        repetirPassword: '',
        especialidad: 'Música',
        tipoContenido: '',
        descripcion: ''
      }, [FormBaseService.passwordMatchValidator('password', 'repetirPassword')]);
    }
  }

  ngOnInit(): void {
    // Verificar que haya token en sessionStorage
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }

    // Crear ID único para el formulario
    this.formId = `create-${this.entityType}`;

    // Crear estado del formulario
    this.formBaseService.createFormState(this.formId, {});

    // Suscribirse al estado del formulario
    this.formBaseService.getFormState(this.formId)?.subscribe(state => {
      this.currentFormState = state;
    });

    // Crear form con campos comunes
    this.createForm();
    // Cargar avatares
    this.formBaseService.loadImages('avatar');
    // Continuar con la inicialización
    this.initializeForm();
  }

  ngOnDestroy(): void {
    if (this.formId) {
      this.formBaseService.destroyFormState(this.formId);
    }
  }

  private initializeForm(): void {
    // No necesitamos validación manual, usamos validadores reactivos
  }

  passwordMatchValidator(control: AbstractControl) {
    const form = control as FormGroup;
    const password = form.get('password');
    const repetirPassword = form.get('repetirPassword');

    if (password && repetirPassword && password.value !== repetirPassword.value) {
      repetirPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  openAvatarModal(): void {
    this.showAvatarModal = true;
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
  }

  selectPredefinedAvatar(avatar: string): void {
    this.formBaseService.selectImage(avatar, 'avatar');
    this.closeAvatarModal();
  }

  shouldShowError(fieldName: string): boolean {
    const field = this.entityForm.get(fieldName);
    return !!field && this.formSubmitted && field.invalid;
  }

  setTipoContenido(tipo: string): void {
    this.entityForm.patchValue({ tipoContenido: tipo });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.formBaseService.updateFormState(this.formId, { error: null });

    if (!this.validatePhoto()) return;
    if (!this.validatePassword()) return;
    if (!this.validateForm()) return;

    this.formBaseService.updateFormState(this.formId, { isSubmitting: true });
    const entityData = this.prepareEntityData();

    const createMethod = this.entityType === 'admin' ? 'crearAdministrador' : 'crearCreador';

    this.service[createMethod](entityData).subscribe({
      next: (response: any) => this.handleSuccess(response),
      error: (error: any) => this.handleError(error)
    });
  }

  private validatePhoto(): boolean {
    if (this.isPhotoRequired) {
      // Para creadores, se requiere seleccionar un avatar predefinido
      const hasAvatar = this.selectedAvatar !== null && this.selectedAvatar !== '';

      if (!hasAvatar) {
        this.formBaseService.updateFormState(this.formId, {
          error: 'Debe seleccionar un avatar predefinido para los creadores de contenido.'
        });
        return false;
      }
    }
    return true;
  }

  private validatePassword(): boolean {
    const passwordControl = this.entityForm.get('password');
    if (passwordControl?.invalid) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'La contraseña no cumple con los requisitos de seguridad.'
      });
      return false;
    }
    return true;
  }

  private validateForm(): boolean {
    if (this.entityForm.invalid) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'Valores incorrectos. Revisa los campos para continuar.'
      });
      return false;
    }
    return true;
  }

  private prepareEntityData(): any {
    // UNIFICADO: Todos los tipos SOLO usan avatares predefinidos
    // Se envía el nombre del avatar en JSON (igual que registro)
    const fotoNombre = this.formBaseService.extractImageFileName(this.selectedAvatar);

    let entityData: any;

    if (this.entityType === 'admin') {
      entityData = {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        contrasena: this.entityForm.get('password')?.value,
        confirmarContrasena: this.entityForm.get('repetirPassword')?.value,
        departamento: this.entityForm.get('departamento')?.value,
        foto: fotoNombre // Nombre del avatar predefinido (igual que registro)
      };
    } else {
      // Para creadores, igual que registro: nombre del avatar en JSON
      entityData = {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        alias: this.entityForm.get('alias')?.value.trim(),
        contrasena: this.entityForm.get('password')?.value,
        confirmarContrasena: this.entityForm.get('repetirPassword')?.value,
        especialidad: this.entityForm.get('especialidad')?.value,
        tipoContenido: this.entityForm.get('tipoContenido')?.value,
        descripcion: this.entityForm.get('descripcion')?.value?.trim() || '',
        foto: fotoNombre // Nombre del avatar predefinido (igual que registro)
      };
    }

    return entityData;
  }

  private handleSuccess(response: any): void {
    console.log(`${this.entityType} creado exitosamente:`, response);
    const stateData = this.entityType === 'admin' ? {
      adminData: {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        departamento: this.entityForm.get('departamento')?.value,
        foto: response.foto || this.getAvatarPath() || 'assets/admin/default.png'
      }
    } : {
      creatorData: {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        alias: this.entityForm.get('alias')?.value.trim(),
        especialidad: this.entityForm.get('especialidad')?.value,
        tipoContenido: this.entityForm.get('tipoContenido')?.value,
        descripcion: this.entityForm.get('descripcion')?.value?.trim() || '',
        foto: response.foto || this.getAvatarPath() || 'assets/admin/admin_default.png'
      }
    };

    this.router.navigate([this.successRoute], { state: stateData });
  }

  private handleError(error: any): void {
    console.error(`Error al crear ${this.entityType}:`, error);
    this.formBaseService.handleBackendError(this.formId, this.entityForm, error);
  }

  private getAvatarPath(): string | null {
    if (this.selectedAvatar) {
      if (this.entityType === 'creator') {
        return this.selectedAvatar.startsWith('avatars/')
          ? this.selectedAvatar
          : 'avatars/' + this.selectedAvatar.split('/').pop();
      } else {
        return this.selectedAvatar || null;
      }
    }
    return null;
  }

  goBack(): void {
    if (this.entityForm.dirty) {
      const confirmLeave = confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.');
      if (confirmLeave) {
        this.router.navigate([this.backRoute]);
      }
    } else {
      this.router.navigate([this.backRoute]);
    }
  }

  // Métodos para accesibilidad (de creators)
  handleKeyDown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  }

  onCloseAvatarModalKeyDown(event: KeyboardEvent) {
    this.handleKeyDown(event, () => this.closeAvatarModal());
  }

  onCloseAvatarModalKeyUp(event: KeyboardEvent) {
    this.handleKeyUp(event);
  }

  onInnerModalKeyDown(event: KeyboardEvent) {
    this.handleKeyDown(event, () => event.stopPropagation());
  }

  onInnerModalKeyUp(event: KeyboardEvent) {
    this.handleKeyUp(event);
  }

  onSelectAvatarKeyDown(event: KeyboardEvent, avatar: string) {
    this.handleKeyDown(event, () => this.selectPredefinedAvatar(avatar));
  }

  onSelectAvatarKeyUp(event: KeyboardEvent) {
    this.handleKeyUp(event);
  }
}
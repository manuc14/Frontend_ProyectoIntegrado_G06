import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../core/animations/animations';
import { ApiService } from '../../../core/services/api.service';
import { AvatarsResponseDto } from '../../../core/models/media.models';

export type EntityType = 'admin' | 'creator';

@Component({
  selector: 'app-admin-entity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-entity-form.component.html',
  styleUrl: './admin-entity-form.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminEntityFormComponent implements OnInit {
  @Input() entityType: EntityType = 'admin';
  @Input() service: any; // AdminService or CreatorService
  @Input() title: string = '';
  @Input() backRoute: string = '';
  @Input() successRoute: string = '';

  entityForm: FormGroup;
  selectedFile: File | null = null;
  selectedAvatar: string | null = null;
  previewUrl: string = 'assets/admin/foto_upload.svg';
  isDefaultIcon: boolean = true;

  // Configuración específica por tipo
  get isPhotoRequired(): boolean {
    return this.entityType === 'creator';
  }

  get photoLabel(): string {
    return this.isPhotoRequired ? 'Foto *' : 'Foto (opcional)';
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

  showAvatarModal = false;
  availableAvatars: string[] = [];
  isLoadingAvatars = false;
  avatarLoadError = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  formSubmitted = false;

  // Validaciones de contraseña en tiempo real
  passwordStrength = {
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public apiService: ApiService
  ) {
    // Crear form con campos comunes
    this.entityForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repetirPassword: ['', [Validators.required]],
      // Campo alias solo para creators
      ...(this.entityType === 'creator' && { alias: ['', [Validators.required, Validators.minLength(2)]] }),
      // Campos específicos
      departamento: [this.entityType === 'admin' ? 'Operaciones' : null],
      especialidad: [this.entityType === 'creator' ? 'Música' : null],
      tipoContenido: [this.entityType === 'creator' ? '' : null, this.entityType === 'creator' ? Validators.required : null],
      descripcion: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.cargarAvatares();

    // Escuchar cambios en el campo de contraseña
    this.entityForm.get('password')?.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password || '');
    });
  }

  checkPasswordStrength(password: string): void {
    // Default to empty string if password is null or undefined
    const safePassword = password || '';

    this.passwordStrength = {
      hasMinLength: safePassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(safePassword),
      hasLowerCase: /[a-z]/.test(safePassword),
      hasNumber: /\d/.test(safePassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(safePassword)
    };
  }

  get isPasswordValid(): boolean {
    return Object.values(this.passwordStrength).every(v => v);
  }

  get passwordRequirements(): string[] {
    const requirements: string[] = [];
    if (!this.passwordStrength.hasMinLength) requirements.push('Mínimo 8 caracteres');
    if (!this.passwordStrength.hasUpperCase) requirements.push('Al menos una mayúscula');
    if (!this.passwordStrength.hasLowerCase) requirements.push('Al menos una minúscula');
    if (!this.passwordStrength.hasNumber) requirements.push('Al menos un dígito');
    if (!this.passwordStrength.hasSpecialChar) requirements.push('Al menos un carácter especial');
    return requirements;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const repetirPassword = form.get('repetirPassword');

    if (password && repetirPassword && password.value !== repetirPassword.value) {
      repetirPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  cargarAvatares(): void {
    this.isLoadingAvatars = true;
    this.avatarLoadError = false;
    this.apiService.getAvatars().subscribe({
      next: (response: AvatarsResponseDto) => {
        this.availableAvatars = response.avatars || [];
        this.isLoadingAvatars = false;
      },
      error: (err) => {
        console.error('Error al cargar avatares:', err);
        this.isLoadingAvatars = false;
        this.avatarLoadError = true;
      }
    });
  }

  openAvatarModal(): void {
    this.showAvatarModal = true;
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
  }

  selectPredefinedAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.selectedFile = null;
    this.previewUrl = avatar;
    this.isDefaultIcon = false;
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
    this.errorMessage = null;

    if (!this.validatePhoto()) return;
    if (!this.validatePassword()) return;
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    const formData = this.prepareFormData();

    const createMethod = this.entityType === 'admin' ? 'crearAdministrador' : 'crearCreador';

    this.service[createMethod](formData).subscribe({
      next: (response: any) => this.handleSuccess(response),
      error: (error: any) => this.handleError(error)
    });
  }

  private validatePhoto(): boolean {
    if (this.isPhotoRequired && !this.selectedFile && !this.selectedAvatar) {
      this.errorMessage = 'La foto es obligatoria para los creadores de contenido.';
      return false;
    }
    return true;
  }

  private validatePassword(): boolean {
    if (!this.isPasswordValid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return false;
    }
    return true;
  }

  private validateForm(): boolean {
    if (this.entityForm.invalid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return false;
    }
    return true;
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    const entityData = this.prepareEntityData();
    formData.append(this.entityType === 'admin' ? 'admin' : 'creador', new Blob([JSON.stringify(entityData)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  private prepareEntityData(): any {
    let avatarPath = null;

    if (this.selectedAvatar) {
      if (this.entityType === 'creator') {
        avatarPath = this.selectedAvatar.startsWith('avatars/')
          ? this.selectedAvatar
          : 'avatars/' + this.selectedAvatar.split('/').pop();
      } else {
        avatarPath = this.selectedAvatar || null;
      }
    }

    if (this.entityType === 'admin') {
      return {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        contrasena: this.entityForm.get('password')?.value,
        confirmarContrasena: this.entityForm.get('repetirPassword')?.value,
        departamento: this.entityForm.get('departamento')?.value,
        avatarPath: avatarPath
      };
    } else {
      return {
        nombre: this.entityForm.get('nombre')?.value.trim(),
        apellidos: this.entityForm.get('apellidos')?.value.trim(),
        correo: this.entityForm.get('email')?.value.trim(),
        alias: this.entityForm.get('alias')?.value.trim(),
        contrasena: this.entityForm.get('password')?.value,
        confirmarContrasena: this.entityForm.get('repetirPassword')?.value,
        especialidad: this.entityForm.get('especialidad')?.value,
        tipoContenido: this.entityForm.get('tipoContenido')?.value,
        descripcion: this.entityForm.get('descripcion')?.value?.trim() || '',
        avatarPath: avatarPath
      };
    }
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
    this.errorMessage = error.message || `Error al crear el ${this.entityType}. Por favor, intenta nuevamente.`;
    this.isSubmitting = false;
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
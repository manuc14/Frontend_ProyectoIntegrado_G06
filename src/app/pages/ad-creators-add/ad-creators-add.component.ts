import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { CreatorService } from '../../core/services/creator.service';
import { ApiService } from '../../core/services/api.service';
import { AvatarsResponseDto } from '../../core/models/media.models';

@Component({
  selector: 'app-adcreatorsadd',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './ad-creators-add.component.html',
  styleUrl: './ad-creators-add.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminCreatorsAddPage implements OnInit {
  creatorForm: FormGroup;
  selectedFile: File | null = null;
  selectedAvatar: string | null = null;
  previewUrl: string = 'assets/admin/foto_upload.svg';
  isDefaultIcon: boolean = true;

  especialidades = [
    'Música',
    'Educación',
    'Tecnología',
    'Cocina',
    'Deportes',
    'Arte',
    'Ciencia',
    'Viajes'
  ];

  showAvatarModal = false;
  availableAvatars: string[] = [
    'assets/admin/user1.png',
    'assets/admin/user2.png',
    'assets/admin/user3.png',
    'assets/admin/user4.png',
    'assets/admin/user5.png',
    'assets/admin/admin_default.png',
  ];

  isLoadingAvatars = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  formSubmitted = false;

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
    private creatorService: CreatorService,
    public apiService: ApiService
  ) {
    this.creatorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      alias: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repetirPassword: ['', [Validators.required]],
      especialidad: ['Música', [Validators.required]],
      tipoContenido: ['', [Validators.required]],
      descripcion: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.cargarAvatares();

    this.creatorForm.get('password')?.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password || '');
    });
  }

  private readonly MIN_PASSWORD_LENGTH = 8;

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = { hasMinLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false };
      return;
    }

    const pwd = password;
    this.passwordStrength = {
      hasMinLength: pwd.length >= this.MIN_PASSWORD_LENGTH,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
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
    this.apiService.getAvatars().subscribe({
      next: (response: AvatarsResponseDto) => {
        this.availableAvatars = response.avatars;
        this.isLoadingAvatars = false;
      },
      error: (err) => {
        console.error('Error al cargar avatares:', err);
        this.isLoadingAvatars = false;
      }
    });
  }

  openAvatarModal(): void {
    this.showAvatarModal = true;
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
  }

  async selectPredefinedAvatar(avatar: string): Promise<void> {
    this.selectedAvatar = avatar;
    this.selectedFile = null;

    try {
      const res = await fetch(avatar);
      const blob = await res.blob();
      const fileName = avatar.split('/').pop() || 'avatar.png';
      this.selectedFile = new File([blob], fileName, { type: blob.type });
      this.previewUrl = URL.createObjectURL(blob);
      this.isDefaultIcon = false;
      this.closeAvatarModal();
    } catch (error) {
      console.error('Error loading predefined avatar:', error);
      this.errorMessage = 'Error al cargar el avatar predefinido.';
    }
  }

  setTipoContenido(tipo: string): void {
    this.creatorForm.patchValue({ tipoContenido: tipo });
  }

  shouldShowError(fieldName: string): boolean {
    const field = this.creatorForm.get(fieldName);
    return !!field && this.formSubmitted && field.invalid;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage = null;

    // Validar que la foto sea obligatoria
    if (!this.selectedFile && !this.selectedAvatar) {
      this.errorMessage = 'La foto es obligatoria para los creadores de contenido.';
      return;
    }

    // Validar que la contraseña cumpla todos los requisitos
    if (!this.isPasswordValid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return;
    }

    if (this.creatorForm.invalid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();

    // ✅ Preparar avatarPath con la ruta completa si existe
    let avatarPath = null;
    if (this.selectedAvatar) {
      // Si el avatar seleccionado no empieza con "avatars/", añadirlo
      avatarPath = this.selectedAvatar.startsWith('avatars/')
        ? this.selectedAvatar
        : 'avatars/' + this.selectedAvatar.split('/').pop();
    }

    // Crear el objeto creador como JSON
    const creadorData = {
      nombre: this.creatorForm.get('nombre')?.value.trim(),
      apellidos: this.creatorForm.get('apellidos')?.value.trim(),
      correo: this.creatorForm.get('email')?.value.trim(),
      alias: this.creatorForm.get('alias')?.value.trim(),
      contrasena: this.creatorForm.get('password')?.value,
      confirmarContrasena: this.creatorForm.get('repetirPassword')?.value,
      especialidad: this.creatorForm.get('especialidad')?.value,
      tipoContenido: this.creatorForm.get('tipoContenido')?.value,
      descripcion: this.creatorForm.get('descripcion')?.value?.trim() || '',
      avatarPath: avatarPath
    };

    // Añadir el objeto creador como un Blob JSON
    formData.append('creador', new Blob([JSON.stringify(creadorData)], { type: 'application/json' }));

    // Añadir la foto si existe
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile, this.selectedFile.name);
    }

    this.creatorService.crearCreador(formData).subscribe({
      next: (response) => {
        console.log('Creador creado exitosamente:', response);
        // Pasar los datos del creador creado a la página de éxito
        this.router.navigate(['/ad-creators-add-success'], {
          state: {
            creatorData: {
              nombre: this.creatorForm.get('nombre')?.value.trim(),
              apellidos: this.creatorForm.get('apellidos')?.value.trim(),
              correo: this.creatorForm.get('email')?.value.trim(),
              alias: this.creatorForm.get('alias')?.value.trim(),
              especialidad: this.creatorForm.get('especialidad')?.value,
              tipoContenido: this.creatorForm.get('tipoContenido')?.value,
              descripcion: this.creatorForm.get('descripcion')?.value?.trim() || '',
              foto: response.foto || avatarPath || 'assets/admin/admin_default.png'
            }
          }
        });
      },
      error: (error) => {
        console.error('Error al crear creador:', error);
        this.errorMessage = error.message || 'Error al crear el creador. Por favor, intenta nuevamente.';
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    if (this.creatorForm.dirty) {
      const confirmLeave = confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.');
      if (confirmLeave) {
        this.router.navigate(['/ad-creators']);
      }
    } else {
      this.router.navigate(['/ad-creators']);
    }
  }

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

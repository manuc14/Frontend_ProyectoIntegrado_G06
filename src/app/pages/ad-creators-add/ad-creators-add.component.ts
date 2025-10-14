import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { CreatorService } from '../../core/services/creator.service';
import { ApiService, AvatarsResponseDto } from '../../core/services/api.service';

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
    'assets/admin/predef1.png',
    'assets/admin/predef2.png',
    'assets/admin/predef3.png',
    'assets/admin/predef4.png'
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

  checkPasswordStrength(password: string): void {
    this.passwordStrength = {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }

  get isPasswordValid(): boolean {
    return Object.values(this.passwordStrength).every(v => v === true);
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor, selecciona un archivo de imagen válido.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.selectedFile = file;
      this.selectedAvatar = null;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.isDefaultIcon = false;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
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
    return this.formSubmitted && field !== null && field.invalid;
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
        this.router.navigate(['/ad-creator']);
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
}

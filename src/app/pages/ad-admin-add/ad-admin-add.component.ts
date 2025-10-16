// src/app/pages/ad-admin-add/ad-admin-add.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { AdminService } from '../../core/services/admin.service';
import { ApiService } from '../../core/services/api.service';
import { AvatarsResponseDto } from '../../core/models/media.models';

@Component({
  selector: 'app-adadminadd',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './ad-admin-add.component.html',
  styleUrl: './ad-admin-add.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminAdmsAddPage implements OnInit {
  adminForm: FormGroup;
  selectedFile: File | null = null;
  selectedAvatar: string | null = null;
  previewUrl: string = 'assets/admin/foto_upload.svg';
  isDefaultIcon: boolean = true;

  departamentos = [
    'Operaciones',
    'Seguridad',
    'Marketing',
    'Soporte',
    'Recursos Humanos',
    'Finanzas',
    'Desarrollo',
    'Legal'
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
    private adminService: AdminService,
    public apiService: ApiService
  ) {
    this.adminForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      alias: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repetirPassword: ['', [Validators.required]],
      departamento: ['Operaciones', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.cargarAvatares();

    // Escuchar cambios en el campo de contraseña
    this.adminForm.get('password')?.valueChanges.subscribe(password => {
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

  selectPredefinedAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.selectedFile = null;
    this.previewUrl = avatar;
    this.isDefaultIcon = false;
    this.closeAvatarModal();
  }

  shouldShowError(fieldName: string): boolean {
    const field = this.adminForm.get(fieldName);
    return this.formSubmitted && field !== null && field.invalid;
  }

  // src/app/pages/ad-admin-add/ad-admin-add.component.ts
// Reemplaza el método onSubmit() completo:

  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage = null;

    // Validar que la contraseña cumpla todos los requisitos
    if (!this.isPasswordValid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return;
    }

    if (this.adminForm.invalid) {
      this.errorMessage = 'Valores incorrectos. Revisa los campos para continuar.';
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();

    const adminData = {
      nombre: this.adminForm.get('nombre')?.value.trim(),
      apellidos: this.adminForm.get('apellidos')?.value.trim(),
      correo: this.adminForm.get('email')?.value.trim(),
      alias: this.adminForm.get('alias')?.value.trim(),
      contrasena: this.adminForm.get('password')?.value,
      confirmarContrasena: this.adminForm.get('repetirPassword')?.value,
      departamento: this.adminForm.get('departamento')?.value,
      avatarPath: this.selectedAvatar || null
    };

    // Añadir el objeto admin como un Blob JSON
    formData.append('admin', new Blob([JSON.stringify(adminData)], { type: 'application/json' }));

    // Añadir la foto si existe
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile, this.selectedFile.name);
    }

    this.adminService.crearAdministrador(formData).subscribe({
      next: (response) => {
        console.log('Administrador creado exitosamente:', response);
        // Pasar los datos del administrador creado a la página de éxito
        this.router.navigate(['/ad-admin-add-success'], {
          state: {
            adminData: {
              nombre: this.adminForm.get('nombre')?.value.trim(),
              apellidos: this.adminForm.get('apellidos')?.value.trim(),
              correo: this.adminForm.get('email')?.value.trim(),
              alias: this.adminForm.get('alias')?.value.trim(),
              departamento: this.adminForm.get('departamento')?.value,
              foto: response.foto || this.selectedAvatar || 'assets/admin/default.png'
            }
          }
        });
      },
      error: (error) => {
        console.error('Error al crear administrador:', error);
        this.errorMessage = error.message || 'Error al crear el administrador. Por favor, intenta nuevamente.';
        this.isSubmitting = false;
      }
    });
  }
  goBack(): void {
    if (this.adminForm.dirty) {
      const confirmLeave = confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.');
      if (confirmLeave) {
        this.router.navigate(['/ad-admin']);
      }
    } else {
      this.router.navigate(['/ad-admin']);
    }
  }
}

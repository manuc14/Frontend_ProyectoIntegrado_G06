import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { CreatorService } from '../../core/services/creator.service';
import { ApiService } from '../../core/services/api.service';
import { matchPasswordsValidator, passwordPolicyValidator } from '../../core/validators/form.validators';
import { applyBackendDetails, clearBackendErrors } from '../../core/utils/error-mapper';
import { FORM_LIMITS } from '../../core/constants/form-limits';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

interface CreatorAddForm {
  nombre: FormControl<string>;
  apellidos: FormControl<string>;
  email: FormControl<string>;
  alias: FormControl<string>;
  password: FormControl<string>;
  repetirPassword: FormControl<string>;
  especialidad: FormControl<string>;
  tipoContenido: FormControl<string>;
  descripcion: FormControl<string>;
  fotoElegida: FormControl<string | null>;
}

@Component({
  selector: 'app-adcreatorsadd',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './ad-creators-add.component.html',
  styleUrl: './ad-creators-add.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminCreatorsAddPage implements OnInit {
  readonly maxAlias = FORM_LIMITS.aliasMax;
  readonly maxNombre = FORM_LIMITS.nombreMax;
  readonly maxApellidos = FORM_LIMITS.apellidosMax;
  readonly maxEmail = FORM_LIMITS.emailMax;
  readonly maxPassword = FORM_LIMITS.passwordMax;
  readonly FORM_LIMITS = FORM_LIMITS;

  creatorForm: FormGroup<CreatorAddForm>;
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
  availableAvatars: string[] = [];
  defaultAvatar = '';
  avatarLoadError = false;

  isLoadingAvatars = false;
  isSubmitting = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
  formSubmitted = false;

  // Animation estados
  shakeForm = false;
  buttonState = 'normal';
  focusedFields: {[key: string]: boolean} = {};

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private creatorService: CreatorService,
    private apiService: ApiService
  ) {
    this.creatorForm = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.nombreMax)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.apellidosMax)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)]),
      alias: this.fb.nonNullable.control('', [Validators.maxLength(FORM_LIMITS.aliasMax)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()]),
      repetirPassword: this.fb.nonNullable.control('', [Validators.required]),
      especialidad: this.fb.nonNullable.control('Música', [Validators.required]),
      tipoContenido: this.fb.nonNullable.control('', [Validators.required]),
      descripcion: this.fb.nonNullable.control(''),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchPasswordsValidator('password', 'repetirPassword')] });
  }

  get f() { return this.creatorForm.controls; }

  ngOnInit(): void {
    this.loadAvatars();
  }

  loadAvatars() {
    this.isLoadingAvatars = true;
    this.avatarLoadError = false;
    this.apiService.getAvatars().subscribe({
      next: (response) => {
        this.availableAvatars = response.avatars || [];
        this.defaultAvatar = response.defaultAvatar || '';
        this.selectedAvatar = this.defaultAvatar;
        // Actualizar formulario con avatar por defecto
        this.creatorForm.patchValue({ fotoElegida: this.defaultAvatar });
      },
      error: (error) => {
        console.error('Error al cargar avatares:', error);
        // Mostrar mensaje de error y configurar avatar por defecto vacío
        this.isLoadingAvatars = false;
        this.avatarLoadError = true;
        this.availableAvatars = [];
        this.defaultAvatar = '';
        this.selectedAvatar = '';
        // El formulario mantendrá fotoElegida como null para usar el avatar por defecto del backend
        this.creatorForm.patchValue({ fotoElegida: null });
      },
      complete: () => {
        this.isLoadingAvatars = false;
      }
    });
  }

  getAvatarUrl(relativePath: string): string {
    return this.apiService.getFullAvatarUrl(relativePath);
  }

  private extractAvatarFileName(avatarPath: string): string {
    if (!avatarPath) return '';
    // Extraer el nombre del archivo de la ruta (ej: "/avatars/avatar1.png" -> "avatar1.png")
    return avatarPath.split('/').pop() ?? '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.bannerKind = 'error';
        this.bannerText = 'Por favor, selecciona un archivo de imagen válido.';
        this.triggerShakeError();
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.bannerKind = 'error';
        this.bannerText = 'La imagen no debe superar los 5MB.';
        this.triggerShakeError();
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

  setTipoContenido(tipo: string): void {
    this.creatorForm.patchValue({ tipoContenido: tipo });
  }

  shouldShowError(fieldName: string): boolean {
    const field = this.creatorForm.get(fieldName);
    return this.formSubmitted && !!field?.invalid;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.bannerKind = null;
    this.bannerText = '';

    if (this.creatorForm.invalid) {
      this.triggerShakeError();
      return;
    }

    this.buttonState = 'pressed';

    const v = this.creatorForm.value;
    const alias = (v.alias && v.alias.trim().length > 0) ? v.alias.trim() : v.nombre?.trim() ?? '';

    // Extraer solo el nombre del archivo del avatar seleccionado
    let fotoNombre = '';
    if (v.fotoElegida) {
      // Extraer el nombre del archivo de la ruta (ej: "/avatars/avatar1.png" -> "avatar1.png")
      fotoNombre = v.fotoElegida.split('/').pop() ?? '';
    }

    const payload = {
      nombre: v.nombre!,
      apellidos: v.apellidos!,
      correo: v.email!,
      alias,
      contrasena: v.password!,
      confirmarContrasena: v.repetirPassword!,
      especialidad: v.especialidad!,
      tipoContenido: v.tipoContenido!,
      descripcion: v.descripcion || '',
      avatarPath: fotoNombre || null
    };

    this.bannerKind = null;
    this.bannerText = '';
    this.isSubmitting = true;
    this.creatorForm.disable();

    const formData = new FormData();
    formData.append('creador', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    // Añadir la foto si existe
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile, this.selectedFile.name);
    }

    this.creatorService.crearCreador(formData)
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.creatorForm.enable();
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: HttpResponse<any>) => {
          const status = res.status;
          if (status === 201 || status === 200) {
            const body: any = res.body || {};
            const successMsg = (body?.message as string) || 'Creador creado correctamente';
            console.log('Creador creado', body);
            this.bannerKind = 'success';
            this.bannerText = successMsg;
            // Navegar después de un breve delay para mostrar el mensaje
            setTimeout(() => {
              this.router.navigate(['/ad-creators']);
            }, 1500);
            return;
          }
          // Status inesperado, tratar como error
          this.bannerKind = 'error';
          this.bannerText = 'No se pudo crear el creador.';
        },
        error: (err) => {
          // Limpia errores previos de backend en controles relevantes
          clearBackendErrors(this.creatorForm, ['email','password','repetirPassword','nombre','apellidos','alias']);

          const status = err?.originalError?.status || err?.status;
          const payload = err?.originalError?.error || err?.error || {};
          // Usar el mensaje procesado por el interceptor primero
          const message: string | undefined = err?.message || payload?.message;
          const details: Array<{ field: string; message: string }>|undefined = payload?.details;

          if (status === 409) {
            // Email duplicado
            this.creatorForm.get('email')?.setErrors({ ...(this.creatorForm.get('email')?.errors||{}), emailTaken: true });
            this.bannerKind = 'error';
            this.bannerText = message ?? 'El email ya está registrado.';
            this.triggerShakeError();
            return;
          }

          if (status === 400 && Array.isArray(details) && details.length > 0) {
            const fieldMap: Record<string,string> = {
              confirmarContrasena: 'repetirPassword',
              contrasena: 'password',
              correo: 'email',
              nombre: 'nombre',
              apellidos: 'apellidos',
              alias: 'alias',
            };
            const msgJoin = applyBackendDetails(this.creatorForm, details, fieldMap);
            this.bannerKind = 'error';
            this.bannerText = (message ? message + '\n' : '') + msgJoin;
            this.triggerShakeError();
            return;
          }

          // Otros errores
          this.bannerKind = 'error';
          this.bannerText = message ?? 'No se pudo crear el creador. Inténtalo de nuevo.';
          this.triggerShakeError();
          console.error('Error de creación de creador', err);
        },
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

  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  onFieldFocus(field: string, focused: boolean): void {
    this.focusedFields[field] = focused;
  }

  getInputFocusState(field: string): string {
    return this.focusedFields[field] ? 'focused' : 'normal';
  }
}

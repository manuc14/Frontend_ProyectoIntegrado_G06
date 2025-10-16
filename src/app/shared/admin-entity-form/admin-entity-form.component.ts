import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { AdminService } from '../../core/services/admin.service';
import { CreatorService } from '../../core/services/creator.service';
import { ApiService } from '../../core/services/api.service';
import { matchPasswordsValidator, passwordPolicyValidator } from '../../core/validators/form.validators';
import { applyBackendDetails, clearBackendErrors } from '../../core/utils/error-mapper';
import { FORM_LIMITS } from '../../core/constants/form-limits';
import { finalize } from 'rxjs/operators';

export type EntityType = 'admin' | 'creator';

@Component({
  selector: 'app-admin-entity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './admin-entity-form.component.html',
  styleUrls: ['./admin-entity-form.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminEntityFormComponent implements OnInit {
  @Input() entityType: EntityType = 'admin';
  @Input() submitLabel = 'Crear';
  @Input() successRedirect = '/';
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  readonly FORM_LIMITS = FORM_LIMITS;
  readonly maxAlias = FORM_LIMITS.aliasMax;
  readonly maxNombre = FORM_LIMITS.nombreMax;
  readonly maxApellidos = FORM_LIMITS.apellidosMax;
  readonly maxEmail = FORM_LIMITS.emailMax;
  readonly maxPassword = FORM_LIMITS.passwordMax;

  form!: FormGroup;
  selectedFile: File | null = null;
  selectedAvatar: string | null = null;
  previewUrl: string = 'assets/admin/foto_upload.svg';
  isDefaultIcon = true;

  // Opciones específicas
  departamentos = [
    'Operaciones','Seguridad','Marketing','Soporte','Recursos Humanos','Finanzas','Desarrollo','Legal'
  ];

  especialidades = [
    'Música','Educación','Tecnología','Cocina','Deportes','Arte','Ciencia','Viajes'
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
    private adminService: AdminService,
    private creatorService: CreatorService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadAvatars();
  }

  private buildForm() {
    this.form = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.nombreMax)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.apellidosMax)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)]),
      alias: this.fb.nonNullable.control('', [Validators.maxLength(FORM_LIMITS.aliasMax)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()]),
      repetirPassword: this.fb.nonNullable.control('', [Validators.required]),
      descripcion: this.fb.nonNullable.control(''),
      departamento: this.fb.nonNullable.control(this.departamentos[0] || '', [Validators.required]),
      especialidad: this.fb.nonNullable.control(this.especialidades[0] || '', [Validators.required]),
      tipoContenido: this.fb.nonNullable.control('', [Validators.required]),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchPasswordsValidator('password','repetirPassword')] });
  }

  get f() { return this.form.controls; }

  loadAvatars() {
    this.isLoadingAvatars = true;
    this.avatarLoadError = false;
    this.apiService.getAvatars().subscribe({
      next: (response) => {
        this.availableAvatars = response.avatars || [];
        this.defaultAvatar = response.defaultAvatar || '';
        this.selectedAvatar = this.defaultAvatar;
        this.form.patchValue({ fotoElegida: this.defaultAvatar });
      },
      error: (error) => {
        console.error('Error al cargar avatares:', error);
        this.avatarLoadError = true;
        this.availableAvatars = [];
        this.defaultAvatar = '';
        this.selectedAvatar = '';
        this.form.patchValue({ fotoElegida: null });
      },
      complete: () => { this.isLoadingAvatars = false; }
    });
  }

  getAvatarUrl(relativePath: string): string { return this.apiService.getFullAvatarUrl(relativePath); }

  selectAvatar(avatarPath: string) {
    this.selectedAvatar = avatarPath;
    this.form.patchValue({ fotoElegida: avatarPath });
  }

  private extractAvatarFileName(avatarPath: string): string {
    if (!avatarPath) return '';
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
    if (fileInput) fileInput.click();
  }

  shouldShowError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return this.formSubmitted && !!field?.invalid;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.bannerKind = null; this.bannerText = '';

    if (this.form.invalid) { this.triggerShakeError(); return; }

    this.buttonState = 'pressed';
    const v = this.form.value;
    const alias = (v.alias && v.alias.trim().length>0) ? v.alias.trim() : v.nombre?.trim() ?? '';

    let fotoNombre = '';
    if (v.fotoElegida) fotoNombre = this.extractAvatarFileName(v.fotoElegida);

    const basePayload: any = {
      nombre: v.nombre,
      apellidos: v.apellidos,
      correo: v.email,
      alias,
      contrasena: v.password,
      confirmarContrasena: v.repetirPassword,
      descripcion: v.descripcion || '',
      avatarPath: fotoNombre || null
    };

    let serviceObs: any;
    if (this.entityType === 'admin') {
      basePayload.departamento = v.departamento;
      const formData = new FormData();
      formData.append('admin', new Blob([JSON.stringify(basePayload)], { type: 'application/json' }));
      if (this.selectedFile) formData.append('foto', this.selectedFile, this.selectedFile.name);
      this.isSubmitting = true; this.form.disable();
      serviceObs = this.adminService.crearAdministrador(formData);
    } else {
      basePayload.especialidad = v.especialidad;
      basePayload.tipoContenido = v.tipoContenido;
      const formData = new FormData();
      formData.append('creador', new Blob([JSON.stringify(basePayload)], { type: 'application/json' }));
      if (this.selectedFile) formData.append('foto', this.selectedFile, this.selectedFile.name);
      this.isSubmitting = true; this.form.disable();
      serviceObs = this.creatorService.crearCreador(formData);
    }

    serviceObs
      .pipe(finalize(() => { this.isSubmitting = false; this.form.enable(); this.buttonState = 'normal'; }))
      .subscribe({
        next: (res: any) => {
          const status = res?.status || res?.body?.status;
          // Tratar como éxito si HTTP 200/201 o si el backend devuelve objeto simple
          this.bannerKind = 'success';
          this.bannerText = (res?.body?.message || res?.message) || (this.entityType === 'admin' ? 'Administrador creado correctamente' : 'Creador creado correctamente');
          setTimeout(() => {
            this.router.navigate([this.successRedirect]);
            this.submitted.emit({ success: true, body: res });
          }, 1500);
        },
        error: (err: any) => {
          clearBackendErrors(this.form, ['email','password','repetirPassword','nombre','apellidos','alias']);
          const status = err?.originalError?.status || err?.status;
          const payload = err?.originalError?.error || err?.error || {};
          const message: string|undefined = err?.message || payload?.message;
          const details: Array<{field:string;message:string}>|undefined = payload?.details;

          if (status === 409) {
            this.form.get('email')?.setErrors({ ...(this.form.get('email')?.errors||{}), emailTaken: true });
            this.bannerKind = 'error';
            this.bannerText = message ?? 'El email ya está registrado.';
            this.triggerShakeError();
            return;
          }

          if (status === 400 && Array.isArray(details) && details.length>0) {
            const fieldMap: Record<string,string> = {
              confirmarContrasena: 'repetirPassword',
              contrasena: 'password',
              correo: 'email',
              nombre: 'nombre',
              apellidos: 'apellidos',
              alias: 'alias',
            };
            const msgJoin = applyBackendDetails(this.form, details, fieldMap);
            this.bannerKind = 'error';
            this.bannerText = (message ? message + '\n' : '') + msgJoin;
            this.triggerShakeError();
            return;
          }

          this.bannerKind = 'error';
          this.bannerText = message ?? 'No se pudo completar la operación. Inténtalo de nuevo.';
          this.triggerShakeError();
          console.error('Error creación entidad', err);
        }
      });
  }

  goBack(): void {
    if (this.form.dirty) {
      const confirmLeave = confirm('¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.');
      if (confirmLeave) this.router.navigate([this.successRedirect]);
    } else {
      this.router.navigate([this.successRedirect]);
    }
  }

  triggerShakeError(): void { this.shakeForm = !this.shakeForm; }
  onFieldFocus(field: string, focused: boolean): void { this.focusedFields[field] = focused; }
  getInputFocusState(field: string): string { return this.focusedFields[field] ? 'focused' : 'normal'; }

  // Establece el tipo de contenido para creadores (audio/video)
  setTipoContenido(tipo: string): void {
    if (!this.form) return;
    this.form.patchValue({ tipoContenido: tipo });
  }
}

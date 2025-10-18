import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CreatorService, BackendErrorResponse } from '../../core/services/creator.service';
import { fadeIn } from '../../core/animations/animations';
import { ModalHeaderComponent } from '../../shared/modal-header/modal-header.component';
import { ErrorContainerComponent } from '../../shared/error-container/error-container.component';
import { AvatarSelectorComponent } from '../../shared/avatar-selector/avatar-selector.component';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import { PasswordFieldComponent } from '../../shared/password-field/password-field.component';
import { ConfirmPasswordFieldComponent } from '../../shared/confirm-password-field/confirm-password-field.component';
import { TextAreaFieldComponent } from '../../shared/textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../shared/select-field/select-field.component';
import { ToggleBlockButtonComponent } from '../../shared/toggle-block-button/toggle-block-button.component';
import { FormActionsComponent } from '../../shared/form-actions/form-actions.component';
import { TipoContenidoButtonsComponent } from '../../shared/tipo-contenido-buttons/tipo-contenido-buttons.component';

interface CreatorEditData {
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  descripcion: string;
  especialidad: string;
  contrasena: string;
  confirmarContrasena: string;
  foto?: string;
  activo: boolean;
  tipoContenido: string;
}

@Component({
  selector: 'app-ad-creators-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalHeaderComponent,
    ErrorContainerComponent,
    AvatarSelectorComponent,
    InputFieldComponent,
    PasswordFieldComponent,
    ConfirmPasswordFieldComponent,
    TextAreaFieldComponent,
    SelectFieldComponent,
    ToggleBlockButtonComponent,
    FormActionsComponent,
    TipoContenidoButtonsComponent
  ],
  templateUrl: './ad-creators-edit.component.html',
  styleUrl: './ad-creators-edit.component.scss',
  animations: [fadeIn]
})
export class AdminCreatorsEditPage implements OnInit {
  creatorId: string = '';
  creatorData: CreatorEditData = {
    nombre: '',
    apellidos: '',
    correo: '',
    alias: '',
    descripcion: '',
    especialidad: '',
    contrasena: '',
    confirmarContrasena: '',
    foto: '',
    activo: true,
    tipoContenido: 'VIDEO'
  };
  originalData: CreatorEditData = {
    nombre: '',
    apellidos: '',
    correo: '',
    alias: '',
    descripcion: '',
    especialidad: '',
    contrasena: '',
    confirmarContrasena: '',
    foto: '',
    activo: true,
    tipoContenido: 'VIDEO'
  };
  availableAvatars: string[] = [
    'assets/admin/user1.png',
    'assets/admin/user2.png',
    'assets/admin/user3.png',
    'assets/admin/user4.png',
    'assets/admin/user5.png',
    'assets/admin/admin_default.png'
  ];
  selectedAvatar: string = '';
  defaultAvatar: string = 'assets/admin/usuarios_negro.png';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isSaving: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  passwordMismatch: boolean = false;
  nombreTooLong: boolean = false;
  apellidosTooLong: boolean = false;
  aliasTooLong: boolean = false;
  descripcionTooLong: boolean = false;
  especialidadTooLong: boolean = false;
  correoInvalid: boolean = false;
  passwordStrength = {
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private creatorService: CreatorService
  ) {}

  ngOnInit(): void {
    (async () => {
      this.creatorId = this.route.snapshot.paramMap.get('id') || '';
      if (!this.creatorId) {
        console.error('No se proporcionó ID de creador');
        await this.router.navigate(['/ad-creators']);
        return;
      }
      this.cargarDatosCreador();
    })();
  }

  private cargarDatosCreador(): void {
    this.isLoading = true;
    this.error = null;
    this.creatorService.listarCreadores().subscribe({
      next: (creators) => {
        const creator = creators.find(a => a.id === this.creatorId);
        if (!creator) {
          this.error = 'Creador no encontrado';
          this.router.navigate(['/ad-creators']);
          return;
        }
        this.creatorData = {
          nombre: creator.nombre || '',
          apellidos: creator.apellidos || '',
          correo: creator.correo || '',
          alias: creator.alias || '',
          descripcion: creator.descripcion || '',
          especialidad: creator.especialidad || '',
          contrasena: '',
          confirmarContrasena: '',
          foto: creator.foto || '',
          activo: creator.activo,
          tipoContenido: this.normalizeTipoContenido(creator.tipoContenido)
        };
        this.selectedAvatar = this.getCreatorPhoto(creator.foto);
        this.originalData = JSON.parse(JSON.stringify(this.creatorData));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar creador:', err);
        this.error = 'Error al cargar los datos del creador';
        this.isLoading = false;
      }
    });
  }

  private readonly DEFAULT_TIPO = 'VIDEO';
  private readonly AUDIO_KEY = 'audio';

  private normalizeTipoContenido(tipo: string | undefined | null): string {
    if (!tipo) return this.DEFAULT_TIPO;
    const normalized = tipo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    return normalized.includes(this.AUDIO_KEY) ? 'AUDIO' : this.DEFAULT_TIPO;
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.creatorData.foto = avatar;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleBloquear(): void {
    this.creatorData.activo = !this.creatorData.activo;
  }

  validatePasswordMatch(): void {
    if (this.creatorData.contrasena.trim() !== '' || this.creatorData.confirmarContrasena.trim() !== '') {
      this.passwordMismatch = this.creatorData.contrasena !== this.creatorData.confirmarContrasena;
    } else {
      this.passwordMismatch = false;
    }
  }

  validateNombreLength(): void {
    this.nombreTooLong = this.creatorData.nombre.length > 20;
  }

  validateApellidosLength(): void {
    this.apellidosTooLong = this.creatorData.apellidos.length > 20;
  }

  validateAliasLength(): void {
    this.aliasTooLong = this.creatorData.alias.length > 20;
  }

  validateDescripcionLength(): void {
    this.descripcionTooLong = this.creatorData.descripcion.length > 200;
  }

  validateEspecialidadLength(): void {
    this.especialidadTooLong = this.creatorData.especialidad.length > 50;
  }

  validateCorreo(): void {
    const emailRegex = /^(?!.*\s)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    this.correoInvalid = this.creatorData.correo.trim() !== '' && !emailRegex.test(this.creatorData.correo);
  }

  hasChanges(): boolean {
    const dataChanged =
      this.creatorData.nombre !== this.originalData.nombre ||
      this.creatorData.apellidos !== this.originalData.apellidos ||
      this.creatorData.correo !== this.originalData.correo ||
      this.creatorData.alias !== this.originalData.alias ||
      this.creatorData.descripcion !== this.originalData.descripcion ||
      this.creatorData.especialidad !== this.originalData.especialidad ||
      this.creatorData.foto !== this.originalData.foto ||
      this.creatorData.activo !== this.originalData.activo ||
      this.creatorData.tipoContenido !== this.originalData.tipoContenido;
    const passwordChanged =
      this.creatorData.contrasena.trim() !== '' ||
      this.creatorData.confirmarContrasena.trim() !== '';
    return dataChanged || passwordChanged;
  }

  private validarDatos(): { valido: boolean; mensaje: string } {
    this.validateNombreLength();
    this.validateApellidosLength();
    this.validateAliasLength();
    this.validateDescripcionLength();
    this.validateEspecialidadLength();
    this.validateCorreo();
    if (!this.isNombreValid()) return { valido: false, mensaje: 'El nombre es obligatorio' };
    if (this.nombreTooLong) return { valido: false, mensaje: 'El nombre no puede superar 20 caracteres' };
    if (!this.isApellidosValid()) return { valido: false, mensaje: 'Los apellidos son obligatorios' };
    if (this.apellidosTooLong) return { valido: false, mensaje: 'Los apellidos no pueden superar 20 caracteres' };
    if (!this.isCorreoValid()) return { valido: false, mensaje: 'El correo es obligatorio o no válido' };
    if (this.correoInvalid) return { valido: false, mensaje: 'El formato del correo no es válido' };
    if (!this.isAliasValid()) return { valido: false, mensaje: 'El alias es obligatorio' };
    if (this.aliasTooLong) return { valido: false, mensaje: 'El alias no puede superar 20 caracteres' };
    if (!this.isDescripcionValid()) return { valido: false, mensaje: 'La descripción supera 200 caracteres' };
    if (!this.isEspecialidadValid()) return { valido: false, mensaje: 'La especialidad es obligatoria' };
    if (this.especialidadTooLong) return { valido: false, mensaje: 'La especialidad no puede superar 50 caracteres' };
    if (this.creatorData.contrasena.trim() !== '' && !this.isPasswordValid()) {
      return { valido: false, mensaje: 'La contraseña no cumple los requisitos' };
    }
    if (!this.isTipoContenidoValid()) {
      return { valido: false, mensaje: 'El tipo de contenido es obligatorio' };
    }
    return { valido: true, mensaje: '' };
  }

  private isNombreValid(): boolean {
    return this.creatorData.nombre.trim().length > 0 && this.creatorData.nombre.length <= 20;
  }

  private isApellidosValid(): boolean {
    return this.creatorData.apellidos.trim().length > 0 && this.creatorData.apellidos.length <= 20;
  }

  private isCorreoValid(): boolean {
    const emailRegex = /^(?!.*\s)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return this.creatorData.correo.trim() === '' || emailRegex.test(this.creatorData.correo);
  }

  private isAliasValid(): boolean {
    return this.creatorData.alias.trim().length > 0 && this.creatorData.alias.length <= 20;
  }

  private isDescripcionValid(): boolean {
    return this.creatorData.descripcion.length <= 200;
  }

  private isEspecialidadValid(): boolean {
    return this.creatorData.especialidad.trim().length > 0 && this.creatorData.especialidad.length <= 50;
  }

  private isTipoContenidoValid(): boolean {
    const normalized = this.creatorData.tipoContenido
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    return normalized === 'video' || normalized === 'audio';
  }

  private isPasswordValid(): boolean {
    if (this.creatorData.contrasena.length < 8) return false;
    if (!/[A-Z]/.test(this.creatorData.contrasena)) return false;
    if (!/\d/.test(this.creatorData.contrasena)) return false;
    return this.creatorData.contrasena === this.creatorData.confirmarContrasena;
  }

  onGuardarCambios(): void {
    if (this.isSaving) return;
    const validacion = this.validarDatos();
    const normalizedTipoContenido = this.normalizeTipoContenido(this.creatorData.tipoContenido);
    if (!validacion.valido) {
      this.error = validacion.mensaje;
      return;
    }
    this.isSaving = true;
    this.error = null;
    const updateData: any = {
      nombre: this.creatorData.nombre.trim(),
      apellidos: this.creatorData.apellidos.trim(),
      correo: this.creatorData.correo.trim(),
      alias: this.creatorData.alias.trim(),
      descripcion: this.creatorData.descripcion.trim(),
      especialidad: this.creatorData.especialidad.trim(),
      foto: this.selectedAvatar,
      activo: this.creatorData.activo,
      tipoContenido: normalizedTipoContenido
    };
    if (this.creatorData.contrasena.trim() !== '') {
      updateData.contrasena = this.creatorData.contrasena;
      updateData.confirmarContrasena = this.creatorData.confirmarContrasena;
    }
    this.creatorService.editarCreador(this.creatorId, updateData).subscribe({
      next: (response) => {
        console.log('Creador actualizado exitosamente:', response);
        this.originalData = JSON.parse(JSON.stringify(this.creatorData));
        this.originalData.foto = this.selectedAvatar;
        this.originalData.tipoContenido = normalizedTipoContenido;
        this.creatorData.contrasena = '';
        this.creatorData.confirmarContrasena = '';
        this.isSaving = false;
        alert('Cambios guardados exitosamente');
        this.router.navigate(['/ad-creators']);
      },
      error: (err: BackendErrorResponse) => {
        console.error('Error al actualizar creador:', err);
        let errorMessage = err.message || 'Error al guardar los cambios';
        if (err.errors && err.errors.length > 0) {
          errorMessage += '\nDetalles:\n' + err.errors.map(e => `- ${e.message}`).join('\n');
        } else if (err.details) {
          errorMessage += '\nDetalles: ' + JSON.stringify(err.details);
        }
        this.error = errorMessage;
        this.isSaving = false;
      }
    });
  }

  onCancelar(): void {
    if (this.hasChanges()) {
      const confirmar = confirm(
        '¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.'
      );
      if (!confirmar) {
        return;
      }
    }
    this.router.navigate(['/ad-creators']);
  }

  onCerrar(): void {
    this.onCancelar();
  }

  getCreatorPhoto(foto: string | undefined | null): string {
    if (!foto || foto.trim() === '') {
      return this.defaultAvatar;
    }
    if (!foto.startsWith('assets/')) {
      return `assets/admin/${foto}`;
    }
    return foto;
  }

  validatePasswordStrength(): void {
    const pwd = this.creatorData.contrasena;
    this.passwordStrength = {
      hasMinLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[^A-Za-z0-9\s]/.test(pwd)
    };
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

  get isPasswordStrong(): boolean {
    return this.passwordStrength.hasMinLength &&
      this.passwordStrength.hasUpperCase &&
      this.passwordStrength.hasLowerCase &&
      this.passwordStrength.hasNumber &&
      this.passwordStrength.hasSpecialChar;
  }
}

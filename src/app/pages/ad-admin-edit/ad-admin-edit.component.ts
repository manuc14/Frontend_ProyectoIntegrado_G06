import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService, BackendErrorResponse } from '../../core/services/admin.service';
import { fadeIn } from '../../core/animations/animations';
import { ModalHeaderComponent } from '../../shared/modal-header/modal-header.component';
import { ErrorContainerComponent } from '../../shared/error-container/error-container.component';
import { AvatarSelectorComponent } from '../../shared/avatar-selector/avatar-selector.component';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import { PasswordFieldComponent } from '../../shared/password-field/password-field.component';
import { ConfirmPasswordFieldComponent } from '../../shared/confirm-password-field/confirm-password-field.component';
import { SelectFieldComponent } from '../../shared/select-field/select-field.component';
import { ToggleBlockButtonComponent } from '../../shared/toggle-block-button/toggle-block-button.component';
import { FormActionsComponent } from '../../shared/form-actions/form-actions.component';
import { BaseEditService } from '../../shared/base-edit/base-edit.service';

interface AdminEditData {
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  departamento: string;
  contrasena: string;
  confirmarContrasena: string;
  foto: string;
  activo: boolean;
}

@Component({
  selector: 'app-ad-admin-edit',
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
    SelectFieldComponent,
    ToggleBlockButtonComponent,
    FormActionsComponent
  ],
  templateUrl: './ad-admin-edit.component.html',
  styleUrl: './ad-admin-edit.component.scss',
  animations: [fadeIn]
})
export class AdminAdmsEditPage implements OnInit {
  adminId: string = '';
  adminData: AdminEditData = {
    nombre: '',
    apellidos: '',
    correo: '',
    alias: '',
    departamento: '',
    contrasena: '',
    confirmarContrasena: '',
    foto: '',
    activo: true
  };
  originalData: AdminEditData = {
    nombre: '',
    apellidos: '',
    correo: '',
    alias: '',
    departamento: '',
    contrasena: '',
    confirmarContrasena: '',
    foto: '',
    activo: true
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
    private adminService: AdminService,
    private baseEditService: BaseEditService
  ) {}

  ngOnInit(): void {
    this.adminId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.adminId) {
      console.error('No se proporcionó ID de administrador');
      this.router.navigate(['/ad-admin']);
      return;
    }
    this.cargarDatosAdministrador();
  }

  private cargarDatosAdministrador(): void {
    this.isLoading = true;
    this.error = null;
    this.adminService.listarAdministradores().subscribe({
      next: (admins) => {
        const admin = admins.find(a => a.id === this.adminId);
        if (!admin) {
          this.error = 'Administrador no encontrado';
          this.router.navigate(['/ad-admin']);
          return;
        }
        this.adminData = {
          nombre: admin.nombre || '',
          apellidos: admin.apellidos || '',
          correo: admin.correo || '',
          alias: admin.alias || '',
          departamento: admin.departamento || '',
          contrasena: '',
          confirmarContrasena: '',
          foto: admin.foto || '',
          activo: admin.activo
        };
        this.selectedAvatar = this.getAdminPhoto(admin.foto);
        this.originalData = JSON.parse(JSON.stringify(this.adminData));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar administrador:', err);
        this.error = 'Error al cargar los datos del administrador';
        this.isLoading = false;
      }
    });
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.adminData.foto = avatar;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleBloquear(): void {
    this.adminData.activo = !this.adminData.activo;
  }

  validatePasswordMatch(): void {
    if (this.adminData.contrasena.trim() !== '' || this.adminData.confirmarContrasena.trim() !== '') {
      this.passwordMismatch = this.adminData.contrasena !== this.adminData.confirmarContrasena;
    } else {
      this.passwordMismatch = false;
    }
  }

  validateNombreLength(): void {
    this.nombreTooLong = this.adminData.nombre.length > 20;
  }

  validateApellidosLength(): void {
    this.apellidosTooLong = this.adminData.apellidos.length > 20;
  }

  hasChanges(): boolean {
    const dataChanged =
      this.adminData.nombre !== this.originalData.nombre ||
      this.adminData.apellidos !== this.originalData.apellidos ||
      this.adminData.correo !== this.originalData.correo ||
      this.adminData.alias !== this.originalData.alias ||
      this.adminData.departamento !== this.originalData.departamento ||
      this.adminData.foto !== this.originalData.foto ||
      this.adminData.activo !== this.originalData.activo;
    const passwordChanged =
      this.adminData.contrasena.trim() !== '' ||
      this.adminData.confirmarContrasena.trim() !== '';
    return dataChanged || passwordChanged;
  }

  private validarDatos(): { valido: boolean; mensaje: string } {
    if (!this.adminData.nombre.trim() || this.adminData.nombre.length > 20) {
      return { valido: false, mensaje: this.adminData.nombre.trim() ? 'El nombre no puede superar 20 caracteres' : 'El nombre es obligatorio' };
    }
    if (!this.adminData.apellidos.trim() || this.adminData.apellidos.length > 20) {
      return { valido: false, mensaje: this.adminData.apellidos.trim() ? 'Los apellidos no pueden superar 20 caracteres' : 'Los apellidos son obligatorios' };
    }
    if (!this.adminData.correo.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.adminData.correo)) {
      return { valido: false, mensaje: this.adminData.correo.trim() ? 'El formato del correo no es válido' : 'El correo es obligatorio' };
    }
    if (!this.adminData.departamento) {
      return { valido: false, mensaje: 'El departamento es obligatorio' };
    }
    if (this.adminData.contrasena.trim() !== '' && !this.validarContrasena()) {
      return { valido: false, mensaje: this.obtenerMensajeErrorContrasena() };
    }
    return { valido: true, mensaje: '' };
  }

  private validarContrasena(): boolean {
    return this.adminData.contrasena.length >= 8 &&
      /[A-Z]/.test(this.adminData.contrasena) &&
      /\d/.test(this.adminData.contrasena) &&
      !/^[A-Z]/.test(this.adminData.contrasena) &&
      this.adminData.contrasena === this.adminData.confirmarContrasena;
  }

  private obtenerMensajeErrorContrasena(): string {
    if (this.adminData.contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(this.adminData.contrasena)) return 'La contraseña debe incluir al menos una mayúscula';
    if (!/\d/.test(this.adminData.contrasena)) return 'La contraseña debe incluir al menos un número';
    if (/^[A-Z]/.test(this.adminData.contrasena)) return 'La contraseña no puede comenzar con mayúscula';
    if (this.adminData.contrasena !== this.adminData.confirmarContrasena) return 'Las contraseñas no coinciden';
    return '';
  }

  onGuardarCambios(): void {
    if (this.isSaving) return;
    const validacion = this.validarDatos();
    if (!validacion.valido) {
      this.error = validacion.mensaje;
      return;
    }
    this.isSaving = true;
    this.error = null;
    const updateData: any = {
      nombre: this.adminData.nombre.trim(),
      apellidos: this.adminData.apellidos.trim(),
      correo: this.adminData.correo.trim(),
      alias: this.adminData.alias.trim(),
      departamento: this.adminData.departamento,
      foto: this.selectedAvatar,
      activo: this.adminData.activo
    };
    if (this.adminData.contrasena.trim() !== '') {
      updateData.contrasena = this.adminData.contrasena;
      updateData.confirmarContrasena = this.adminData.confirmarContrasena;
    }
    this.adminService.editarAdministrador(this.adminId, updateData).subscribe({
      next: (response) => {
        console.log('Administrador actualizado exitosamente:', response);
        this.originalData = JSON.parse(JSON.stringify(this.adminData));
        this.originalData.foto = this.selectedAvatar;
        this.adminData.contrasena = '';
        this.adminData.confirmarContrasena = '';
        this.isSaving = false;
        alert('Cambios guardados exitosamente');
        this.router.navigate(['/ad-admin']);
      },
      error: (err: BackendErrorResponse) => {
        console.error('Error al actualizar administrador:', err);
        this.error = this.baseEditService.handleError(err);
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
    this.router.navigate(['/ad-admin']);
  }

  onCerrar(): void {
    this.onCancelar();
  }

  getAdminPhoto(foto: string | undefined | null): string {
    if (!foto || foto.trim() === '') {
      return this.defaultAvatar;
    }
    if (!foto.startsWith('assets/')) {
      return `assets/admin/${foto}`;
    }
    return foto;
  }

  validatePasswordStrength(): void {
    const pwd = this.adminData.contrasena;
    this.passwordStrength = {
      hasMinLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[^A-Za-z0-9\s]/.test(pwd)
    };
  }

  get passwordRequirements(): string[] {
    return this.baseEditService.getPasswordRequirements(this.passwordStrength);
  }

  get isPasswordStrong(): boolean {
    return this.passwordStrength.hasMinLength &&
      this.passwordStrength.hasUpperCase &&
      this.passwordStrength.hasLowerCase &&
      this.passwordStrength.hasNumber &&
      this.passwordStrength.hasSpecialChar;
  }
}

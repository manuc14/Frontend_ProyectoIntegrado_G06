import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {AdminService, BackendErrorResponse} from '../../core/services/admin.service';
import { buttonHover, buttonPress, fadeIn } from '../../core/animations/animations';

// Interfaz para los datos del formulario de edición
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
  imports: [CommonModule, NgOptimizedImage, FormsModule],
  templateUrl: './ad-admin-edit.component.html',
  styleUrl: './ad-admin-edit.component.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class AdminAdmsEditPage implements OnInit {
  // ID del administrador a editar
  adminId: string = '';

  // Datos del formulario
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
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    // Obtener el ID del administrador desde la ruta
    this.adminId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.adminId) {
      console.error('No se proporcionó ID de administrador');
      this.router.navigate(['/ad-admin']);
      return;
    }

    // Cargar los datos del administrador
    this.cargarDatosAdministrador();
  }

  /**
   * Carga los datos del administrador desde el backend
   */
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

        // Mapear datos del backend al formulario
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

        // Configurar avatar
        this.selectedAvatar = this.getAdminPhoto(admin.foto);

        // Guardar datos originales para comparación
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

  /**
   * Selecciona un avatar de la galería
   */
  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.adminData.foto = avatar;
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Alterna el estado activo/bloqueado del administrador
   */
  toggleBloquear(): void {
    this.adminData.activo = !this.adminData.activo;
  }

  /**
   * Valida que las contraseñas coincidan
   */
  validatePasswordMatch(): void {
    if (this.adminData.contrasena.trim() !== '' || this.adminData.confirmarContrasena.trim() !== '') {
      this.passwordMismatch = this.adminData.contrasena !== this.adminData.confirmarContrasena;
    } else {
      this.passwordMismatch = false;
    }
  }

  /**
   * Valida la longitud del nombre
   */
  validateNombreLength(): void {
    this.nombreTooLong = this.adminData.nombre.length > 20;
  }

  /**
   * Valida la longitud de los apellidos
   */
  validateApellidosLength(): void {
    this.apellidosTooLong = this.adminData.apellidos.length > 20;
  }

  /**
   * Verifica si hay cambios en el formulario
   */
  hasChanges(): boolean {
    // Comparar todos los campos relevantes
    const dataChanged =
      this.adminData.nombre !== this.originalData.nombre ||
      this.adminData.apellidos !== this.originalData.apellidos ||
      this.adminData.correo !== this.originalData.correo ||
      this.adminData.alias !== this.originalData.alias ||
      this.adminData.departamento !== this.originalData.departamento ||
      this.adminData.foto !== this.originalData.foto ||
      this.adminData.activo !== this.originalData.activo;

    // También considerar si se ha ingresado una nueva contraseña
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

  /**
   * Guarda los cambios realizados
   */
  /**
   * Guarda los cambios realizados
   */
  onGuardarCambios(): void {
    if (this.isSaving) return;

    // Validar datos
    const validacion = this.validarDatos();
    if (!validacion.valido) {
      this.error = validacion.mensaje;
      return;
    }

    this.isSaving = true;
    this.error = null;

    // Preparar datos para enviar al backend
    const updateData: any = {
      nombre: this.adminData.nombre.trim(),
      apellidos: this.adminData.apellidos.trim(),
      correo: this.adminData.correo.trim(),
      alias: this.adminData.alias.trim(),
      departamento: this.adminData.departamento,
      foto: this.selectedAvatar,
      activo: this.adminData.activo
    };

    // Solo incluir contraseña si se modificó
    if (this.adminData.contrasena.trim() !== '') {
      updateData.contrasena = this.adminData.contrasena;
      updateData.confirmarContrasena = this.adminData.confirmarContrasena;
    }

    // Llamar al servicio para actualizar
    this.adminService.editarAdministrador(this.adminId, updateData).subscribe({
      next: (response) => {
        console.log('Administrador actualizado exitosamente:', response);

        // Actualizar datos originales
        this.originalData = JSON.parse(JSON.stringify(this.adminData));
        this.originalData.foto = this.selectedAvatar;

        // Limpiar contraseñas después de guardar
        this.adminData.contrasena = '';
        this.adminData.confirmarContrasena = '';

        this.isSaving = false;

        // Mostrar mensaje de éxito
        alert('Cambios guardados exitosamente');

        // Volver a la lista de administradores
        this.router.navigate(['/ad-admin']);
      },
      error: (err: BackendErrorResponse) => {
        console.error('Error al actualizar administrador:', err);

        // Construir mensaje de error detallado
        let errorMessage = err.message || 'Error al guardar los cambios';

        // Si hay errores de validación, incluirlos en el mensaje
        if (err.errors && err.errors.length > 0) {
          errorMessage += '\nDetalles:\n' + err.errors.map(e => `- ${e.message}`).join('\n');
        } else if (err.details) {
          // Manejar detalles adicionales si los hay
          errorMessage += '\nDetalles: ' + JSON.stringify(err.details);
        }

        this.error = errorMessage;
        this.isSaving = false;
      }
    });
  }

  /**
   * Cancela la edición y vuelve a la lista
   */
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

  /**
   * Cierra la ventana de edición
   */
  onCerrar(): void {
    this.onCancelar();
  }

  /**
   * Obtiene la ruta de la foto del administrador o la foto por defecto
   */
  getAdminPhoto(foto: string | undefined | null): string {
    // Si no hay foto o está vacía, devolver la foto por defecto
    if (!foto || foto.trim() === '') {
      return this.defaultAvatar;
    }

    // Si la foto no incluye la ruta completa, agregarla
    if (!foto.startsWith('assets/')) {
      return `assets/admin/${foto}`;
    }

    // Devolver la foto tal cual si ya tiene la ruta completa
    return foto;
  }

  /**
   * Valida la fortaleza de la contraseña
   */
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

  /**
   * Obtiene los requisitos faltantes de la contraseña
   */
  get passwordRequirements(): string[] {
    const requirements: string[] = [];
    if (!this.passwordStrength.hasMinLength) requirements.push('Mínimo 8 caracteres');
    if (!this.passwordStrength.hasUpperCase) requirements.push('Al menos una mayúscula');
    if (!this.passwordStrength.hasLowerCase) requirements.push('Al menos una minúscula');
    if (!this.passwordStrength.hasNumber) requirements.push('Al menos un dígito');
    if (!this.passwordStrength.hasSpecialChar) requirements.push('Al menos un carácter especial');
    return requirements;
  }

  /**
   * Verifica si la contraseña cumple todos los requisitos
   */
  get isPasswordStrong(): boolean {
    return this.passwordStrength.hasMinLength &&
      this.passwordStrength.hasUpperCase &&
      this.passwordStrength.hasLowerCase &&
      this.passwordStrength.hasNumber &&
      this.passwordStrength.hasSpecialChar;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/admin/default.png';
  }
}

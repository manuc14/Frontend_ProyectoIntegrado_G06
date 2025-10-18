import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, BackendErrorResponse } from '../../core/services/user.service';
import { buttonHover, buttonPress, fadeIn } from '../../core/animations/animations';

// Interfaz para los datos del formulario de edición
interface UserEditData {
  nombre: string;
  apellidos: string;
  alias: string;
  fechaNacimiento: string;
  foto?: string;
  activo: boolean;
}

@Component({
  selector: 'app-ad-users-edit',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule],
  templateUrl: './ad-users-edit.component.html',
  styleUrl: './ad-users-edit.component.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class AdminUsersEditPage implements OnInit {
  userId: string = '';

  userData: UserEditData = {
    nombre: '',
    apellidos: '',
    alias: '',
    fechaNacimiento: '',
    foto: '',
    activo: true
  };

  originalData: UserEditData = {
    nombre: '',
    apellidos: '',
    alias: '',
    fechaNacimiento: '',
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
  selectedAvatar: string = 'assets/admin/default.png';
  defaultAvatar: string = 'assets/admin/default.png';

  isSaving: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;

  nombreTooLong: boolean = false;
  apellidosTooLong: boolean = false;
  aliasTooLong: boolean = false;
  fechaInvalid: boolean = false;
  edadInvalid: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    (async () => {
      this.userId = this.route.snapshot.paramMap.get('id') || '';

      if (!this.userId) {
        console.error('No se proporcionó ID de usuario');
        this.router.navigate(['/ad-users']);
        return;
      }

      this.cargarDatosUsuario();
    })();
  }

  private cargarDatosUsuario(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.listarUsuarios().subscribe({
      next: (users) => {
        const user = users.find(u => u.id === this.userId);

        if (!user) {
          this.error = 'Usuario no encontrado';
          this.router.navigate(['/ad-users']);
          return;
        }

        this.userData = {
          nombre: user.nombre || '',
          apellidos: user.apellidos || '',
          alias: user.alias || '',
          fechaNacimiento: user.fechaNacimiento || '',
          foto: user.foto || '',
          activo: user.activo
        };

        this.selectedAvatar = this.getUserPhoto(user.foto);
        this.originalData = JSON.parse(JSON.stringify(this.userData));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this.error = 'Error al cargar los datos del usuario';
        this.isLoading = false;
      }
    });
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.userData.foto = avatar;
  }

  toggleBloquear(): void {
    this.userData.activo = !this.userData.activo;
  }

  validateNombreLength(): void {
    this.nombreTooLong = this.userData.nombre.length > 20;
  }

  validateApellidosLength(): void {
    this.apellidosTooLong = this.userData.apellidos.length > 20;
  }

  validateAliasLength(): void {
    this.aliasTooLong = this.userData.alias.length > 20;
  }

  validateFechaNacimiento(): void {
    this.fechaInvalid = !this.userData.fechaNacimiento || !this.isValidDate(this.userData.fechaNacimiento);
    if (!this.fechaInvalid) {
      this.edadInvalid = this.calculateAge(this.userData.fechaNacimiento) <= 4;
    } else {
      this.edadInvalid = false;
    }
  }

  private readonly DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  private isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return this.DATE_FORMAT_REGEX.test(dateString) && !isNaN(date.getTime());
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  hasChanges(): boolean {
    return (
      this.userData.nombre !== this.originalData.nombre ||
      this.userData.apellidos !== this.originalData.apellidos ||
      this.userData.alias !== this.originalData.alias ||
      this.userData.fechaNacimiento !== this.originalData.fechaNacimiento ||
      this.userData.foto !== this.originalData.foto ||
      this.userData.activo !== this.originalData.activo
    );
  }

  private validarDatos(): { valido: boolean; mensaje: string } {
    const validateField = (field: string, original: string, validateLength: () => void, isValid: () => boolean, tooLong: boolean, requiredMsg: string, lengthMsg: string) => {
      if (field !== original) {
        validateLength();
        if (!isValid()) return { valido: false, mensaje: requiredMsg };
        if (tooLong) return { valido: false, mensaje: lengthMsg };
      }
      return null;
    };

    const result = validateField(
      this.userData.nombre, this.originalData.nombre,
      () => this.validateNombreLength(),
      () => this.isNombreValid(),
      this.nombreTooLong,
      'El nombre es obligatorio',
      'El nombre no puede superar 20 caracteres'
    );
    if (result) return result;

    const result2 = validateField(
      this.userData.apellidos, this.originalData.apellidos,
      () => this.validateApellidosLength(),
      () => this.isApellidosValid(),
      this.apellidosTooLong,
      'Los apellidos son obligatorios',
      'Los apellidos no pueden superar 20 caracteres'
    );
    if (result2) return result2;

    const result3 = validateField(
      this.userData.alias, this.originalData.alias,
      () => this.validateAliasLength(),
      () => this.isAliasValid(),
      this.aliasTooLong,
      'El alias es obligatorio',
      'El alias no puede superar 20 caracteres'
    );
    if (result3) return result3;

    const result4 = validateField(
      this.userData.fechaNacimiento, this.originalData.fechaNacimiento,
      () => this.validateFechaNacimiento(),
      () => !this.fechaInvalid,
      this.edadInvalid,
      'La fecha de nacimiento no es válida',
      'El usuario debe tener al menos 4 años'
    );
    if (result4) return result4;

    return { valido: true, mensaje: '' };
  }

  private isNombreValid(): boolean {
    return this.userData.nombre.trim().length > 0 && this.userData.nombre.length <= 20;
  }

  private isApellidosValid(): boolean {
    return this.userData.apellidos.trim().length > 0 && this.userData.apellidos.length <= 20;
  }

  private isAliasValid(): boolean {
    return this.userData.alias.trim().length > 0 && this.userData.alias.length <= 20;
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
      nombre: this.userData.nombre.trim(),
      apellidos: this.userData.apellidos.trim(),
      alias: this.userData.alias.trim(),
      fechaNacimiento: this.userData.fechaNacimiento,
      foto: this.selectedAvatar,
      activo: this.userData.activo
    };

    this.userService.editarUsuario(this.userId, updateData).subscribe({
      next: (response) => {
        console.log('Usuario actualizado exitosamente:', response);
        this.originalData = JSON.parse(JSON.stringify(this.userData));
        this.originalData.foto = this.selectedAvatar;
        this.isSaving = false;
        alert('Cambios guardados exitosamente');

        this.router.navigate(['/ad-users']);
      },
      error: (err: BackendErrorResponse) => {
        console.error('Error al actualizar usuario:', err);
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
    this.router.navigate(['/ad-users']);
  }

  onCerrar(): void {
    this.onCancelar();
  }

  getUserPhoto(foto: string | undefined | null): string {
    if (!foto || foto.trim() === '') {
      return this.defaultAvatar;
    }
    if (!foto.startsWith('assets/')) {
      return `assets/admin/${foto}`;
    }
    return foto;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/admin/default.png';
  }
}

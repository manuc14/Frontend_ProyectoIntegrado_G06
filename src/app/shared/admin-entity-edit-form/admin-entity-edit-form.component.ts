import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminEntityService, BackendErrorResponse, AdminEV, UserEV, CreatorEC } from '../../core/services/admin-entity.service';
import { ApiService } from '../../core/services/api.service';
import { fadeIn } from '../../core/animations/animations';
import { ModalHeaderComponent } from '../modal-header/modal-header.component';
import { ErrorContainerComponent } from '../error-container/error-container.component';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { InputFieldComponent } from '../input-field/input-field.component';
import { PasswordFieldComponent } from '../password-field/password-field.component';
import { ConfirmPasswordFieldComponent } from '../confirm-password-field/confirm-password-field.component';
import { TextAreaFieldComponent } from '../textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { ToggleBlockButtonComponent } from '../toggle-block-button/toggle-block-button.component';
import { FormActionsComponent } from '../form-actions/form-actions.component';
import { DateFieldComponent } from '../date-field/date-field.component';
import { BaseEditService } from '../base-edit/base-edit.service';
import { PasswordValidators } from '../../core/validators/form.validators';

export type EntityType = 'admin' | 'creator' | 'user';

interface BaseEntityData {
  nombre: string;
  apellidos: string;
  alias: string;
  foto?: string;
  activo: boolean;
}

interface AdminEntityData extends BaseEntityData {
  correo: string;
  departamento: string;
  contrasena: string;
  confirmarContrasena: string;
}

interface CreatorEntityData extends BaseEntityData {
  correo: string;
  descripcion: string;
  especialidad: string;
  contrasena: string;
  confirmarContrasena: string;
  tipoContenido: string;
}

interface UserEntityData extends BaseEntityData {
  fechaNacimiento: string;
}

type EntityData = AdminEntityData | CreatorEntityData | UserEntityData;

@Component({
  selector: 'app-admin-entity-edit-form',
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
    DateFieldComponent
  ],
  templateUrl: './admin-entity-edit-form.component.html',
  styleUrl: './admin-entity-edit-form.component.scss',
  animations: [fadeIn]
})
export class AdminEntityEditFormComponent implements OnInit {
  @Input() entityType: EntityType = 'admin';
  @Input() entityId: string = '';

  entityData: EntityData = {} as EntityData;
  originalData: EntityData = {} as EntityData;

  availableAvatars: string[] = [];
  isLoadingAvatars: boolean = false;
  avatarLoadError: boolean = false;
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
  fechaInvalid: boolean = false;
  edadInvalid: boolean = false;

  passwordStrength = {
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  get passwordRequirements(): string[] {
    const requirements: string[] = [];
    if (!this.passwordStrength.hasMinLength) requirements.push('Mínimo 8 caracteres');
    if (!this.passwordStrength.hasUpperCase) requirements.push('Al menos una mayúscula');
    if (!this.passwordStrength.hasLowerCase) requirements.push('Al menos una minúscula');
    if (!this.passwordStrength.hasNumber) requirements.push('Al menos un dígito');
    if (!this.passwordStrength.hasSpecialChar) requirements.push('Al menos un carácter especial');
    return requirements;
  }

  // Opciones específicas
  departamentos = [
    'Operaciones','Seguridad','Marketing','Soporte','Recursos Humanos','Finanzas','Desarrollo','Legal'
  ];

  especialidades = [
    'Música','Educación','Tecnología','Cocina','Deportes','Arte','Ciencia','Viajes'
  ];

  // Type guards
  isAdmin(data: EntityData): data is AdminEntityData {
    return 'departamento' in data;
  }

  isCreator(data: EntityData): data is CreatorEntityData {
    return 'descripcion' in data;
  }

  isUser(data: EntityData): data is UserEntityData {
    return 'fechaNacimiento' in data;
  }

  // Getters for type-safe access
  get adminData(): AdminEntityData {
    return this.entityData as AdminEntityData;
  }

  get creatorData(): CreatorEntityData {
    return this.entityData as CreatorEntityData;
  }

  get userData(): UserEntityData {
    return this.entityData as UserEntityData;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adminEntityService: AdminEntityService,
    private baseEditService: BaseEditService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // Verificar que haya token en sessionStorage
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) {
      this.router.navigate(['/login']);
      return;
    }
    // Continuar con la inicialización
    this.initializeEntity();
  }

  private initializeEntity(): void {
    if (!this.entityId) {
      this.entityId = this.route.snapshot.paramMap.get('id') ?? '';
      if (!this.entityId) {
        console.error('No se proporcionó ID de entidad');
        this.navigateBack();
        return;
      }
    }
    this.initializeData();
    this.loadAvatars();
    this.loadEntityData();
  }

  private initializeData() {
    switch (this.entityType) {
      case 'admin':
        this.entityData = {
          nombre: '',
          apellidos: '',
          alias: '',
          correo: '',
          departamento: '',
          contrasena: '',
          confirmarContrasena: '',
          foto: '',
          activo: true
        } as AdminEntityData;
        this.originalData = { ...this.entityData };
        break;
      case 'creator':
        this.entityData = {
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
        } as CreatorEntityData;
        this.originalData = { ...this.entityData };
        break;
      case 'user':
        this.entityData = {
          nombre: '',
          apellidos: '',
          alias: '',
          fechaNacimiento: '',
          foto: '',
          activo: true
        } as UserEntityData;
        this.originalData = { ...this.entityData };
        break;
    }
  }

  private navigateBack() {
    switch (this.entityType) {
      case 'admin':
        this.router.navigate(['/ad-admin']);
        break;
      case 'creator':
        this.router.navigate(['/ad-creators']);
        break;
      case 'user':
        this.router.navigate(['/ad-users']);
        break;
    }
  }

  loadAvatars(): void {
    this.isLoadingAvatars = true;
    this.avatarLoadError = false;
    this.api.getAvatars().subscribe({
      next: (resp: any) => {
        this.availableAvatars = resp.avatars || [];
        if (resp.defaultAvatar) this.defaultAvatar = resp.defaultAvatar;
      },
      error: (err: any) => {
        console.error('Error loading avatars:', err);
        this.avatarLoadError = true;
        this.availableAvatars = [];
      },
      complete: () => {
        this.isLoadingAvatars = false;
      }
    });
  }

  loadEntityData(): void {
    this.isLoading = true;
    switch (this.entityType) {
      case 'admin':
        this.adminEntityService.listarAdministradores().subscribe({
          next: (admins: AdminEV[]) => {
            const admin = admins.find(a => a.id === this.entityId);
            if (!admin) {
              this.error = 'Administrador no encontrado';
              this.navigateBack();
              return;
            }
            this.entityData = {
              nombre: admin.nombre ?? '',
              apellidos: admin.apellidos ?? '',
              alias: admin.alias ?? '',
              correo: admin.correo ?? '',
              departamento: admin.departamento ?? '',
              contrasena: '',
              confirmarContrasena: '',
              foto: admin.foto ?? '',
              activo: admin.activo ?? true
            } as AdminEntityData;
            this.originalData = { ...this.entityData };
            this.selectedAvatar = this.entityData.foto || '';
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error loading admin:', err);
            this.error = this.baseEditService.handleError(err);
            this.isLoading = false;
          }
        });
        break;
      case 'creator':
        this.adminEntityService.listarCreadores().subscribe({
          next: (creators: CreatorEC[]) => {
            const creator = creators.find(c => c.id === this.entityId);
            if (!creator) {
              this.error = 'Creador no encontrado';
              this.navigateBack();
              return;
            }
            this.entityData = {
              nombre: creator.nombre ?? '',
              apellidos: creator.apellidos ?? '',
              correo: creator.correo ?? '',
              alias: creator.alias ?? '',
              descripcion: creator.descripcion ?? '',
              especialidad: creator.especialidad ?? '',
              contrasena: '',
              confirmarContrasena: '',
              foto: creator.foto ?? '',
              activo: creator.activo ?? true,
              tipoContenido: creator.tipoContenido ?? 'VIDEO'
            } as CreatorEntityData;
            this.originalData = { ...this.entityData };
            this.selectedAvatar = this.entityData.foto || '';
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error loading creator:', err);
            this.error = this.baseEditService.handleError(err);
            this.isLoading = false;
          }
        });
        break;
      case 'user':
        this.adminEntityService.listarUsuarios().subscribe({
          next: (users: UserEV[]) => {
            const user = users.find(u => u.id === this.entityId);
            if (!user) {
              this.error = 'Usuario no encontrado';
              this.navigateBack();
              return;
            }
            this.entityData = {
              nombre: user.nombre ?? '',
              apellidos: user.apellidos ?? '',
              alias: user.alias ?? '',
              fechaNacimiento: user.fechaNacimiento ?? '',
              foto: user.foto ?? '',
              activo: user.activo ?? true
            } as UserEntityData;
            this.originalData = { ...this.entityData };
            this.selectedAvatar = this.entityData.foto || '';
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error loading user:', err);
            this.error = this.baseEditService.handleError(err);
            this.isLoading = false;
          }
        });
        break;
    }
  }

  onAvatarSelected(avatar: string): void {
    this.selectedAvatar = avatar;
    this.entityData.foto = avatar;
  }

  onTipoContenidoChanged(tipo: string): void {
    if (this.entityType === 'creator') {
      (this.entityData as CreatorEntityData).tipoContenido = tipo;
    }
  }

  validateForm(): boolean {
    this.nombreTooLong = this.entityData.nombre.length > 50;
    this.apellidosTooLong = this.entityData.apellidos.length > 50;
    this.aliasTooLong = this.entityData.alias.length > 20;
    if (this.entityType === 'creator') {
      this.descripcionTooLong = (this.entityData as CreatorEntityData).descripcion.length > 500;
    }
    if (this.entityType === 'user') {
      this.fechaInvalid = !this.isValidDate((this.entityData as UserEntityData).fechaNacimiento);
      this.edadInvalid = !this.isValidAge((this.entityData as UserEntityData).fechaNacimiento);
    }
    if (this.entityType === 'admin' || this.entityType === 'creator') {
      this.passwordMismatch = (this.entityData as AdminEntityData | CreatorEntityData).contrasena !== (this.entityData as AdminEntityData | CreatorEntityData).confirmarContrasena;
    }

    return !this.nombreTooLong && !this.apellidosTooLong && !this.aliasTooLong &&
           !(this.entityType === 'creator' && this.descripcionTooLong) &&
           !(this.entityType === 'user' && (this.fechaInvalid || this.edadInvalid)) &&
           !( (this.entityType === 'admin' || this.entityType === 'creator') && this.passwordMismatch );
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private isValidAge(dateString: string): boolean {
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 120;
  }

  checkPasswordStrength(): void {
    if (this.entityType === 'admin' || this.entityType === 'creator') {
      const password = (this.entityData as AdminEntityData | CreatorEntityData).contrasena;
      this.passwordStrength.hasMinLength = password.length >= 8;
      this.passwordStrength.hasUpperCase = PasswordValidators.hasUpperCase({ value: password } as any) === null;
      this.passwordStrength.hasLowerCase = PasswordValidators.hasLowerCase({ value: password } as any) === null;
      this.passwordStrength.hasNumber = PasswordValidators.hasNumber({ value: password } as any) === null;
      this.passwordStrength.hasSpecialChar = PasswordValidators.hasSpecialChar({ value: password } as any) === null;
    }
  }

  saveChanges(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    this.error = null;

    const changes = this.getChanges();

    switch (this.entityType) {
      case 'admin':
        this.adminEntityService.editarAdministrador(this.entityId, changes).subscribe({
          next: () => {
            this.originalData = { ...this.entityData };
            this.isSaving = false;
            this.navigateBack();
          },
          error: (err: BackendErrorResponse) => {
            this.error = this.baseEditService.handleError(err);
            this.isSaving = false;
          }
        });
        break;
      case 'creator':
        this.adminEntityService.editarCreador(this.entityId, changes).subscribe({
          next: () => {
            this.originalData = { ...this.entityData };
            this.isSaving = false;
            this.navigateBack();
          },
          error: (err: BackendErrorResponse) => {
            this.error = this.baseEditService.handleError(err);
            this.isSaving = false;
          }
        });
        break;
      case 'user':
        this.adminEntityService.editarUsuario(this.entityId, changes).subscribe({
          next: () => {
            this.originalData = { ...this.entityData };
            this.isSaving = false;
            this.navigateBack();
          },
          error: (err: BackendErrorResponse) => {
            this.error = this.baseEditService.handleError(err);
            this.isSaving = false;
          }
        });
        break;
    }
  }

  private getChanges(): any {
    const changes: any = {};

    // Incluir siempre los campos obligatorios para cada tipo de entidad
    switch (this.entityType) {
      case 'admin':
        changes.nombre = this.entityData.nombre;
        changes.apellidos = this.entityData.apellidos;
        changes.departamento = (this.entityData as AdminEntityData).departamento;
        changes.activo = this.entityData.activo;
        break;
      case 'creator':
        changes.nombre = this.entityData.nombre;
        changes.apellidos = this.entityData.apellidos;
        changes.descripcion = (this.entityData as CreatorEntityData).descripcion;
        changes.especialidad = (this.entityData as CreatorEntityData).especialidad;
        changes.alias = this.entityData.alias;
        changes.activo = this.entityData.activo;
        break;
      case 'user':
        changes.nombre = this.entityData.nombre;
        changes.apellidos = this.entityData.apellidos;
        changes.fechaNacimiento = (this.entityData as UserEntityData).fechaNacimiento;
        changes.activo = this.entityData.activo;
        break;
    }

    // Agregar campos adicionales que han cambiado
    for (const key in this.entityData) {
      if ((this.entityData as any)[key] !== (this.originalData as any)[key]) {
        changes[key] = (this.entityData as any)[key];
      }
    }

    return changes;
  }

  cancel(): void {
    this.navigateBack();
  }

  hasChanges(): boolean {
    return JSON.stringify(this.entityData) !== JSON.stringify(this.originalData);
  }

  isPasswordStrong(): boolean {
    return this.passwordStrength.hasMinLength &&
      this.passwordStrength.hasUpperCase &&
      this.passwordStrength.hasLowerCase &&
      this.passwordStrength.hasNumber &&
      this.passwordStrength.hasSpecialChar;
  }

  get contrasena(): string {
    if (this.isAdmin(this.entityData) || this.isCreator(this.entityData)) {
      return this.entityData.contrasena;
    }
    return '';
  }

  set contrasena(value: string) {
    if (this.isAdmin(this.entityData) || this.isCreator(this.entityData)) {
      this.entityData.contrasena = value;
    }
  }

  get confirmarContrasena(): string {
    if (this.isAdmin(this.entityData) || this.isCreator(this.entityData)) {
      return this.entityData.confirmarContrasena;
    }
    return '';
  }

  set confirmarContrasena(value: string) {
    if (this.isAdmin(this.entityData) || this.isCreator(this.entityData)) {
      this.entityData.confirmarContrasena = value;
    }
  }

  getTitle(): string {
    switch (this.entityType) {
      case 'admin': return 'Editar administrador';
      case 'creator': return 'Editar creador de contenido';
      case 'user': return 'Editar usuario';
      default: return 'Editar entidad';
    }
  }

  onCerrar(): void {
    this.cancel();
  }
}
import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, CurrentUser, UserRole } from '../../../core/services/auth.service';

export interface MenuOption {
  iconSvg: string;
  label: string;
  action: () => void;
}

// Nueva interfaz que define la configuración del menú por rol
export interface RoleMenuConfig {
  homeRoute: string;
  profileRoute: string;
  additionalOptions: MenuOption[];
}

/**
 * Componente de menú desplegable de usuario
 * Reutilizable en todos los headers con opciones específicas según rol
 */
@Component({
  selector: 'app-user-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dropdown-menu.component.html',
  styleUrls: ['./user-dropdown-menu.component.scss']
})
export class UserDropdownMenuComponent implements OnInit {
  @Input() currentUser: CurrentUser | null = null;
  @Input() avatarUrl: string = 'assets/admin/admin_default.png';
  @Output() logoutEvent = new EventEmitter<void>();

  isDropdownOpen = false;
  menuOptions: MenuOption[] = [];

  // Mapeo directo de rutas por rol - simplificado
  private readonly roleRoutes: Record<UserRole, { home: string; profile: string }> = {
    user: {home: '/catalog', profile: '/my-lists'},
    creator: {home: '/content-creator', profile: '/profile'},
    admin: {home: '/ad-users', profile: '/profile'}
  }

  private readonly roleMenuConfigs: Record<UserRole, RoleMenuConfig> = {
    user: {
      homeRoute: '/catalog',
      profileRoute: '/user-consultprofile',
      additionalOptions: []
    },
    creator: {
      homeRoute: '/content-creator',
      profileRoute: '/content-creator-consultprofile',
      additionalOptions: [
        {
          iconSvg: 'upload',
          label: 'Subir contenido',
          action: () => this.navigate('/upload-content')
        },
        {
          iconSvg: 'list',
          label: 'Crear lista',
          action: () => this.navigate('/create-list')
        }
      ]
    },
    admin: {
      homeRoute: '/ad-users',
      profileRoute: '/ad-consultprofile',
      additionalOptions: []
    }
  };

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.menuOptions = this.buildMenuOptions();
  }

  private buildMenuOptions(): MenuOption[] {
    const role = this.currentUser?.rol ?? 'user';
    const routes = this.roleRoutes[role];

    // Opciones base (comunes para todos)
    const baseOptions: MenuOption[] = [
      { iconSvg: 'home', label: 'Inicio', action: () => this.navigate(routes.home) },
      { iconSvg: 'user', label: 'Mi perfil', action: () => this.navigate(routes.profile) }
    ];

    // Opción de logout
    const logoutOption: MenuOption = {
      iconSvg: 'logout',
      label: 'Cerrar sesión',
      action: () => this.logout()
    };

    return [...baseOptions, logoutOption];
  }

  private navigate(route: string) {
    this.isDropdownOpen = false;
    this.router.navigate([route]);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const isOutside = !(event.target as HTMLElement).closest('.user-dropdown-container');

    // Early return if click is inside dropdown
    if (!isOutside) return;

    this.isDropdownOpen = false;
  }

  executeMenuAction(option: MenuOption) {
    option.action();
  }

  logout() {
    this.isDropdownOpen = false;
    this.logoutEvent.emit();
    this.authService.logout(true);
  }

  getUserDisplayName(): string {
    return this.currentUser ? `@${this.currentUser.nombre?.toLowerCase() ?? 'usuario'}` : 'Usuario';
  }

  getUserEmail(): string {
    return this.currentUser?.email ?? 'usuario@esimedia.com';
  }

  isLogoutOption(option: MenuOption): boolean {
    return option.iconSvg === 'logout';
  }
}

import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, CurrentUser, UserRole } from '../../../core/services/auth.service';

export interface MenuOption {
  iconSvg: string;
  label: string;
  action: () => void;
}

interface RoleMenuConfig {
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

  private readonly roleMenuConfigs: Record<UserRole, RoleMenuConfig> = {
    user: {
      homeRoute: '/catalog',
      profileRoute: '/profile',
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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.buildMenuOptions();
  }

  private buildMenuOptions() {
    const config = this.getMenuConfig();
    
    this.menuOptions = [
      {
        iconSvg: 'home',
        label: 'Inicio',
        action: () => this.navigate(config.homeRoute)
      },
      {
        iconSvg: 'user',
        label: 'Mi perfil',
        action: () => this.navigate(config.profileRoute)
      },
      ...config.additionalOptions,
      {
        iconSvg: 'logout',
        label: 'Cerrar sesión',
        action: () => this.logout()
      }
    ];
  }

  private getMenuConfig(): RoleMenuConfig {
    const userRole = this.currentUser?.rol || 'user';
    return this.roleMenuConfigs[userRole];
  }

  private navigate(route: string) {
    this.closeDropdown();
    this.router.navigate([route]);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.closeDropdown();
    }
  }

  executeMenuAction(option: MenuOption) {
    option.action();
  }

  logout() {
    this.closeDropdown();
    this.logoutEvent.emit();
    this.authService.logout(true);
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Usuario';
    return `@${this.currentUser.nombre?.toLowerCase() || 'usuario'}`;
  }

  getUserEmail(): string {
    return this.currentUser?.email || 'usuario@esimedia.com';
  }

  isLogoutOption(option: MenuOption): boolean {
    return option.iconSvg === 'logout';
  }
}

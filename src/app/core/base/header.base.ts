import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ImageSelectorService } from '../services/image-selector.service';
import { AuthService } from '../services/auth.service';

export abstract class HeaderBase {
  currentUser: any = null; // Flexible para BackendUser o CurrentUser
  protected router!: Router;
  protected apiService!: ApiService;
  protected imageSelectorService!: ImageSelectorService;
  protected authService!: AuthService;

  protected loadCurrentUser() {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing current user data:', error);
      }
    }
  }

  getAvatarUrl(): string {
    if (this.currentUser?.foto) {
      return this.imageSelectorService.getFullImageUrl('/avatars/' + this.currentUser.foto, 'avatar');
    }
    return 'assets/admin/admin_default.png';
  }

  protected logout() {
    // Usar AuthService que maneja correctamente:
    // 1. Llamada al backend para invalidar refresh token
    // 2. Limpieza de localStorage (refreshToken)
    // 3. Limpieza de sessionStorage (accessToken, currentUser)
    // 4. Detener temporizadores de sesión
    // 5. Redirigir a login
    this.authService.logout();
  }
}
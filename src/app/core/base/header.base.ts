import { Router } from '@angular/router';
import { BackendUser, ApiService } from '../services/api.service';
import { ImageSelectorService } from '../services/image-selector.service';

export abstract class HeaderBase {
  currentUser: BackendUser | null = null;
  protected router!: Router;
  protected apiService!: ApiService;
  protected imageSelectorService!: ImageSelectorService;

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
      return this.imageSelectorService.getFullImageUrl(this.currentUser.foto, 'avatar');
    }
    return 'assets/admin/admin_default.png';
  }

  protected logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.currentUser = null;
    this.router.navigate(['/login']);
  }
}
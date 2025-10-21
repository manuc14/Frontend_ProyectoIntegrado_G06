import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BackendUser, ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-content-creator-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-creator-header.component.html',
  styleUrls: ['./content-creator-header.component.scss']
})
export class ContentCreatorHeaderComponent implements OnInit {

  currentUser: BackendUser | null = null;
  isOnUploadPage = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.checkCurrentRoute();
    
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute() {
    this.isOnUploadPage = this.router.url === '/upload-content';
  }

  private loadCurrentUser() {
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
        return this.currentUser.foto;
    }
    return 'assets/admin/admin_default.png';
  }

  navigateToUpload() {
    this.router.navigate(['/upload-content']);
  }

  logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
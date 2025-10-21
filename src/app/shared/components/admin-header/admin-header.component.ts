import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { slideInFromTop } from '../../../core/animations/animations';
import { BackendUser, ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
  ,
  animations: [slideInFromTop]
})
export class AdminHeaderComponent implements OnInit {
  @Input() sidebarVisible = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: BackendUser | null = null;

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadCurrentUser();
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


  onToggle() {
    this.toggleSidebar.emit();
  }

  logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}

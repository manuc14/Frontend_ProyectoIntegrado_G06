import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { slideInFromTop } from '../../../core/animations/animations';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ImageSelectorService } from '../../../core/services/image-selector.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderBase } from '../../../core/base/header.base';
import { UserDropdownMenuComponent } from '../user-dropdown-menu/user-dropdown-menu.component';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, UserDropdownMenuComponent],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
  animations: [slideInFromTop]
})
export class AdminHeaderComponent extends HeaderBase implements OnInit {
  @Input() sidebarVisible = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    router: Router,
    apiService: ApiService,
    imageSelectorService: ImageSelectorService,
    authService: AuthService
  ) {
    super();
    this.router = router;
    this.apiService = apiService;
    this.imageSelectorService = imageSelectorService;
    this.authService = authService;
  }

  ngOnInit() {
    this.loadCurrentUser();
  }

  onToggle() {
    this.toggleSidebar.emit();
  }

  override logout() {
    this.authService.logout(true);
  }
}

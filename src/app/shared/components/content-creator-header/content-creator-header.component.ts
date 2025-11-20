import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ImageSelectorService } from '../../../core/services/image-selector.service';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderBase } from '../../../core/base/header.base';
import { UserDropdownMenuComponent } from '../user-dropdown-menu/user-dropdown-menu.component';

@Component({
  selector: 'app-content-creator-header',
  standalone: true,
  imports: [CommonModule, UserDropdownMenuComponent],
  templateUrl: './content-creator-header.component.html',
  styleUrls: ['./content-creator-header.component.scss'],
  host: {
    '(document:click)': 'onClickOutside($event)'
  }
})
export class ContentCreatorHeaderComponent extends HeaderBase implements OnInit {
  isCreateDropdownOpen = false;

  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
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

  override logout() {
    this.authService.logout(true);
  }

  toggleCreateDropdown() {
    this.isCreateDropdownOpen = !this.isCreateDropdownOpen;
  }

  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isInsideDropdown = target.closest('.create-dropdown-container');
    if (!isInsideDropdown) {
      this.isCreateDropdownOpen = false;
    }
  }

  navigateToUploadContent() {
    this.isCreateDropdownOpen = false;
    this.router.navigate(['/upload-content']);
  }

  navigateToCreateList() {
    this.isCreateDropdownOpen = false;
    this.router.navigate(['/create-list']);
  }
}
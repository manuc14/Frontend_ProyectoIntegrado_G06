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
  styleUrls: ['./content-creator-header.component.scss']
})
export class ContentCreatorHeaderComponent extends HeaderBase implements OnInit {

  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    apiService: ApiService,
    imageSelectorService: ImageSelectorService,
    private authService: AuthService
  ) {
    super();
    this.router = router;
    this.apiService = apiService;
    this.imageSelectorService = imageSelectorService;
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user as any;
    }
  }

  override logout() {
    this.authService.logout(true);
  }
}
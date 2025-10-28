import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ImageSelectorService } from '../../../core/services/image-selector.service';
import { HeaderBase } from '../../../core/base/header.base';

@Component({
  selector: 'app-content-creator-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-creator-header.component.html',
  styleUrls: ['./content-creator-header.component.scss']
})
export class ContentCreatorHeaderComponent extends HeaderBase implements OnInit {

  isOnUploadPage = false;

  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    apiService: ApiService,
    imageSelectorService: ImageSelectorService
  ) {
    super();
    this.router = router;
    this.apiService = apiService;
    this.imageSelectorService = imageSelectorService;
  }

  ngOnInit() {
    super.loadCurrentUser();
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

  navigateToUpload() {
    this.router.navigate(['/upload-content']);
  }

  override logout() {
    super.logout();
  }
}
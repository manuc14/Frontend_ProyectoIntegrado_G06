import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adcreatorsaddsuccess',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-creators-add-success.component.html',
  styleUrl: './ad-creators-add-success.component.scss',
})
export class AdminCreatorsAddSuccessPage {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/ad-creators']);
  }
}

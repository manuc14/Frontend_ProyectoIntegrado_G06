import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adadminaddsuccess',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-admin-add-success.component.html',
  styleUrl: './ad-admin-add-success.component.scss',
})
export class AdminAdmsAddSuccessPage {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/ad-admin']);
  }
}

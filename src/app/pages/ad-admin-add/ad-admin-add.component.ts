import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-adadminadd',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-admin-add.component.html',
  styleUrl: './ad-admin-add.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class AdminAdmsAddPage {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/ad-admin']);
  }
}

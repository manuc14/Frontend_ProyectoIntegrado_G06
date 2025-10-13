import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-adcreatorsadd',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-creators-add.component.html',
  styleUrl: './ad-creators-add.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})

export class AdminCreatorsAddPage {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/ad-creators']);
  }
}

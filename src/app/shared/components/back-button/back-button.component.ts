import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  @Input() label: string = 'Volver';
  @Input() navigateTo?: string; // Ruta opcional para navegar
  @Output() onClick = new EventEmitter<void>();

  constructor(private router: Router) {}

  handleClick(): void {
    if (this.onClick.observed) {
      this.onClick.emit();
    } else if (this.navigateTo) {
      this.router.navigate([this.navigateTo]);
    } else {
      window.history.back();
    }
  }
}

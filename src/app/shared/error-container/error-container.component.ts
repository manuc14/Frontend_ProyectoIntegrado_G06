import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-container.component.html',
  styleUrl: './error-container.component.scss'
})
export class ErrorContainerComponent {
  @Input() error: string | null = null;
}

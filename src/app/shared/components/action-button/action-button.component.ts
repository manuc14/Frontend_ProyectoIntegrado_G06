import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActionButtonVariant = 'primary' | 'secondary' | 'icon';
export type ActionButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent {
  @Input() label?: string;
  @Input() icon?: string; // SVG path o nombre del ícono
  @Input() variant: ActionButtonVariant = 'primary';
  @Input() size: ActionButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled) {
      this.onClick.emit();
    }
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-password-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-password-field.component.html',
  styleUrl: './confirm-password-field.component.scss'
})
export class ConfirmPasswordFieldComponent {
  @Input() confirmValue: string = '';
  @Input() showConfirmPassword: boolean = false;
  @Input() passwordMismatch: boolean = false;
  @Input() label: string = 'Repetir contraseña';
  @Input() placeholder: string = '••••••••';
  @Output() confirmValueChange = new EventEmitter<string>();
  @Output() visibilityToggle = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  onBlur(): void {
    this.blur.emit();
  }

  toggleVisibility(): void {
    this.visibilityToggle.emit();
  }

  onInput(): void {
    this.confirmValueChange.emit(this.confirmValue);
  }
}

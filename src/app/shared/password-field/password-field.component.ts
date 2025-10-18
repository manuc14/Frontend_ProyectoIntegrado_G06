import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-field.component.html',
  styleUrl: './password-field.component.scss'
})
export class PasswordFieldComponent {
  @Input() value: string = '';
  @Input() showPassword: boolean = false;
  @Input() label: string = 'Contraseña';
  @Input() placeholder: string = '••••••••';
  @Input() error: boolean = false;
  @Input() passwordRequirements: string[] = [];
  @Input() isPasswordStrong: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<void>();
  @Output() visibilityToggle = new EventEmitter<void>();

  onInput(): void {
    this.valueChange.emit(this.value);
    this.input.emit();
  }

  toggleVisibility(): void {
    this.visibilityToggle.emit();
  }
}

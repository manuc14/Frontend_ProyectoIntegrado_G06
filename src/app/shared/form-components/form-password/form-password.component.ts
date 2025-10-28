import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-password.component.html',
  styleUrls: ['./form-password.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormPasswordComponent),
      multi: true
    }
  ]
})
export class FormPasswordComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() customClass: string = '';
  @Input() showTooltip: boolean = true;
  @Input() showHelpButton: boolean = true;
  @Input() errors: ValidationErrors | null = null;
  @Input() touched: boolean = false;

  @Output() focus = new EventEmitter<string>();
  @Output() blur = new EventEmitter<string>();
  @Output() toggleTooltip = new EventEmitter<void>();

  value: string = '';
  disabled: boolean = false;

  onChange = (value: string) => {};
  onTouched = () => {};

  showPassword: boolean = false;

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleVisibility() {
    this.showPassword = !this.showPassword;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
  }

  onFocus() {
    this.focus.emit(this.label);
  }

  onBlur() {
    this.blur.emit(this.label);
    this.onTouched();
  }

  onToggleTooltip() {
    this.toggleTooltip.emit();
  }
}
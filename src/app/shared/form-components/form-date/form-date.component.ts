import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-date',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-date.component.html',
  styleUrls: ['./form-date.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormDateComponent),
      multi: true
    }
  ]
})
export class FormDateComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() customClass: string = '';
  @Input() errors: ValidationErrors | null = null;
  @Input() touched: boolean = false;
  @Input() showAsterisk: boolean = true;

  @Output() focus = new EventEmitter<string>();
  @Output() blur = new EventEmitter<string>();

  value: string = '';
  disabled: boolean = false;

  onChange = (value: string) => {};
  onTouched = () => {};

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
}
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-toggle.component.html',
  styleUrls: ['./form-toggle.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormToggleComponent),
      multi: true
    }
  ]
})
export class FormToggleComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: { value: any; label: string }[] = [];
  @Input() customClass: string = '';
  @Input() hint: string = '';
  @Input() name: string = 'radio-group';
  @Input() errors: ValidationErrors | null = null;
  @Input() touched: boolean = false;

  value: any;
  disabled: boolean = false;

  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChangeValue(value: any): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }
}
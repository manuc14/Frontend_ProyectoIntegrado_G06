import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true
    }
  ]
})
export class DateFieldComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() fechaInvalid: boolean = false;
  @Input() edadInvalid: boolean = false;
  @Input() required: boolean = false;
  @Input() minDate: string = '';
  @Input() errorMessage: string = '';

  private _value: string = '';
  disabled: boolean = false;

  @Input()
  set value(val: string) {
    this._value = val;
    this.onChange(val);
  }

  get value(): string {
    return this._value;
  }

  private onChange = (value: any) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    this._value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: any): void {
    this._value = event.target.value;
    this.onChange(this._value);
    this.onTouched();
  }
}

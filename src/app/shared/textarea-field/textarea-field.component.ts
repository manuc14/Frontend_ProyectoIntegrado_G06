import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea-field.component.html',
  styleUrl: './textarea-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaFieldComponent),
      multi: true
    }
  ]
})
export class TextAreaFieldComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() errorMessage: string = '';
  @Input() tooLong: boolean = false;
  @Input() maxlength: string = '';

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

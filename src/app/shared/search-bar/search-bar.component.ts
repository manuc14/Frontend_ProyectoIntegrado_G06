import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchBarComponent),
      multi: true
    }
  ]
})
export class SearchBarComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Buscar...';
  @Input() searchTerm: string = '';
  @Input() disabled: boolean = false;
  @Input() ariaLabel: string = 'Campo de búsqueda';
  
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onSearch(): void {
    this.search.emit(this.searchTerm);
    this.onChange(this.searchTerm);
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
    this.clear.emit();
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.searchTerm = value || '';
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
}
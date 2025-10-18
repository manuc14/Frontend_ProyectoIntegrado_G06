import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss'
})
export class InputFieldComponent {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() errorMessage: string = '';
  @Input() tooLong: boolean = false;
  @Input() required: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<void>();
  @Output() tooLongChange = new EventEmitter<boolean>();

  onInput(): void {
    this.valueChange.emit(this.value);
    this.input.emit();
  }
}

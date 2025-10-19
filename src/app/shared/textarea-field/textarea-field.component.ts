import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea-field.component.html',
  styleUrl: './textarea-field.component.scss'
})
export class TextAreaFieldComponent {
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() errorMessage: string = '';
  @Input() tooLong: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<void>();
  @Output() tooLongChange = new EventEmitter<boolean>();

  onInput(): void {
    this.valueChange.emit(this.value);
    this.input.emit();
  }
}

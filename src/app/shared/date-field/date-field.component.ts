import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss'
})
export class DateFieldComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() fechaInvalid: boolean = false;
  @Input() edadInvalid: boolean = false;
  @Input() required: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<void>();
  @Output() fechaInvalidChange = new EventEmitter<boolean>();
  @Output() edadInvalidChange = new EventEmitter<boolean>();

  onInput(): void {
    this.valueChange.emit(this.value);
    this.input.emit();
  }
}

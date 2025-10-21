import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss'
})
export class SelectFieldComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onChange(): void {
    this.valueChange.emit(this.value);
  }
}

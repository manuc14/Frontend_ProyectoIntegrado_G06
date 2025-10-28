import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-form-submit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form-submit.component.html',
  styleUrls: ['./form-submit.component.scss']
})
export class FormSubmitComponent {
  @Input() text: string = 'Enviar';
  @Input() loadingText: string = 'Enviando…';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';
  @Input() cancelLink: string = '/';
  @Input() cancelText: string = 'Cancelar';
  @Input() showCancel: boolean = true;

  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onSubmit() {
    if (!this.disabled && !this.loading) {
      this.submit.emit();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
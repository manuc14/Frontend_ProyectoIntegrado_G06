import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal genérico reutilizable para mostrar mensajes informativos
 * Basado en el diseño del session-timeout-modal
 */
@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="confirm()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon" [ngClass]="'modal-icon--' + iconType">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <!-- Icono de advertencia -->
            <path *ngIf="iconType === 'warning'" 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" 
                  fill="currentColor"/>
            <!-- Icono de info -->
            <path *ngIf="iconType === 'info'" 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" 
                  fill="currentColor"/>
            <!-- Icono de error -->
            <path *ngIf="iconType === 'error'" 
                  d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" 
                  fill="currentColor"/>
          </svg>
        </div>
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button
            type="button"
            class="btn primary"
            (click)="confirm()">
            {{ buttonText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-icon {
      margin-bottom: 16px;
    }

    .modal-icon--warning {
      color: #f59e0b;
    }

    .modal-icon--info {
      color: #3b82f6;
    }

    .modal-icon--error {
      color: #ef4444;
    }

    .modal-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .modal-message {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
    }

    .btn {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.primary {
        background: #2563eb;

        &:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class InfoModalComponent {
  @Input() title: string = 'Información';
  @Input() message: string = '';
  @Input() buttonText: string = 'Entendido';
  @Input() iconType: 'warning' | 'info' | 'error' = 'info';
  @Input() isVisible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  confirm(): void {
    this.closed.emit();
  }
}

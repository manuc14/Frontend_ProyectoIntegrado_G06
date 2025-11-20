import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon" [ngClass]="iconClass">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path *ngIf="!isWarning" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            <path *ngIf="isWarning" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">{{ message }}</p>
        <button class="modal-button" [ngClass]="buttonClass" (click)="close()">{{ buttonText }}</button>
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

      &.timeout {
        color: #f59e0b;
      }

      &.warning {
        color: #ef4444;
      }
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

    .modal-button {
      border: none;
      border-radius: 8px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;

      &.primary {
        background: #2563eb;
        color: white;

        &:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
      }

      &.danger {
        background: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class SessionTimeoutModalComponent {
  @Input() title: string = 'Sesión Expirada';
  @Input() message: string = 'Tu sesión ha expirado';
  @Input() isVisible: boolean = false;
  @Input() buttonText: string = 'Iniciar Sesión';
  @Input() isWarning: boolean = false; // true = warning icon (red), false = timeout icon (orange)
  @Output() closed = new EventEmitter<void>();

  get iconClass(): string {
    return this.isWarning ? 'warning' : 'timeout';
  }

  get buttonClass(): string {
    return this.isWarning ? 'danger' : 'primary';
  }

  close(): void {
    this.closed.emit();
  }
}

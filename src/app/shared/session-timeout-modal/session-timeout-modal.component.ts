import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="modal-title">Sesión Expirada</h2>
        <p class="modal-message">{{ message }}</p>
        <button class="modal-button" (click)="close()">Iniciar Sesión</button>
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
      color: #f59e0b;
      margin-bottom: 16px;
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
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }

    .modal-button:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .modal-button:active {
      transform: translateY(0);
    }
  `]
})
export class SessionTimeoutModalComponent {
  @Input() message: string = 'Tu sesión ha expirado';
  @Input() isVisible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-vip-promo-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vip-promo-modal.component.html',
  styleUrls: ['./vip-promo-modal.component.scss']
})
export class VipPromoModalComponent {
  @Input() title = '¡Prueba VIP y desbloquea ventajas!';
  @Input() benefits: string[] = [
    'Recomendaciones exclusivas y sin límites',
    'Acceso anticipado a nuevos contenidos',
    'Soporte prioritario',
  ];
  @Input() primaryLabel = 'Mejorar a VIP';
  @Input() secondaryLabel = 'Seguir con Standard';
  @Input() heroImageUrl = 'assets/placeholders/vid1.jpg';
  @Input() planPriceLabel = 'VIP\n$12.99/mes';
  @Input() planDescription = 'Cancela cuando quieras.\nIncluye Vídeos y Audios\ncon contenido VIP.';

  @Output() upgrade = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() seePlans = new EventEmitter<void>();

  onUpgrade() { this.upgrade.emit(); }
  onContinue() { this.continue.emit(); }
  onClose() { this.close.emit(); }
  onSeePlans() { this.seePlans.emit(); }

  @HostListener('document:keydown.escape')
  handleEscape() { this.onClose(); }
}

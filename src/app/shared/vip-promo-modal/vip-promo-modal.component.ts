import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/*
 * VipPromoModalComponent
 * Modal promocional que compara las ventajas entre plan Standard y VIP.
 * Muestra características diferenciadas, precios y permite al usuario
 * elegir su plan preferido. Incluye escape por teclado y overlay.
 */
@Component({
  selector: 'app-vip-promo-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vip-promo-modal.component.html',
  styleUrls: ['./vip-promo-modal.component.scss']
})
export class VipPromoModalComponent {
  // Configuración de contenido del modal
  @Input() title = '¡Únete a ESIMedia VIP!';
  @Input() benefits: string[] = [
    'Recomendaciones exclusivas y sin límites',
    'Acceso anticipado a nuevos contenidos',
    'Soporte prioritario',
  ];
  @Input() primaryLabel = 'Mejorar a VIP';
  @Input() secondaryLabel = 'Seguir con Standard';
  @Input() heroImageUrl = 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=800&h=400&fit=crop';
  @Input() planPriceLabel = 'VIP\n$12.99/mes';
  @Input() planDescription = 'Cancela cuando quieras.\nIncluye Vídeos y Audios\ncon contenido VIP.';
  @Input() showFromHome = false; // Indica si se muestra desde home

  // Eventos de interacción del usuario
  @Output() upgrade = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() seePlans = new EventEmitter<void>();

  // Métodos de acción - solo emiten eventos
  onUpgrade = () => this.upgrade.emit();
  onContinue = () => this.continue.emit();
  onClose = () => this.close.emit();
  onSeePlans = () => this.seePlans.emit();

  // Cierre del modal con tecla Escape
  @HostListener('document:keydown.escape')
  handleEscape() { this.onClose(); }
}

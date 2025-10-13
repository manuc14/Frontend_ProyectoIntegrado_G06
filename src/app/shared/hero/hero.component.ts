import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/*
 * HeroComponent
 * Sección destacada principal de la página home que muestra contenido promocional,
 * película/serie destacada con acciones principales (ver ahora, hacerse VIP)
 * e información promocional de planes premium.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {}

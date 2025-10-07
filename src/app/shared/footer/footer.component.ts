import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/*
 * FooterComponent
 * Pie de página de la aplicación que contiene información corporativa,
 * enlaces legales y de contacto. Responsive y se adapta a diferentes
 * tamaños de pantalla manteniendo la estructura organizativa.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {}

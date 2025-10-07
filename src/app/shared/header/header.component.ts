import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/*
 * HeaderComponent
 * Componente de navegación principal de la aplicación. Incluye el logotipo,
 * menú de navegación responsive con hamburger para móvil, y enlaces de
 * autenticación. Se adapta automáticamente a diferentes tamaños de pantalla.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}

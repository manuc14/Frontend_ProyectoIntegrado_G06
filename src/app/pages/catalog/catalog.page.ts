import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

/*
 * CatalogPage
 * Página de catálogo completo de contenido multimedia. Permite a los
 * usuarios navegar, buscar y filtrar el contenido disponible
 * en la plataforma (videos, audios, series, películas).
 */
@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="page"><h2>Catálogo</h2></main>
    <app-footer />
  `,
  styles: [`.page{max-width:960px;margin:32px auto;padding:0 16px}`]
})
export class CatalogPage {}

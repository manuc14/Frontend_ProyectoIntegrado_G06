import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

/*
 * ContentPage
 * Página para gestión de contenidos multimedia. Destinada a editores
 * y gestores de contenido para añadir, modificar y organizar videos,
 * audios y otros materiales de la plataforma.
 */
@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="page"><h2>Gestión de contenidos</h2></main>
    <app-footer />
  `,
  styles: [`.page{max-width:960px;margin:32px auto;padding:0 16px}`]
})
export class ContentPage {}

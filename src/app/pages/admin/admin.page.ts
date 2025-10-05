import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="page"><h2>Panel de administración</h2></main>
    <app-footer />
  `,
  styles: [`.page{max-width:960px;margin:32px auto;padding:0 16px}`]
})
export class AdminPage {}

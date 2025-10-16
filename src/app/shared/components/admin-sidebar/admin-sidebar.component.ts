import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { buttonHover, buttonPress } from '../../../core/animations/animations';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
  ,
  animations: [buttonHover, buttonPress]
})
export class AdminSidebarComponent implements OnInit {
  @Input() visible = false;
  @Output() navigate = new EventEmitter<string>();
  @Input() activeRoute: string | null = null;
  // clave normalizada usada por la plantilla: 'users' | 'admins' | 'creators'
  activeKey: 'users' | 'admins' | 'creators' | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicializar la ruta activa a partir de la URL actual (para cuando el componente ya se renderiza
    // después de la navegación inicial) y suscribirse a futuros cambios.
    const current = (this.router.url || '').split('?')[0].replace(/^\//, '');
    const initialSeg = current.split('/')[0] || '';
    this.activeRoute = initialSeg;
    this.activeKey = this.mapRouteToKey(initialSeg);

    // Subscribe to route changes so component can highlight active route when used standalone
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((ev) => {
      const path = ev.urlAfterRedirects.split('?')[0].replace(/^\//, '');
      // Obtener el primer segmento de la ruta
      const seg = path.split('/')[0] || '';
      this.activeRoute = seg;
      this.activeKey = this.mapRouteToKey(seg);
    });
  }

  // Mapea el primer segmento de la URL a una clave manejable por la plantilla
  private mapRouteToKey(segment: string): 'users' | 'admins' | 'creators' | null {
    if (!segment) return 'users';
    const s = segment.toLowerCase();
    if (s === 'ad-users' || s === 'users') return 'users';
    if (s === 'ad-admin' || s === 'admins' || s === 'ad-admins') return 'admins';
    if (s === 'ad-creators' || s === 'creators') return 'creators';
    return null;
  }

  goTo(route: string) {
    this.navigate.emit(route);
  }

}

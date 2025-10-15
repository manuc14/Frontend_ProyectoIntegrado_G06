import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adadminaddsuccess',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-admin-add-success.component.html',
  styleUrl: './ad-admin-add-success.component.scss',
})
export class AdminAdmsAddSuccessPage implements OnInit {
  adminData: any = {};

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Obtener los datos del administrador desde el estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['adminData']) {
      this.adminData = navigation.extras.state['adminData'];
    } else {
      // Si no hay datos, redirigir a la lista de administradores
      this.router.navigate(['/ad-admin']);
    }
  }

  goBack(): void {
    this.router.navigate(['/ad-admin']);
  }
}

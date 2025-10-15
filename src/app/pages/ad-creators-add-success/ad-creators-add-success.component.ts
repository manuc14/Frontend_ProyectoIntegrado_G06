import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adcreatorsaddsuccess',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ad-creators-add-success.component.html',
  styleUrl: './ad-creators-add-success.component.scss',
})
export class AdminCreatorsAddSuccessPage implements OnInit {
  creatorData: any = {};

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Obtener los datos del creador desde el estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['creatorData']) {
      this.creatorData = navigation.extras.state['creatorData'];
    } else {
      // Si no hay datos, redirigir a la lista de creadores
      this.router.navigate(['/ad-creators']);
    }
  }

  goBack(): void {
    this.router.navigate(['/ad-creators']);
  }
}

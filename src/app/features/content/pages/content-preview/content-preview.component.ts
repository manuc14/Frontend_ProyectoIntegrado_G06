import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { VipPromoModalComponent } from '../../../../shared/vip-promo-modal/vip-promo-modal.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido } from '../../../../core/models/contenido.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-content-preview',
  standalone: true,
  imports: [
    CommonModule,
    FilterPillComponent,
    BackButtonComponent,
    ActionButtonComponent,
    VipPromoModalComponent
  ],
  templateUrl: './content-preview.component.html',
  styleUrls: ['./content-preview.component.scss']
})
export class ContentPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);
  private authService = inject(AuthService);

  contenido: Contenido | null = null;
  valoracionUsuario: number = 0;
  valoracionHover: number = 0;
  showVipModal: boolean = false;

  ngOnInit(): void {
    // Intentar obtener el ID desde localStorage
    const contentId = localStorage.getItem('currentContentId');
    
    if (contentId) {
      console.log('🔍 [PREVIEW] ID obtenido desde localStorage:', contentId);
      this.loadContent(contentId);
    } else {
      console.log('❌ [PREVIEW] No hay ID en localStorage - redirigiendo al catálogo');
      this.router.navigate(['/catalog']);
    }
  }

  loadContent(id: string): void {
    console.log('🔍 [PREVIEW] Cargando contenido con ID:', id);
    
    this.catalogoService.getContenidoById(id).subscribe({
      next: (contenido) => {
        console.log('✅ [PREVIEW] Contenido cargado desde backend:', contenido);
        
        // Validar restricción de edad
        const userAge = this.authService.getUserAge();
        const contentAge = contenido.restriccionEdad || 0;
        
        if (userAge < contentAge) {
          alert(`❌ No tienes la edad suficiente para ver este contenido.\n\nEste contenido requiere ${contentAge}+ años.`);
          this.router.navigate(['/catalog']);
          return;
        }
        
        this.contenido = contenido;
      },
      error: (error) => {
        console.error('❌ [PREVIEW] Error cargando contenido:', error);
        this.router.navigate(['/catalog']);
      }
    });
  }

  playContent(): void {
    if (!this.contenido?._id) {
      console.error('❌ ERROR: contenido o _id es undefined');
      return;
    }

    // Verificar si el contenido es VIP y el usuario no lo es
    if (this.contenido.contenidoVip) {
      const isUserVip = this.authService.isUserVip();
      
      if (!isUserVip) {
        // Mostrar modal VIP en lugar de alert
        this.showVipModal = true;
        return;
      }
    }

    console.log('✅ Guardando ID en localStorage y navegando a /player');
    localStorage.setItem('currentContentId', this.contenido._id);
    this.router.navigate(['/player']);
  }

  // Métodos para el modal VIP
  onUpgradeToVip(): void {
    console.log('🎯 Usuario quiere actualizar a VIP');
    this.showVipModal = false;
    this.router.navigate(['/profile']);
  }

  onContinueWithoutVip(): void {
    console.log('✅ Usuario continúa sin VIP');
    this.showVipModal = false;
  }

  onCloseVipModal(): void {
    this.showVipModal = false;
  }

  addToFavorites(): void {
    console.log('Añadir a favoritos:', this.contenido?.titulo);
  }

  addToList(): void {
    console.log('Añadir a lista:', this.contenido?.titulo);
  }

  setRating(rating: number): void {
    this.valoracionUsuario = rating;
    console.log('Valoración establecida:', rating);
  }

  setHoverRating(rating: number): void {
    this.valoracionHover = rating;
  }

  clearHoverRating(): void {
    this.valoracionHover = 0;
  }

  isStarFilled(starIndex: number): boolean {
    return starIndex <= (this.valoracionHover || this.valoracionUsuario);
  }

  getAgeRestrictionIcon(): string {
    if (!this.contenido) return '';
    const age = this.contenido.restriccionEdad;
    return age === 0 ? 'TP' : `${age}+`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1920&h=1080&fit=crop';
  }
}

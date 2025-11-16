import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { VipPromoModalComponent } from '../../../../shared/vip-promo-modal/vip-promo-modal.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido } from '../../../../core/models/contenido.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ContentPreviewService, InfoContenidoResponse } from '../../../../core/services/content-preview.service';

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
  private contentPreviewService = inject(ContentPreviewService);
  private cdr = inject(ChangeDetectorRef);

  contenido: Contenido | null = null;
  valoracionUsuario: number = 0;
  valoracionMedia: number = 0;
  valoracionHover: number = 0;
  showVipModal: boolean = false;
  isFavorito: boolean = false;
  navigationOrigin: string = 'catalog';
  protected yaValorado: boolean = false;
  private yaReprodujo: boolean = false;

  ngOnInit(): void {
    // Leer el origen de la navegación desde los query parameters
    this.route.queryParams.subscribe(params => {
      if (params['origin']) {
        this.navigationOrigin = params['origin'];
      }
    });

    const contentId = localStorage.getItem('currentContentId');

    if (contentId) {
      this.loadContent(contentId);
    } else {
      this.navigateBack();
    }
  }

  loadContent(id: string): void {
    this.catalogoService.getContenidoById(id).subscribe({
      next: (contenido) => {
        const userAge = this.authService.getUserAge();
        const contentAge = contenido.restriccionEdad || 0;

        if (userAge < contentAge) {
          alert(`No tienes la edad suficiente para ver este contenido.\n\nEste contenido requiere ${contentAge}+ años.`);
          this.navigateBack();
          return;
        }

        contenido.creadorAlias = localStorage.getItem('currentContentCreatorAlias') ?? '';
        contenido.creadorEspecialidad = localStorage.getItem('currentContentCreatorSpecialty') ?? '';

        this.contenido = contenido;
        this.loadContentInfo(id);
      },
      error: (error) => {
        console.error('Error cargando contenido:', error);
        this.navigateBack();
      }
    });
  }

  private loadContentInfo(contenidoId: string): void {
    this.contentPreviewService.obtenerInfoCompleta(contenidoId).subscribe({
      next: (info: InfoContenidoResponse) => {
        console.log('✅ Información del contenido cargada:', info);

        this.isFavorito = info.esFavorito;
        this.valoracionMedia = info.valoracionMedia || 0;
        this.yaReprodujo = info.yaReprodujo;

        if (info.miValoracion !== null) {
          this.valoracionUsuario = info.miValoracion;
          this.yaValorado = true;
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando información del contenido:', error);
        this.isFavorito = false;
        this.valoracionMedia = 0;
      }
    });
  }

  playContent(): void {
    if (!this.contenido?._id) {
      console.error('Contenido no disponible');
      return;
    }

    if (this.contenido.contenidoVip && !this.authService.isUserVip()) {
      this.showVipModal = true;
      return;
    }

    this.contentPreviewService.registrarReproduccion(this.contenido._id).subscribe({
      next: () => {
        console.log('✅ Reproducción registrada en el backend');
        this.yaReprodujo = true;
        localStorage.setItem('currentContentId', this.contenido!._id);
        this.router.navigate(['/player']);
      },
      error: (error) => {
        console.error('❌ Error al registrar reproducción:', error);
        localStorage.setItem('currentContentId', this.contenido!._id);
        this.router.navigate(['/player']);
      }
    });
  }

  onUpgradeToVip(): void {
    this.showVipModal = false;
    this.router.navigate(['/profile']);
  }

  onContinueWithoutVip(): void {
    this.showVipModal = false;
  }

  onCloseVipModal(): void {
    this.showVipModal = false;
  }

  addToFavorites(): void {
    if (!this.contenido?._id) return;

    this.contentPreviewService.toggleFavorito(this.contenido._id).subscribe({
      next: (response) => {
        console.log('✅ Favorito actualizado:', response);
        this.isFavorito = response.agregado;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cambiando favorito:', error);
        alert('No se pudo actualizar el favorito. Por favor, intenta de nuevo.');
      }
    });
  }

  setRating(rating: number): void {
    if (!this.contenido?._id) {
      console.error('Contenido no disponible');
      return;
    }

    if (this.yaValorado) {
      alert('Ya has valorado este contenido. No puedes modificar tu valoración.');
      return;
    }

    if (!this.yaReprodujo) {
      alert('Debes reproducir el contenido antes de poder valorarlo.');
      return;
    }

    this.contentPreviewService.valorarContenido(this.contenido._id, rating).subscribe({
      next: () => {
        console.log('✅ Valoración registrada en el backend');
        this.valoracionUsuario = rating;
        this.yaValorado = true;
        this.loadContentInfo(this.contenido!._id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al valorar contenido:', error);
        if (error.error?.message) {
          alert(error.error.message);
        } else {
          alert('No se pudo registrar la valoración. Asegúrate de haber reproducido el contenido primero.');
        }
      }
    });
  }

  setHoverRating(rating: number): void {
    if (!this.yaValorado) {
      this.valoracionHover = rating;
    }
  }

  clearHoverRating(): void {
    this.valoracionHover = 0;
  }

  isStarFilled(starIndex: number): boolean {
    if (this.yaValorado) {
      return starIndex <= this.valoracionUsuario;
    }
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

  navigateBack(): void {
    switch (this.navigationOrigin) {
      case 'private-lists':
        this.router.navigate(['/my-lists'], { queryParams: {} });
        break;
      case 'catalog':
      default:
        this.router.navigate(['/catalog'], { queryParams: {} });
        break;
    }
  }
}

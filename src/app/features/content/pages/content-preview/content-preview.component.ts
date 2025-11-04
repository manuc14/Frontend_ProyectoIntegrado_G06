import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterPillComponent } from '../../../../shared/components/filter-pill/filter-pill.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Contenido } from '../../../../core/models/contenido.models';

@Component({
  selector: 'app-content-preview',
  standalone: true,
  imports: [
    CommonModule,
    FilterPillComponent,
    BackButtonComponent,
    ActionButtonComponent
  ],
  templateUrl: './content-preview.component.html',
  styleUrls: ['./content-preview.component.scss']
})
export class ContentPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);

  contenido: Contenido | null = null;
  valoracionUsuario: number = 0;
  valoracionHover: number = 0;

  ngOnInit(): void {
    const contentId = this.route.snapshot.paramMap.get('id');
    if (contentId) {
      this.loadContent(contentId);
    }
  }

  loadContent(id: string): void {
    console.log('🔍 [PREVIEW] Cargando contenido con ID:', id);
    console.log('🌐 [PREVIEW] URL de petición:', `/api/contenidos/${id}`);
    
    this.catalogoService.getContenidoById(id).subscribe({
      next: (contenido) => {
        console.log('✅ [PREVIEW] Contenido cargado desde backend:', contenido);
        console.log('🆔 [PREVIEW] _id del contenido:', contenido._id);
        console.log('🔍 [PREVIEW] Tipo de _id:', typeof contenido._id);
        this.contenido = contenido;
      },
      error: (error) => {
        console.error('❌ [PREVIEW] Error cargando contenido:', error);
        console.error('❌ [PREVIEW] Status:', error.status);
        console.error('❌ [PREVIEW] Message:', error.message);
        console.log('🔄 [PREVIEW] Redirigiendo a /catalog...');
        // Navegar de vuelta al catálogo si hay error
        this.router.navigate(['/catalog']);
      }
    });
  }

  playContent(): void {
    console.log('🎮 playContent() llamado');
    console.log('📦 contenido:', this.contenido);
    console.log('🆔 contenido._id:', this.contenido?._id);
    
    if (this.contenido?._id) {
      console.log('✅ Navegando a /player/' + this.contenido._id);
      this.router.navigate(['/player', this.contenido._id]);
    } else {
      console.error('❌ ERROR: contenido o _id es undefined');
      console.error('contenido completo:', JSON.stringify(this.contenido, null, 2));
    }
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

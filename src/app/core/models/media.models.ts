/*
 * Modelos de datos para contenido multimedia
 * Define las interfaces para elementos de media y secciones de contenido
 * usado en la comunicación con el backend y renderizado de la UI.
 */

/*
 * Elemento individual de contenido multimedia (video/audio)
 * Estructura completa con metadatos y configuración de visualización
 */
export interface MediaItemDto {
  id: string;
  title: string;
  imageUrl: string;
  ageRating?: string;
  qualityTag?: string; // e.g., 4K, HD, Top
  durationText?: string; // e.g., 2h 01m
  category?: string; // e.g., Podcast, Docu
  vipOnly?: boolean;
  isNew?: boolean;
}

/*
 * Sección de contenido agrupado por categoría
 * Contiene múltiples elementos multimedia relacionados
 */
export interface SectionDto {
  key: string;
  title: string;
  subtitle?: string;
  items: MediaItemDto[];
}

/*
 * Respuesta del endpoint de avatares predefinidos
 * Contiene lista de rutas de avatares disponibles y avatar por defecto
 */
export interface AvatarsResponseDto {
  success: boolean;
  message: string;
  avatars: string[];
  defaultAvatar: string;
}

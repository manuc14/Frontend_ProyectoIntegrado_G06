export type TipoContenido = 'VIDEO' | 'AUDIO';
export type EstadoContenido = 'PUBLICO' | 'PRIVADO' | 'BORRADOR';
export type ResolucionVideo = '4K' | '1080p' | '720p' | '480p' | 'HD';

export interface Contenido {
  _id: string;
  titulo: string;
  descripcion: string;
  ficheroUrl: string;
  miniaturaUrl: string;
  duracion: number; // en minutos
  contenidoVip: boolean;
  estado: EstadoContenido;
  fechaEstado: Date;
  tipo: TipoContenido;
  restriccionEdad: number; // 0, 7, 13, 18
  tags: string[];
  foto: string;
  resolucion?: ResolucionVideo; // Solo para videos
  creador?: {
    nombre: string;
    avatar: string;
  };
  creadorAlias?: string;
  creadorEspecialidad?: string;
  categoria?: string;
  disponibleHasta: Date | null;
}

export interface FiltrosCatalogo {
  tipo: TipoContenido | 'TODOS';
  premium: boolean;
  edadMaxima?: number;
  calidad?: ResolucionVideo[];
  especialidad?: string;
  etiquetas?: string[];
}

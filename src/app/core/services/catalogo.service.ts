import { Injectable } from '@angular/core';
import { Contenido, ResolucionVideo } from '../models/contenido.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  
  private mockVideos: Contenido[] = [
    {
      _id: '68f76c14e13b596143c38b81',
      titulo: 'Max Verstappens Incredible Pole Lap 2023 Monaco',
      descripcion: 'Ride onboard with Max Verstappen as he takes pole position in Monaco with this incredible lap!',
      ficheroUrl: 'https://www.youtube.com/watch?v=lZ0bHr8UW7k',
      miniaturaUrl: '/api/files/thumbnails/00ebf669-1864-48c5-9eb9-5b390f0fca6b.png',
      duracion: 2,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date('2025-10-21T11:18:44.801Z'),
      tipo: 'VIDEO',
      restriccionEdad: 18,
      tags: ['racing', 'f1'],
      foto: '/api/files/thumbnails/00ebf669-1864-48c5-9eb9-5b390f0fca6b.png',
      creador: {
        nombre: 'Formula 1',
        avatar: 'https://ui-avatars.com/api/?name=F1&background=2563eb&color=fff'
      },
      categoria: 'Deportes'
    },
    {
      _id: 'video-2',
      titulo: 'Northern Lights Over Fjords',
      descripcion: 'Impresionante captura de auroras boreales sobre los fiordos noruegos',
      ficheroUrl: '/api/files/video/northern-lights.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/aurora/400/300',
      duracion: 748,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Naturaleza', 'Documental', '4K'],
      foto: 'https://picsum.photos/seed/aurora/400/300',
      creador: {
        nombre: 'Aurora Lab',
        avatar: 'https://ui-avatars.com/api/?name=Aurora+Lab&background=10b981&color=fff'
      },
      categoria: 'Naturaleza'
    },
    {
      _id: 'video-3',
      titulo: 'Perfect Pasta at Home',
      descripcion: 'Aprende a hacer pasta perfecta como en Italia',
      ficheroUrl: '/api/files/video/pasta.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/pasta/400/300',
      duracion: 501,
      resolucion: '1080p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Cocina', 'Fácil', '1080p'],
      foto: 'https://picsum.photos/seed/pasta/400/300',
      creador: {
        nombre: 'Casa Cucina',
        avatar: 'https://ui-avatars.com/api/?name=Casa+Cucina&background=f59e0b&color=fff'
      },
      categoria: 'Cocina'
    },
    {
      _id: 'video-4',
      titulo: 'HIIT: Total Body',
      descripcion: 'Entrenamiento HIIT de cuerpo completo de alta intensidad',
      ficheroUrl: '/api/files/video/hiit.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/hiit/400/300',
      duracion: 1325,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 18,
      tags: ['Fitness', 'HIIT', '1080p'],
      foto: 'https://picsum.photos/seed/hiit/400/300',
      creador: {
        nombre: 'FitFactory',
        avatar: 'https://ui-avatars.com/api/?name=FitFactory&background=ef4444&color=fff'
      },
      categoria: 'Fitness'
    },
    {
      _id: 'video-5',
      titulo: 'Drones Over Tokyo',
      descripcion: 'Impresionante vista aérea de Tokio capturada con drones',
      ficheroUrl: '/api/files/video/tokyo.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/tokyo/400/300',
      duracion: 573,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Viajes', 'Drone', '4K'],
      foto: 'https://picsum.photos/seed/tokyo/400/300',
      creador: {
        nombre: 'SkyLens',
        avatar: 'https://ui-avatars.com/api/?name=SkyLens&background=8b5cf6&color=fff'
      },
      categoria: 'Viajes'
    },
    {
      _id: 'video-6',
      titulo: 'Watercolor Basics',
      descripcion: 'Tutorial básico de acuarela para principiantes',
      ficheroUrl: '/api/files/video/watercolor.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/watercolor/400/300',
      duracion: 1182,
      resolucion: '720p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Arte', 'Tutorial', '720p'],
      foto: 'https://picsum.photos/seed/watercolor/400/300',
      creador: {
        nombre: 'StudioNova',
        avatar: 'https://ui-avatars.com/api/?name=StudioNova&background=ec4899&color=fff'
      },
      categoria: 'Arte'
    },
    {
      _id: 'video-7',
      titulo: 'Leading Through Change',
      descripcion: 'Estrategias de liderazgo en tiempos de cambio',
      ficheroUrl: '/api/files/video/leadership.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/leadership/400/300',
      duracion: 2210,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 18,
      tags: ['Negocios', 'Liderazgo', '1080p'],
      foto: 'https://picsum.photos/seed/leadership/400/300',
      creador: {
        nombre: 'Summit',
        avatar: 'https://ui-avatars.com/api/?name=Summit&background=0891b2&color=fff'
      },
      categoria: 'Negocios'
    },
    {
      _id: 'video-8',
      titulo: 'Morning Yoga Flow',
      descripcion: 'Rutina de yoga matutina para empezar el día con energía',
      ficheroUrl: '/api/files/video/yoga.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/yoga/400/300',
      duracion: 1085,
      resolucion: '1080p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Yoga', 'Bienestar', '1080p'],
      foto: 'https://picsum.photos/seed/yoga/400/300',
      creador: {
        nombre: 'FitFactory',
        avatar: 'https://ui-avatars.com/api/?name=FitFactory&background=ef4444&color=fff'
      },
      categoria: 'Bienestar'
    },
    {
      _id: 'video-9',
      titulo: 'Guitar Masterclass: Advanced Techniques',
      descripcion: 'Técnicas avanzadas de guitarra con maestros reconocidos',
      ficheroUrl: '/api/files/video/guitar.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/guitar/400/300',
      duracion: 2580,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Música', 'Educación', 'Guitarra'],
      foto: 'https://picsum.photos/seed/guitar/400/300',
      creador: {
        nombre: 'Music Academy',
        avatar: 'https://ui-avatars.com/api/?name=Music+Academy&background=f59e0b&color=fff'
      },
      categoria: 'Música'
    },
    {
      _id: 'video-10',
      titulo: 'Surfing Giant Waves in Hawaii',
      descripcion: 'Las olas más grandes de Hawaii capturadas en 4K',
      ficheroUrl: '/api/files/video/surf.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/surf/400/300',
      duracion: 420,
      resolucion: '4K',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 13,
      tags: ['Deportes', 'Surf', 'Acción'],
      foto: 'https://picsum.photos/seed/surf/400/300',
      creador: {
        nombre: 'Extreme Sports',
        avatar: 'https://ui-avatars.com/api/?name=Extreme+Sports&background=06b6d4&color=fff'
      },
      categoria: 'Deportes'
    },
    {
      _id: 'video-11',
      titulo: 'Medieval Castle Tour: Europe',
      descripcion: 'Tour por los castillos medievales más impresionantes de Europa',
      ficheroUrl: '/api/files/video/castles.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/castles/400/300',
      duracion: 1800,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Historia', 'Viajes', 'Arquitectura'],
      foto: 'https://picsum.photos/seed/castles/400/300',
      creador: {
        nombre: 'History Channel',
        avatar: 'https://ui-avatars.com/api/?name=History+Channel&background=7c3aed&color=fff'
      },
      categoria: 'Historia'
    },
    {
      _id: 'video-12',
      titulo: 'Street Food Asia: Bangkok Edition',
      descripcion: 'La mejor comida callejera de Bangkok',
      ficheroUrl: '/api/files/video/streetfood.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/streetfood/400/300',
      duracion: 960,
      resolucion: '1080p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Comida', 'Viajes', 'Cultura'],
      foto: 'https://picsum.photos/seed/streetfood/400/300',
      creador: {
        nombre: 'Food Explorer',
        avatar: 'https://ui-avatars.com/api/?name=Food+Explorer&background=dc2626&color=fff'
      },
      categoria: 'Gastronomía'
    },
    {
      _id: 'video-13',
      titulo: 'Wildlife Safari: African Plains',
      descripcion: 'Explora la vida salvaje africana en todo su esplendor',
      ficheroUrl: '/api/files/video/safari.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/safari/400/300',
      duracion: 2100,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Naturaleza', 'Animales', 'Documental'],
      foto: 'https://picsum.photos/seed/safari/400/300',
      creador: {
        nombre: 'Wildlife Docs',
        avatar: 'https://ui-avatars.com/api/?name=Wildlife+Docs&background=10b981&color=fff'
      },
      categoria: 'Naturaleza'
    },
    {
      _id: 'video-14',
      titulo: 'Urban Photography Masterclass',
      descripcion: 'Aprende las técnicas de fotografía urbana profesional',
      ficheroUrl: '/api/files/video/photography.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/urbphoto/400/300',
      duracion: 1650,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Fotografía', 'Arte', 'Educación'],
      foto: 'https://picsum.photos/seed/urbphoto/400/300',
      creador: {
        nombre: 'Photo Masters',
        avatar: 'https://ui-avatars.com/api/?name=Photo+Masters&background=8b5cf6&color=fff'
      },
      categoria: 'Arte'
    },
    {
      _id: 'video-15',
      titulo: 'Deep Sea Diving: Coral Reefs',
      descripcion: 'Descubre el fascinante mundo submarino de los arrecifes',
      ficheroUrl: '/api/files/video/diving.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/coral/400/300',
      duracion: 1320,
      resolucion: '4K',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Océano', 'Buceo', 'Naturaleza'],
      foto: 'https://picsum.photos/seed/coral/400/300',
      creador: {
        nombre: 'Ocean Explorer',
        avatar: 'https://ui-avatars.com/api/?name=Ocean+Explorer&background=0ea5e9&color=fff'
      },
      categoria: 'Naturaleza'
    },
    {
      _id: 'video-16',
      titulo: 'Extreme Mountain Biking',
      descripcion: 'Las rutas de mountain bike más extremas del mundo',
      ficheroUrl: '/api/files/video/mtb.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/mtb/400/300',
      duracion: 840,
      resolucion: '1080p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 13,
      tags: ['Deportes', 'Aventura', 'Acción'],
      foto: 'https://picsum.photos/seed/mtb/400/300',
      creador: {
        nombre: 'MTB Extreme',
        avatar: 'https://ui-avatars.com/api/?name=MTB+Extreme&background=dc2626&color=fff'
      },
      categoria: 'Deportes'
    },
    {
      _id: 'video-17',
      titulo: 'Japanese Tea Ceremony',
      descripcion: 'La ceremonia del té japonesa explicada paso a paso',
      ficheroUrl: '/api/files/video/teaceremony.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/teaceremony/400/300',
      duracion: 1440,
      resolucion: '1080p',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Cultura', 'Tradición', 'Japón'],
      foto: 'https://picsum.photos/seed/teaceremony/400/300',
      creador: {
        nombre: 'Japan Culture',
        avatar: 'https://ui-avatars.com/api/?name=Japan+Culture&background=ec4899&color=fff'
      },
      categoria: 'Cultura'
    },
    {
      _id: 'video-18',
      titulo: 'Northern Lights Time-lapse',
      descripcion: 'Las auroras boreales captadas en 4K a lo largo de una noche',
      ficheroUrl: '/api/files/video/aurora.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/aurora/400/300',
      duracion: 360,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Naturaleza', 'Astronomía', 'Timelapse'],
      foto: 'https://picsum.photos/seed/aurora/400/300',
      creador: {
        nombre: 'Night Sky',
        avatar: 'https://ui-avatars.com/api/?name=Night+Sky&background=6366f1&color=fff'
      },
      categoria: 'Naturaleza'
    },
    {
      _id: 'video-19',
      titulo: 'Street Dance Battle: NYC',
      descripcion: 'La mejor batalla de street dance en Nueva York',
      ficheroUrl: '/api/files/video/dance.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/streetdance/400/300',
      duracion: 720,
      resolucion: '1080p',
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Danza', 'Arte', 'Cultura Urbana'],
      foto: 'https://picsum.photos/seed/streetdance/400/300',
      creador: {
        nombre: 'Street Culture',
        avatar: 'https://ui-avatars.com/api/?name=Street+Culture&background=f97316&color=fff'
      },
      categoria: 'Arte'
    },
    {
      _id: 'video-20',
      titulo: 'Ancient Rome: 3D Reconstruction',
      descripcion: 'Reconstrucción 3D de la antigua Roma en su máximo esplendor',
      ficheroUrl: '/api/files/video/rome.mp4',
      miniaturaUrl: 'https://picsum.photos/seed/rome3d/400/300',
      duracion: 1980,
      resolucion: '4K',
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'VIDEO',
      restriccionEdad: 0,
      tags: ['Historia', 'Tecnología', '3D'],
      foto: 'https://picsum.photos/seed/rome3d/400/300',
      creador: {
        nombre: 'History 3D',
        avatar: 'https://ui-avatars.com/api/?name=History+3D&background=a855f7&color=fff'
      },
      categoria: 'Historia'
    }
  ];

  private mockAudios: Contenido[] = [
    {
      _id: '68fe6dc0537fef5cfa2d7f79',
      titulo: 'Subida de audio prueba',
      descripcion: '',
      ficheroUrl: '/api/files/audio/ffc963e3-d7f6-4a88-9933-3b764b53dd13.wav',
      miniaturaUrl: '/api/files/thumbnails/69c6e8dd-f883-4ec1-916b-ea6fc5bd315a.jpg',
      duracion: 2,
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date('2025-10-26T18:51:44.195Z'),
      tipo: 'AUDIO',
      restriccionEdad: 18,
      tags: ['prueba'],
      foto: '/api/files/thumbnails/69c6e8dd-f883-4ec1-916b-ea6fc5bd315a.jpg',
      creador: {
        nombre: 'Test User',
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=6366f1&color=fff'
      },
      categoria: 'Música'
    },
    {
      _id: 'audio-2',
      titulo: 'Lo-Fi Study Beats',
      descripcion: 'Música relajante para estudiar y concentrarse',
      ficheroUrl: '/api/files/audio/lofi.mp3',
      miniaturaUrl: 'https://picsum.photos/seed/lofi/400/300',
      duracion: 179,
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'AUDIO',
      restriccionEdad: 0,
      tags: ['Música', 'Lo-Fi', 'HD'],
      foto: 'https://picsum.photos/seed/lofi/400/300',
      creador: {
        nombre: 'Chillwave',
        avatar: 'https://ui-avatars.com/api/?name=Chillwave&background=a855f7&color=fff'
      },
      categoria: 'Música'
    },
    {
      _id: 'audio-3',
      titulo: 'Podcast: Tech Innovators',
      descripcion: 'Entrevista con líderes de la industria tecnológica',
      ficheroUrl: '/api/files/audio/tech-podcast.mp3',
      miniaturaUrl: 'https://picsum.photos/seed/podcast/400/300',
      duracion: 3600,
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'AUDIO',
      restriccionEdad: 0,
      tags: ['Podcast', 'Tecnología', 'Entrevista'],
      foto: 'https://picsum.photos/seed/podcast/400/300',
      creador: {
        nombre: 'Tech Talk',
        avatar: 'https://ui-avatars.com/api/?name=Tech+Talk&background=3b82f6&color=fff'
      },
      categoria: 'Tecnología'
    },
    {
      _id: 'audio-4',
      titulo: 'Meditación Guiada',
      descripcion: 'Sesión de meditación para reducir el estrés',
      ficheroUrl: '/api/files/audio/meditation.mp3',
      miniaturaUrl: 'https://picsum.photos/seed/meditation/400/300',
      duracion: 900,
      contenidoVip: false,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'AUDIO',
      restriccionEdad: 0,
      tags: ['Meditación', 'Bienestar', 'Relajación'],
      foto: 'https://picsum.photos/seed/meditation/400/300',
      creador: {
        nombre: 'Mindful Space',
        avatar: 'https://ui-avatars.com/api/?name=Mindful+Space&background=14b8a6&color=fff'
      },
      categoria: 'Bienestar'
    },
    {
      _id: 'audio-5',
      titulo: 'Historia de España - Ep 1',
      descripcion: 'Primera entrega de la serie sobre la historia de España',
      ficheroUrl: '/api/files/audio/historia.mp3',
      miniaturaUrl: 'https://picsum.photos/seed/historia/400/300',
      duracion: 2700,
      contenidoVip: true,
      estado: 'PUBLICO',
      fechaEstado: new Date(),
      tipo: 'AUDIO',
      restriccionEdad: 13,
      tags: ['Historia', 'Educación', 'Podcast'],
      foto: 'https://picsum.photos/seed/historia/400/300',
      creador: {
        nombre: 'Historias del Mundo',
        avatar: 'https://ui-avatars.com/api/?name=Historias+Mundo&background=f97316&color=fff'
      },
      categoria: 'Educación'
    }
  ];

  /**
   * Obtiene todos los contenidos de tipo VIDEO
   */
  getVideos(): Contenido[] {
    return this.mockVideos;
  }

  /**
   * Obtiene todos los contenidos de tipo AUDIO
   */
  getAudios(): Contenido[] {
    return this.mockAudios;
  }

  /**
   * Obtiene un contenido destacado aleatorio
   */
  getContenidoDestacado(): Contenido {
    const allContent = [...this.mockVideos, ...this.mockAudios];
    const randomIndex = Math.floor(Math.random() * allContent.length);
    return allContent[randomIndex];
  }

  /**
   * Filtra contenidos por edad del usuario
   */
  filtrarPorEdad(contenidos: Contenido[], edadUsuario: number): Contenido[] {
    return contenidos.filter(c => c.restriccionEdad <= edadUsuario);
  }

  /**
   * Filtra contenidos premium
   */
  filtrarPremium(contenidos: Contenido[], soloPremium: boolean): Contenido[] {
    if (!soloPremium) return contenidos;
    return contenidos.filter(c => c.contenidoVip);
  }

  /**
   * Filtra videos por calidad
   */
  filtrarPorCalidad(videos: Contenido[], calidades: ResolucionVideo[]): Contenido[] {
    if (calidades.length === 0) return videos;
    return videos.filter(v => v.resolucion && calidades.includes(v.resolucion));
  }

  /**
   * Filtra contenidos por etiquetas
   */
  filtrarPorEtiquetas(contenidos: Contenido[], etiquetas: string[]): Contenido[] {
    if (etiquetas.length === 0) return contenidos;
    return contenidos.filter(c => 
      c.tags.some(tag => etiquetas.includes(tag.toLowerCase()))
    );
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-upload-content',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './upload-content.component.html',
  styleUrls: ['./upload-content.component.scss']
})
export class UploadContentComponent {
  // form model
  title = '';
  description = '';
  file: File | null = null;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  type: 'video' | 'audio' | '' = '';
  vip: 'si' | 'no' | '' = '';
  url = '';
  audioFilename = '';
  resolution = '';
  estado = '';
  disponibilidad = '';
  duration = '';
  ageRestriction = '';
  tags: string[] = [];
  newTag = '';

  // limits
  readonly titleLimit = 50;
  readonly descLimit = 500;

  // computed properties for character counts
  get titleCount() { return this.title.length; }
  get descCount() { return this.description.length; }

  onTitleInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || '';
    if (v.length > this.titleLimit) {
      this.title = v.slice(0, this.titleLimit);
    } else {
      this.title = v;
    }
  }

  onDescriptionInput(ev: Event) {
    const v = (ev.target as HTMLTextAreaElement).value || '';
    if (v.length > this.descLimit) {
      this.description = v.slice(0, this.descLimit);
    } else {
      this.description = v;
    }
  }

  // Método para manejar input de URL (solo video)
  onUrlInput(ev: Event) {
    if (this.type === 'audio') {
      // Prevenir escritura si está en modo audio
      ev.preventDefault();
      return;
    }
    // Permitir la escritura normal si está en modo video o sin selección
    const v = (ev.target as HTMLInputElement).value || '';
    this.url = v;
  }

  // Método para manejar input de archivo de audio (solo audio)
  onAudioFilenameInput(ev: Event) {
    if (this.type === 'video') {
      // Prevenir escritura si está en modo video
      ev.preventDefault();
      return;
    }
    // Permitir la escritura normal si está en modo audio o sin selección
    const v = (ev.target as HTMLInputElement).value || '';
    this.audioFilename = v;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.length ? input.files[0] : null;
    
    // Solo permitir selección de archivo para audio
    if (this.type === 'video') {
      // Video no permite subida de archivos, solo URL
      console.warn('Para videos, utiliza el campo URL. La subida de archivos está deshabilitada.');
      input.value = ''; // Limpiar input
      this.file = null;
      return;
    } else if (this.type === 'audio' && selectedFile) {
      // Si audio está seleccionado, solo permitir archivos de audio
      if (this.isAudioFileType(selectedFile)) {
        this.file = selectedFile;
        console.log('Selected audio file:', selectedFile.name);
      } else {
        console.warn('Archivo no válido para audio. Selecciona un archivo de audio.');
        input.value = ''; // Limpiar input
        this.file = null;
      }
    } else if (selectedFile) {
      // Si no hay tipo seleccionado, no permitir selección
      console.warn('Selecciona primero el tipo de archivo (Video o Audio)');
      input.value = ''; // Limpiar input
      this.file = null;
    } else {
      this.file = null;
    }
  }

  // Validar si el archivo es de tipo video
  private isVideoFileType(file: File): boolean {
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'];
    const hasVideoMimeType = videoTypes.some(type => file.type.startsWith(type.split('/')[0]));
    const hasVideoExtension = /\.(mp4|avi|mov|wmv|webm|mkv)$/i.test(file.name);
    return hasVideoMimeType || hasVideoExtension;
  }

  // Validar si el archivo es de tipo audio
  private isAudioFileType(file: File): boolean {
    const audioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
    const hasAudioMimeType = audioTypes.some(type => file.type.startsWith(type.split('/')[0]));
    const hasAudioExtension = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(file.name);
    return hasAudioMimeType || hasAudioExtension;
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files && input.files.length ? input.files[0] : null;
    if (!f) return;
    this.thumbnailFile = f;
    try {
      if (this.thumbnailPreview) {
        URL.revokeObjectURL(this.thumbnailPreview);
      }
    } catch {}
    this.thumbnailPreview = URL.createObjectURL(f);
  }

  // when switching type, clear/disable fields as needed
  onTypeChange(t: 'video'|'audio'|'') {
    this.type = t;
    
    if (t === 'video') {
      // Limpiar campos específicos de audio
      this.audioFilename = '';
      // Limpiar archivo (video no permite subida de archivos)
      this.file = null;
      console.log('Modo video activado. Solo URL disponible. Campos de audio y subida de archivos deshabilitados.');
    } else if (t === 'audio') {
      // Limpiar campos específicos de video
      this.url = '';
      this.resolution = '';
      // Limpiar archivo si era de video (aunque no debería haber ninguno)
      if (this.file && this.isVideoFileType(this.file)) {
        this.file = null;
      }
      console.log('Modo audio activado. Campos de video deshabilitados.');
    } else {
      // Si no hay tipo seleccionado, limpiar archivo
      this.file = null;
      console.log('Tipo de archivo no seleccionado. Selecciona Video o Audio para continuar.');
    }
  }

  addTag() {
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  upload() {
    // Validación básica
    if (!this.title) { 
      console.warn('Título requerido'); 
      return; 
    }
    
    if (!this.type) {
      console.warn('Tipo de archivo requerido. Selecciona Video o Audio.');
      return;
    }
    
    if (this.tags.length === 0) {
      console.warn('Al menos un tag es requerido');
      return;
    }

    // Validación específica según el tipo
    if (this.type === 'video') {
      if (!this.url) {
        console.warn('Para video: proporciona una URL. La subida de archivos no está disponible para videos.');
        return;
      }
      if (!this.resolution) {
        console.warn('Resolución requerida para video');
        return;
      }
    }

    if (this.type === 'audio') {
      if (!this.audioFilename && !this.file) {
        console.warn('Para audio: proporciona un nombre de archivo o sube un archivo');
        return;
      }
      if (this.file && !this.isAudioFileType(this.file)) {
        console.warn('El archivo seleccionado no es un archivo de audio válido');
        return;
      }
    }

    if (!this.duration) {
      console.warn('Duración requerida');
      return;
    }

    if (!this.estado) {
      console.warn('Estado requerido');
      return;
    }

    if (!this.ageRestriction) {
      console.warn('Restricción de edad requerida');
      return;
    }
    
    console.log('Subiendo contenido:', {
      title: this.title,
      description: this.description,
      type: this.type,
      file: this.file?.name,
      thumbnail: this.thumbnailFile?.name,
      tags: this.tags,
      url: this.type === 'video' ? this.url : null,
      audioFilename: this.type === 'audio' ? this.audioFilename : null,
      resolution: this.type === 'video' ? this.resolution : null,
      duration: this.duration,
      estado: this.estado,
      ageRestriction: this.ageRestriction,
      disponibilidad: this.disponibilidad,
      vip: this.vip
    });
    
    // TODO: implement HttpClient upload
    console.log('✅ Validación completada. Listo para subir contenido.');
  }
}
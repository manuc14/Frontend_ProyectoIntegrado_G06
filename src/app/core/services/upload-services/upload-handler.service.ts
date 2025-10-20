import { Injectable } from '@angular/core';
import { UploadService } from './upload.service';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadHandlerService {
  constructor(
    private uploadService: UploadService
  ) {}

  async uploadAudio(file: File): Promise<string> {
    const resp = await lastValueFrom(this.uploadService.uploadAudio(file));
    return resp?.url ?? '';
  }

  async uploadThumbnail(file: File): Promise<string> {
    const resp = await lastValueFrom(this.uploadService.uploadThumbnail(file));
    return resp?.url ?? '';
  }

  // File validation methods moved from UploadValidatorService
  validateThumbnail(file: File): { ok: boolean; error?: string } {
    return this.validateFile(file, { typePrefix: 'image', maxSizeMB: 5 });
  }

  validateFile(file: File | null | undefined, opts: { typePrefix: 'audio' | 'video' | 'image'; validTypes?: string[]; maxSizeMB?: number; customMsg?: string }): { ok: boolean; error?: string } {
    if (!file) return { ok: false, error: 'Archivo inválido' };

    const { typePrefix, validTypes, maxSizeMB, customMsg } = opts;

    const handlers: Record<string, (f: File) => { ok: boolean; error?: string }> = {
      audio: (f: File) => {
        const isAudioMime = f.type.startsWith('audio/');
        const allowed = Array.isArray(validTypes) ? validTypes.includes(f.type) : true;
        if (!isAudioMime || !allowed) return { ok: false, error: customMsg ?? 'Formato no válido' };
        if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) return { ok: false, error: `El archivo de audio debe ser menor a ${maxSizeMB}MB` };
        return { ok: true };
      },
      image: (f: File) => {
        if (!f.type.startsWith('image/')) return { ok: false, error: customMsg ?? 'Por favor, selecciona un archivo de imagen válido' };
        if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) return { ok: false, error: `La imagen debe ser menor a ${maxSizeMB}MB` };
        return { ok: true };
      },
      video: (f: File) => {
        const hasVideoMime = f.type.startsWith('video/');
        const hasVideoExtension = /\.(mp4|avi|mov|wmv|webm|mkv)$/i.test(f.name);
        if (hasVideoMime || hasVideoExtension) return { ok: true };
        return { ok: false, error: customMsg ?? 'Archivo de video inválido' };
      }
    };

    const fn = handlers[typePrefix];
    return fn ? fn(file) : { ok: true };
  }
}

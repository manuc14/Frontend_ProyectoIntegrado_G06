import { Injectable } from '@angular/core';
import { UploadHandlerService } from './upload-handler.service';

export interface UploadFilesOptions {
  type: 'video' | 'audio' | '';
  file?: File | null;
  existingAudioUrl?: string | null;
  localThumbnailFile?: File | null;
  existingLocalThumbnailUrl?: string | null;
}

export interface UploadFilesResult {
  audioUrl?: string | null;
  localThumbnailUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UploadOrchestratorService {
  constructor(private handler: UploadHandlerService) {}

  /**
   * Uploads files when needed and returns resulting URLs. Does not touch UI state.
   */
  async uploadFiles(opts: UploadFilesOptions): Promise<UploadFilesResult> {
    const promises: Array<Promise<void>> = [];
    const result: UploadFilesResult = {};

    if (opts.type === 'audio' && opts.file && !opts.existingAudioUrl) {
      const p = this.handler.uploadAudio(opts.file).then(url => { result.audioUrl = url; });
      promises.push(p);
    }

    if (opts.localThumbnailFile && !opts.existingLocalThumbnailUrl) {
      const p = this.handler.uploadThumbnail(opts.localThumbnailFile).then(url => { result.localThumbnailUrl = url; });
      promises.push(p);
    }

    await Promise.all(promises);
    return result;
  }

  // Date validation methods moved from UploadValidatorService
  validarFecha(val: string): boolean {
    return this.validarFechaDetalle(val).ok;
  }

  validarFechaDetalle(val: string): { ok: boolean; reason?: 'format' | 'past' } {
    const v = (val || '').trim();
    if (!v) return { ok: true };
    const isIsoFormat = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isIsoFormat(v)) return { ok: false, reason: 'format' };

    const parseIso = (s: string): Date | null => {
      const parts = s.split('-').map(p => Number(p));
      if (parts.length !== 3) return null;
      const [y, m, d] = parts;
      if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
      return new Date(y, m - 1, d);
    };

    const startOfDay = (dt: Date) => { const d = new Date(dt); d.setHours(0,0,0,0); return d; };

    const parsed = parseIso(v);
    if (!parsed) return { ok: false, reason: 'format' };

    if (startOfDay(parsed) < startOfDay(new Date())) return { ok: false, reason: 'past' };
    return { ok: true };
  }

  getFechaError(val: string): string | null {
    const res = this.validarFechaDetalle(val);
    if (res.ok) return null;
    if (res.reason === 'past') return '⚠️ La fecha no puede ser anterior a hoy.';
    return '⚠️ Por favor, introduce una fecha válida en formato AAAA-MM-DD.';
  }
}

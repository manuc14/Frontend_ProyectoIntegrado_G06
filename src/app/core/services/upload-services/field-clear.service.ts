import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FieldClearService {
  /** Clear a specific field error on a component instance by key name */
  clearField(component: any, fieldKey: string): void {
    try { component[fieldKey] = null; } catch {}
  }

  /** Clear multiple field keys at once */
  clearFields(component: any, keys: string[]): void {
    try { keys.forEach(k => component[k] = null); } catch {}
  }

  /** Reset a file input element and optional bound file property on the component */
  clearFileInput(input: HTMLInputElement | null, component?: any, fileProp?: string): void {
    try {
      if (input) input.value = '';
      if (component && fileProp) component[fileProp] = null;
    } catch {}
  }

  /** Clear local thumbnail related state on the component */
  clearLocalThumbnail(component: any): void {
    try {
      component.localThumbnailFile = null;
      component.localThumbnailPreview = null;
      component.localThumbnailUrl = null;
    } catch {}
  }

  /**
   * Remove a tag from a component's tag array at index and clear tagsError when empty.
   * Keeps the operation defensive and idempotent.
   */
  removeTag(component: any, index: number): void {
    try {
      const arr: any[] = component.tags || [];
      arr.splice(index, 1);
      // update back in case it's a copy
      component.tags = arr;
      if (arr.length === 0) {
        component.tagsError = null;
      }
    } catch {}
  }

  // Convenience methods for UploadContentComponent to reduce duplication
  clearVipError(component: any): void {
    this.clearField(component, 'vipError');
  }

  clearDurationError(component: any): void {
    this.clearField(component, 'durationError');
  }

  clearEstadoError(component: any): void {
    this.clearField(component, 'estadoError');
  }

  clearAgeRestrictionError(component: any): void {
    this.clearField(component, 'ageRestrictionError');
  }

  clearResolutionError(component: any): void {
    this.clearField(component, 'resolutionError');
  }
}

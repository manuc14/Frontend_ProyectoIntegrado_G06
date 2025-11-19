// src/app/shared/utils/list-init.util.ts
import {ActivatedRoute, Router} from '@angular/router';
import {FormGroup} from '@angular/forms';
import {FormBaseService} from '../../core/services/form-base.service';
import {ListaCreateRequest} from '../../core/services/public-list.service';
import {SuggestedContent} from '../content-selector/content-selector.component';

export function initializeListComponent(
  router: Router,
  route: ActivatedRoute,
  callback: (listId: string) => void
): void {
  const storedToken = sessionStorage.getItem('authToken');
  if (!storedToken) {
    router.navigate(['/login']);
    return;
  }
  
  // Leer el ID desde sessionStorage en lugar de la URL
  const listId = sessionStorage.getItem('editListId');
  if (!listId) {
    console.error('❌ No se encontró ID de lista en sessionStorage');
    router.navigate(['/creator/catalog']);
    return;
  }
  
  callback(listId);
}

export function parseDuration(duration: string): number {
  const parts = duration.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

export function handleListSubmit(
  form: FormGroup,
  addedContent: SuggestedContent[],
  selectedContentType: 'VIDEO' | 'AUDIO',
  isVisible: boolean,
  formBaseService: FormBaseService,
  formId: string
): ListaCreateRequest | null {
  formBaseService.updateFormState(formId, { error: null });
  if (form.invalid || !form.value.nombre?.trim()) {
    formBaseService.updateFormState(formId, {
      error: 'El nombre de la lista es obligatorio.'
    });
    return null;
  }
  if (addedContent.length === 0) {
    formBaseService.updateFormState(formId, {
      error: 'Debes agregar al menos un contenido a la lista.'
    });
    return null;
  }
  return {
    nombre: form.value.nombre.trim(),
    descripcion: form.value.descripcion?.trim() || '',
    visible: isVisible,
    dominantType: selectedContentType,
    items: addedContent.map(c => ({
      id: c.id,
      titulo: c.title,
      descripcion: c.descripcion,
      miniaturaUrl: c.thumbnail,
      ficheroUrl: c.ficheroUrl ?? '',
      tipo: c.tipo ?? selectedContentType,
      autorAlias: c.autorAlias ?? '',
      duracion: parseDuration(c.duration)
    }))
  };
}

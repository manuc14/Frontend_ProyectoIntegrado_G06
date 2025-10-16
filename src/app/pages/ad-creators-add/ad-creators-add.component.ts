import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../shared/admin-entity-form/admin-entity-form.component';

@Component({
  selector: 'app-adcreatorsadd',
  standalone: true,
  imports: [AdminEntityFormComponent],
  template: `<app-admin-entity-form entityType="creator" submitLabel="Crear creador" successRedirect="/ad-creators"></app-admin-entity-form>`,
  styles: []
})
export class AdminCreatorsAddPage {}

import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../shared/components/admin-entity-form/admin-entity-form.component';
import { AdminEntityService } from '../../core/services/admin-entity.service';

@Component({
  selector: 'app-adcreatorsadd',
  standalone: true,
  imports: [AdminEntityFormComponent],
  template: `
    <app-admin-entity-form
      entityType="creator"
      [service]="creatorService"
      title="Añadir creador de contenido"
      backRoute="/ad-creators"
      successRoute="/ad-creators">
    </app-admin-entity-form>
  `
})
export class AdminCreatorsAddPage {
  constructor(public creatorService: AdminEntityService) {}
}

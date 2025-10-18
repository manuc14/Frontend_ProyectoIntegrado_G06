import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../shared/components/admin-entity-form/admin-entity-form.component';
import { CreatorService } from '../../core/services/creator.service';

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
      successRoute="/ad-creators-add-success">
    </app-admin-entity-form>
  `
})
export class AdminCreatorsAddPage {
  constructor(public creatorService: CreatorService) {}
}

// src/app/pages/ad-creators-add/ad-creators-add.component.ts
import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../../../shared/components/admin-entity-form/admin-entity-form.component';
import { AdminEntityService } from '../../../../core/services/admin-entity.service';

@Component({
  selector: 'app-ad-creators-add',
  standalone: true,
  imports: [AdminEntityFormComponent],
  template: `
    <app-admin-entity-form
      entityType="creator"
      [service]="adminService"
      title="Añadir creador"
      backRoute="/ad-creators"
      successRoute="/ad-creators">
    </app-admin-entity-form>
  `
})
export class AdminCreatorsAddPage {
  constructor(public adminService: AdminEntityService) {}
}

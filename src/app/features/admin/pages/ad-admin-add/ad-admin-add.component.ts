// src/app/pages/ad-admin-add/ad-admin-add.component.ts
import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../../../shared/components/admin-entity-form/admin-entity-form.component';
import { AdminEntityService } from '../../../../core/services/admin-entity.service';

@Component({
  selector: 'app-adadminadd',
  standalone: true,
  imports: [AdminEntityFormComponent],
  template: `
    <app-admin-entity-form
      entityType="admin"
      [service]="adminService"
      title="Añadir administrador"
      backRoute="/ad-admin"
      successRoute="/ad-admin">
    </app-admin-entity-form>
  `
})
export class AdminAdmsAddPage {
  constructor(public adminService: AdminEntityService) {}
}

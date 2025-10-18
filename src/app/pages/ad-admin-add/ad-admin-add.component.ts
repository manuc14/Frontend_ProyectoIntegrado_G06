// src/app/pages/ad-admin-add/ad-admin-add.component.ts
import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../shared/components/admin-entity-form/admin-entity-form.component';
import { AdminService } from '../../core/services/admin.service';

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
      successRoute="/ad-admin-add-success">
    </app-admin-entity-form>
  `
})
export class AdminAdmsAddPage {
  constructor(public adminService: AdminService) {}
}

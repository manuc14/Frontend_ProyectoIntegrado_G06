import { Component } from '@angular/core';
import { AdminEntityEditFormComponent } from '../../shared/admin-entity-edit-form/admin-entity-edit-form.component';

@Component({
  selector: 'app-ad-users-edit',
  standalone: true,
  imports: [AdminEntityEditFormComponent],
  template: '<app-admin-entity-edit-form [entityType]="\'user\'"></app-admin-entity-edit-form>',
  styleUrl: './ad-users-edit.component.scss'
})
export class AdminUsersEditPage {

}

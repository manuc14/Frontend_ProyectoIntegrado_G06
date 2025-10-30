import { Component } from '@angular/core';
import { AdminEntityEditFormComponent } from '../../../../shared/admin-entity-edit-form/admin-entity-edit-form.component';

@Component({
  selector: 'app-ad-admin-edit',
  standalone: true,
  imports: [AdminEntityEditFormComponent],
  template: '<app-admin-entity-edit-form [entityType]="\'admin\'"></app-admin-entity-edit-form>',
  styleUrl: './ad-admin-edit.component.scss'
})
export class AdminAdmsEditPage {
}



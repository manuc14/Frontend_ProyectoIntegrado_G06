import { Component } from '@angular/core';
import { AdminEntityEditFormComponent } from '../../shared/admin-entity-edit-form/admin-entity-edit-form.component';

@Component({
  selector: 'app-ad-creators-edit',
  standalone: true,
  imports: [AdminEntityEditFormComponent],
  template: '<app-admin-entity-edit-form [entityType]="\'creator\'"></app-admin-entity-edit-form>',
  styleUrl: './ad-creators-edit.component.scss'
})
export class AdminCreatorsEditPage {

}

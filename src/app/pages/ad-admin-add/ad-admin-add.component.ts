// src/app/pages/ad-admin-add/ad-admin-add.component.ts
import { Component } from '@angular/core';
import { AdminEntityFormComponent } from '../../shared/admin-entity-form/admin-entity-form.component';

@Component({
  selector: 'app-adadminadd',
  standalone: true,
  imports: [AdminEntityFormComponent],
  template: `<app-admin-entity-form entityType="admin" submitLabel="Crear administrador" successRedirect="/ad-admin"></app-admin-entity-form>`,
  styles: []
})
export class AdminAdmsAddPage {}

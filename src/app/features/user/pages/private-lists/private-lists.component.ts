import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { UserSidebarComponent } from '../../../../shared/components/user-sidebar/user-sidebar.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { PrivateListsContentComponent } from './private-lists-content/private-lists-content.component';

@Component({
  selector: 'app-private-lists',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    UserSidebarComponent,
    FooterComponent,
    PrivateListsContentComponent
  ],
  templateUrl: './private-lists.component.html',
  styleUrls: ['./private-lists.component.scss']
})
export class PrivateListsComponent {
  sidebarCollapsed = false;

  constructor(private router: Router) {}

  onEditList(listId: string): void {
    sessionStorage.setItem('editPrivateListId', listId);
    this.router.navigate(['/edit-private-list']);
  }

  onDeleteList(listId: string): void {
    console.log('DeleteList delegado al content component para:', listId);
  }
}

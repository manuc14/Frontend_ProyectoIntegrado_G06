import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-creator-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './creator-sidebar.component.html',
  styleUrls: ['./creator-sidebar.component.scss']
})
export class CreatorSidebarComponent {
  @Input() collapsed = false;

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }
}

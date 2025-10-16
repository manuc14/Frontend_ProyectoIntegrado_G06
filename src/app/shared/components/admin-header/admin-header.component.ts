import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { slideInFromTop } from '../../../core/animations/animations';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
  ,
  animations: [slideInFromTop]
})
export class AdminHeaderComponent {
  @Input() sidebarVisible = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggle() {
    this.toggleSidebar.emit();
  }
}

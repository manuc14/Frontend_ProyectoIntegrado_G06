import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buttonHover, buttonPress } from '../../core/animations/animations';

@Component({
  selector: 'app-avatar-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-selector.component.html',
  styleUrl: './avatar-selector.component.scss',
  animations: [buttonHover, buttonPress]
})
export class AvatarSelectorComponent {
  @Input() availableAvatars: string[] = [];
  @Input() selectedAvatar: string = '';
  @Input() nombre: string = '';
  @Output() avatarSelected = new EventEmitter<string>();

  selectAvatar(avatar: string): void {
    this.avatarSelected.emit(avatar);
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/admin/admin_default.png';
  }
}

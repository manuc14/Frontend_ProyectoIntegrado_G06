import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '../../shared/footer/footer.component';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss'
})
export class VerifyEmailPage {
  readonly email = signal<string>('');
  private timerId: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    this.email.set(emailParam ?? '');
  }

  onEnterCode() {
    this.router.navigate(['/verify-code'], { queryParams: { email: this.email() } });
  }
}

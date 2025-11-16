import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MFAService } from '../../../../core/services/mfa.service';
import { MFAStateService } from '../../../../core/services/mfa-state.service';
import { fadeIn } from '../../../../core/animations/animations';
import { TwoFactorSetupComponent } from '../2fa-setup/2fa-setup.component';
import { TwoFactorVerifyComponent } from '../2fa-verify/2fa-verify.component';

@Component({
  selector: 'app-2fa-container',
  standalone: true,
  imports: [CommonModule, TwoFactorSetupComponent, TwoFactorVerifyComponent],
  templateUrl: './2fa-container.component.html',
  styleUrl: './2fa-container.component.scss',
  animations: [fadeIn]
})
export class TwoFactorContainerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MFAService);
  readonly mfaStateService = inject(MFAStateService);

  readonly isLoading = this.mfaStateService.isLoading;
  readonly hasError = this.mfaStateService.hasError;
  readonly isSetupFlow = this.mfaStateService.isSetupFlow;
  readonly isVerifyFlow = computed(() => !this.isSetupFlow());

  readonly setupData = signal<any>(null);
  readonly errorMessage = signal<string>('');
  readonly sessionToken = signal<string>('');
  readonly email = signal<string>('');
  readonly verificationToken = signal<string>('');
  readonly nextFactor = signal<string | null>(null);

  private subscription: any;

  constructor() {
    this.subscription = this.mfaStateService.state$.subscribe(state => {
      this.setupData.set(state.setupData);
      this.errorMessage.set(state.error || '');
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    const currentPath = this.router.url;
    
    // Si estamos en /auth/3fa, es el flujo del tercer factor (EMAIL_CODE)
    if (currentPath.includes('/auth/3fa')) {
      const sessionToken = sessionStorage.getItem('twoFactorSessionToken');
      const email = sessionStorage.getItem('loginEmail');
      const verificationToken = sessionStorage.getItem('verificationToken');
      const nextFactor = sessionStorage.getItem('nextFactor');

      if (!sessionToken || !verificationToken || nextFactor !== 'EMAIL_CODE') {
        this.handleError('Sesión expirada. Inicia sesión nuevamente.');
        return;
      }

      this.sessionToken.set(sessionToken);
      this.email.set(email || '');
      this.verificationToken.set(verificationToken);
      this.nextFactor.set('EMAIL_CODE');
      
      console.log('✅ [2FA-Container] Inicializando flujo 3FA (EMAIL_CODE)');
      this.mfaStateService.initializeVerifyFlow(sessionToken, email || '');
      return;
    }

    // Flujo normal del 2FA
    const sessionToken = sessionStorage.getItem('twoFactorSessionToken');
    const email = sessionStorage.getItem('loginEmail');
    const twoFactorType = sessionStorage.getItem('twoFactorType');

    if (!sessionToken || !twoFactorType) {
      this.handleError('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    this.sessionToken.set(sessionToken);
    this.email.set(email || '');

    if (twoFactorType === 'SETUP') {
      this.mfaStateService.initializeSetupFlow(sessionToken, email);
      this.fetchSetupData(sessionToken);
    } else {
      this.mfaStateService.initializeVerifyFlow(sessionToken, email);
    }
  }

  private fetchSetupData(sessionToken: string): void {
    this.mfaStateService.setLoading(true);
    
    this.mfaService.setupDuringLogin(sessionToken).subscribe({
      next: (response) => this.mfaStateService.updateAfterSetup(response),
      error: (error) => {
        const mfaError = this.mfaService.mapErrorToMFAError(error);
        this.mfaStateService.setError(mfaError);
        
        if (mfaError.type === 'EXPIRED_SESSION') {
          this.authService.emitSessionExpired();
        } else if (error.status === 400) {
          const sessionToken = sessionStorage.getItem('twoFactorSessionToken') || '';
          const email = sessionStorage.getItem('loginEmail');
          this.mfaStateService.initializeVerifyFlow(sessionToken, email);
          sessionStorage.setItem('twoFactorType', 'VERIFY');
        } else {
          this.handleError(mfaError.message);
        }
      }
    });
  }

  onSetupCompleted(tokens: any): void {
    this.handleAuthSuccess(tokens);
  }

  onVerifyCompleted(tokens: any): void {
    this.handleAuthSuccess(tokens);
  }

  private handleAuthSuccess(tokens: any): void {
    // Si se requiere un factor adicional (3FA - EMAIL_CODE)
    if (tokens?.state === 'REQUIRES_FACTOR' && tokens?.nextFactor) {
      if (tokens.nextFactor === 'EMAIL_CODE') {
        this.verificationToken.set(tokens.verificationToken || '');
        this.nextFactor.set(tokens.nextFactor);
        sessionStorage.setItem('verificationToken', tokens.verificationToken || '');
        sessionStorage.setItem('nextFactor', tokens.nextFactor);
        sessionStorage.setItem('twoFactorSessionToken', this.sessionToken());
        
        this.router.navigate(['/auth/3fa']);
        return;
      } else {
        // Otro factor requerido, mantener en 2FA
        this.verificationToken.set(tokens.verificationToken || '');
        this.nextFactor.set(tokens.nextFactor);
        sessionStorage.setItem('verificationToken', tokens.verificationToken || '');
        sessionStorage.setItem('nextFactor', tokens.nextFactor);
        this.mfaStateService.initializeVerifyFlow(this.sessionToken(), this.email());
        return;
      }
    }
    
    if (!tokens?.accessToken) {
      this.handleError('Error: No se recibieron tokens del servidor');
      return;
    }

    this.authService.setAccessToken(tokens.accessToken);
    
    if (tokens.refreshToken) {
      this.authService.setRefreshTokenPublic(tokens.refreshToken);
    }

    // Extraer usuario del JWT si no viene en la respuesta
    if (!tokens.user) {
      const userFromToken = this.authService.extractUserFromJWT(tokens.accessToken);
      if (userFromToken) {
        sessionStorage.setItem('currentUser', JSON.stringify(userFromToken));
        console.log('✅ [2FA-Container] Usuario guardado desde JWT:', userFromToken);
      } else {
        console.error('❌ [2FA-Container] No se pudo extraer usuario del JWT');
      }
    } else {
      // Si viene en la respuesta, guardarlo directamente
      sessionStorage.setItem('currentUser', JSON.stringify(tokens.user));
      console.log('✅ [2FA-Container] Usuario guardado desde respuesta:', tokens.user);
    }

    if (tokens.idleTimeoutMillis && tokens.absoluteTimeoutMillis) {
      this.authService.saveSessionConfig(tokens.idleTimeoutMillis, tokens.absoluteTimeoutMillis);
    }

    this.authService.startSessionTimers();
    this.mfaStateService.completeAuth(tokens.accessToken, tokens.refreshToken);
    this.navigateByRole();
  }

  private navigateByRole(): void {
    const userRole = this.authService.getCurrentRole();
    const routes: Record<string, string> = {
      'admin': '/ad-users',
      'creator': '/content-creator'
    };
    
    const target = (userRole && routes[userRole]) || '/catalog';
    setTimeout(() => this.router.navigate([target]), 500);
  }

  private handleError(message: string): void {
    this.mfaStateService.setError({ code: 0, message, type: 'UNKNOWN', retryable: false });
    setTimeout(() => {
      sessionStorage.removeItem('twoFactorSessionToken');
      sessionStorage.removeItem('loginEmail');
      this.router.navigate(['/login']);
    }, 2000);
  }

  onError(message: string): void {
    this.handleError(message);
  }
}

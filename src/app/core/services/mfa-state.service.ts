import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MFAFlowState, MFAState, FactorType, MFAError, MFASetupResponse, MFAVerifyFactorResponse } from '../models/mfa.models';

@Injectable({ providedIn: 'root' })
export class MFAStateService {
  private readonly initialState: MFAFlowState = {
    state: 'PENDING',
    currentFactor: 'TOTP',
    sessionToken: '',
    verificationToken: null,
    setupData: null,
    isLoading: false,
    isVerifying: false,
    error: null,
    attemptCount: 0
  };

  private readonly mfaState$ = new BehaviorSubject<MFAFlowState>(this.initialState);
  public readonly state$: Observable<MFAFlowState> = this.mfaState$.asObservable();
  private readonly mfaStateSignal = signal<MFAFlowState>(this.initialState);
  
  public readonly isLoading = computed(() => this.mfaStateSignal().isLoading);
  public readonly hasError = computed(() => this.mfaStateSignal().error !== null);
  public readonly mfaState = computed(() => this.mfaStateSignal().state);
  public readonly currentFactor = computed(() => this.mfaStateSignal().currentFactor);
  public readonly isSetupFlow = computed(() => this.mfaStateSignal().setupData !== null);
  public readonly isVerifyFlow = computed(() => this.mfaStateSignal().setupData === null && this.mfaStateSignal().sessionToken !== '');

  private get currentState(): MFAFlowState { return this.mfaState$.value; }

  public initializeSetupFlow(sessionToken: string, userEmail: string | null = null): void {
    this.updateState({ sessionToken, state: 'PENDING', currentFactor: 'TOTP', isLoading: false, isVerifying: false, error: null, setupData: null, verificationToken: null, attemptCount: 0 });
  }

  public initializeVerifyFlow(sessionToken: string, userEmail: string | null = null): void {
    this.updateState({ sessionToken, state: 'PENDING', currentFactor: 'TOTP', isLoading: false, isVerifying: false, error: null, setupData: null, verificationToken: null, attemptCount: 0 });
  }

  public updateAfterSetup(setupResponse: MFASetupResponse): void {
    this.updateState({ ...this.currentState, setupData: { sessionToken: setupResponse.sessionToken, qrCode: setupResponse.qrCode, secret: setupResponse.secret, backupCodes: setupResponse.backupCodes }, isLoading: false, error: null });
  }

  public updateAfterVerify(verifyResponse: MFAVerifyFactorResponse): void {
    const newState: MFAState = verifyResponse.state;
    const nextFactor: FactorType | null = verifyResponse.nextFactor || null;
    if (newState === 'PENDING') { this.updateState({ ...this.currentState, isLoading: false }); return; }
    if (newState === 'REQUIRES_FACTOR' && nextFactor === 'EMAIL_CODE') {
      this.updateState({ ...this.currentState, state: 'REQUIRES_FACTOR', currentFactor: 'EMAIL_CODE', verificationToken: verifyResponse.verificationToken || null, isLoading: false, error: null });
      return;
    }
    if (newState === 'COMPLETED') this.updateState({ ...this.currentState, state: 'COMPLETED', isLoading: false, error: null });
  }

  public completeAuth(accessToken: string, refreshToken: string): void {
    // Los tokens ya se guardaron en setAccessToken() y setRefreshTokenPublic()
    // Solo limpiar los datos temporales de 2FA
    sessionStorage.removeItem('twoFactorSessionToken');
    sessionStorage.removeItem('twoFactorType');
    sessionStorage.removeItem('loginEmail');
    sessionStorage.removeItem('verificationToken');
    sessionStorage.removeItem('nextFactor');
  }

  public setError(error: MFAError): void { this.updateState({ ...this.currentState, error: error.message, isLoading: false }); }
  public setLoading(isLoading: boolean): void { this.updateState({ ...this.currentState, isLoading }); }
  private updateState(newState: MFAFlowState): void { this.mfaState$.next(newState); this.mfaStateSignal.set(newState); }
}

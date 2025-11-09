import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MFASetupResponse, MFAVerifyFactorResponse, ThirdFactorStatusResponse, ThirdFactorToggleResponse, FactorType, MFAError, MFAErrorType } from '../models/mfa.models';

@Injectable({ providedIn: 'root' })
export class MFAService {
  private readonly http = inject(HttpClient);
  private readonly MFA_BASE_URL = `${environment.baseApiUrl}/auth/mfa`;

  setupDuringLogin(sessionToken: string): Observable<MFASetupResponse> {
    return this.http.post<MFASetupResponse>(`${this.MFA_BASE_URL}/setup-during-login`, { sessionToken })
      .pipe(catchError(error => this.handleMFAError(error, 'setupDuringLogin')));
  }

  verifyFactor(sessionToken: string, factorType: FactorType, code: string, verificationToken?: string | null): Observable<MFAVerifyFactorResponse> {
    const request: any = { sessionToken, factorType, code };
    if (factorType === 'EMAIL_CODE' && verificationToken) request.verificationToken = verificationToken;
    return this.http.post<MFAVerifyFactorResponse>(`${this.MFA_BASE_URL}/verify-factor`, request)
      .pipe(catchError(error => this.handleMFAError(error, 'verifyFactor')));
  }

  resendEmailCode(verificationToken: string, sessionToken: string): Observable<any> {
    return this.http.post<any>(`${this.MFA_BASE_URL}/resend-email-code`, { verificationToken, sessionToken })
      .pipe(catchError(error => this.handleMFAError(error, 'resendEmailCode')));
  }

  enableThirdFactor(): Observable<ThirdFactorToggleResponse> {
    return this.http.post<ThirdFactorToggleResponse>(`${this.MFA_BASE_URL}/enable-third-factor`, {})
      .pipe(catchError(error => this.handleMFAError(error, 'enableThirdFactor')));
  }

  disableThirdFactor(): Observable<ThirdFactorToggleResponse> {
    return this.http.delete<ThirdFactorToggleResponse>(`${this.MFA_BASE_URL}/disable-third-factor`)
      .pipe(catchError(error => this.handleMFAError(error, 'disableThirdFactor')));
  }

  getThirdFactorStatus(): Observable<ThirdFactorStatusResponse> {
    return this.http.get<ThirdFactorStatusResponse>(`${this.MFA_BASE_URL}/third-factor-status`)
      .pipe(catchError(error => this.handleMFAError(error, 'getThirdFactorStatus')));
  }

  private handleMFAError(error: any, context: string): Observable<never> {
    return throwError(() => this.mapErrorToMFAError(error));
  }

  private readonly ERROR_CONFIG: Record<number, { type: MFAErrorType; retryable: boolean; message: string; }> = {
    400: { type: 'EXPIRED_SESSION', retryable: false, message: 'Sesión inválida' },
    401: { type: 'INVALID_CODE', retryable: true, message: 'Código incorrecto' },
    403: { type: 'FORBIDDEN', retryable: false, message: 'Acceso denegado' },
    429: { type: 'TOO_MANY_ATTEMPTS', retryable: false, message: 'Demasiados intentos fallidos. Por favor, intenta más tarde.' },
    500: { type: 'UNKNOWN', retryable: true, message: 'Error en el servidor. Por favor, intenta más tarde.' },
    502: { type: 'UNKNOWN', retryable: true, message: 'Error en el servidor. Por favor, intenta más tarde.' },
    503: { type: 'NETWORK_ERROR', retryable: true, message: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.' },
    504: { type: 'NETWORK_ERROR', retryable: true, message: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.' },
    0: { type: 'NETWORK_ERROR', retryable: true, message: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.' }
  };

  public mapErrorToMFAError(error: any): MFAError {
    const status = error.status || 0;
    const backendMessage = error.error?.message || error.message || '';
    const config = this.ERROR_CONFIG[status] || { type: 'UNKNOWN' as MFAErrorType, retryable: false, message: 'Ha ocurrido un error. Por favor, intenta más tarde.' };
    
    let errorType = config.type;
    let userMessage = config.message;
    
    if (status === 401) {
      const lowerMessage = backendMessage.toLowerCase();
      if (lowerMessage.includes('sesión ha expirado') || lowerMessage.includes('initiate session')) {
        errorType = 'EXPIRED_SESSION';
        userMessage = backendMessage;
      } else if (lowerMessage.includes('código expirado')) {
        errorType = 'CODE_EXPIRED';
        userMessage = 'Código expirado. Por favor, genera uno nuevo.';
      } else {
        errorType = 'INVALID_CODE';
        userMessage = 'Código incorrecto';
      }
    }
    
    const remainingAttempts = error.error?.remainingAttempts;
    const sessionExpiresInSeconds = error.error?.sessionExpiresInSeconds;
    
    const mfaError: MFAError = { code: status, message: userMessage, type: errorType, retryable: config.retryable };
    
    if (remainingAttempts !== undefined && remainingAttempts !== null) mfaError.remainingAttempts = remainingAttempts;
    if (sessionExpiresInSeconds !== undefined && sessionExpiresInSeconds !== null) mfaError.sessionExpiresInSeconds = sessionExpiresInSeconds;
    
    return mfaError;
  }
}
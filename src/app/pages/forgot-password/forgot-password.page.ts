import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { FormBaseService, FormState } from '../../core/services/form-base.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';
import { Observable, Subscription } from 'rxjs';

/*
 * Interfaz para el formulario de solicitud de restablecimiento
 */
interface ForgotPasswordForm {
  email: FormControl<string>;
}

/*
 * ID único para el formulario
 */
const FORM_ID = 'forgot-password';

/*
 * ForgotPasswordPage
 * Primera etapa del proceso de restablecimiento de contraseña.
 * Permite al usuario ingresar su email para recibir un código de verificación.
 * Incluye navegación por pasos y validación de email en tiempo real.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class ForgotPasswordPage implements OnInit, OnDestroy {
  // Estado del formulario gestionado por FormBaseService
  formState: FormState | null = null;
  formState$: Observable<FormState> | null = null;

  form: FormGroup;

  // Animation states
  shakeForm = false;
  buttonState = 'normal';
  emailFocused = false;

  private formStateSubscription?: Subscription;

  // Propiedades calculadas para compatibilidad con template
  get loading(): boolean {
    return this.formState?.isSubmitting || false;
  }

  get bannerKind(): 'success' | 'error' | null {
    return this.formState?.error ? 'error' : null;
  }

  get bannerText(): string {
    return this.formState?.error ?? '';
  }

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private formBaseService: FormBaseService) {
    // Crear formulario usando FormBaseService
    this.form = this.formBaseService.createFormGroup({
      email: ''
    });

    // Estado del formulario gestionado por FormBaseService
    // Nota: formState$ se asignará en ngOnInit después de crear el estado
  }

  ngOnInit() {
    // Crear estado del formulario
    this.formBaseService.createFormState(FORM_ID, {
      email: ''
    });

    // Asignar el observable del estado después de crearlo
    this.formState$ = this.formBaseService.getFormState(FORM_ID);

    // Suscribirse al estado del formulario
    this.formStateSubscription = this.formState$?.subscribe(state => {
      this.formState = state;
    });
  }

  ngOnDestroy(): void {
    if (this.formStateSubscription) {
      this.formStateSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState(FORM_ID);
  }

  get f() { return this.form.controls; }

  /* Envía solicitud de código de restablecimiento al backend */
  onSendCode() {
    if (this.form.invalid || this.loading) {
      if (this.form.invalid) {
        this.shakeForm = !this.shakeForm;
      }
      return;
    }
    
    this.buttonState = 'pressed';
    this.form.disable();

    const email = this.form.value.email!;
    
    // Llamada real al backend para enviar el código de restablecimiento
    this.api.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.form.enable();
        this.buttonState = 'normal';
        
        // Verificar si el backend devolvió un token válido
        if (!response.resetToken) {
          // Tratar como si fuera un error (correo no registrado)
          this.handleSuccessResponse('Se ha enviado un código de restablecimiento a tu email.');
          
          // Generar un dummy token
          const dummyToken = this.generateDummyToken();
          
          // Navegar a reset-password-code con el dummy token
          this.router.navigate(['/reset-password-code'], { 
            queryParams: { token: dummyToken } 
          });
          return;
        }
        
        // Mostrar mensaje de éxito
        this.handleSuccessResponse(response.message);
        
        // Navegar a reset-password-code con el token recibido
        this.router.navigate(['/reset-password-code'], { 
          queryParams: { token: response.resetToken } 
        });
      },
      error: (error: any) => {
        this.form.enable();
        this.buttonState = 'normal';
        
        // Para no dar pistas a los atacantes, siempre mostrar éxito y crear un dummy token
        this.handleSuccessResponse('Se ha enviado un código de restablecimiento a tu email.');
        
        // Generar un dummy token
        const dummyToken = this.generateDummyToken();
        
        // Navegar a reset-password-code con el dummy token
        this.router.navigate(['/reset-password-code'], { 
          queryParams: { token: dummyToken } 
        });
      }
    });
  }

  /**
   * Maneja respuesta exitosa del backend
   */
  private handleSuccessResponse(message: string): void {
    this.formBaseService.updateFormState(FORM_ID, {
      isSubmitting: false,
      error: null,
      fieldErrors: {}
    });
  }

  /* Navega de vuelta al login */
  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Maneja el estado de focus del input de email
   */
  onEmailFocus(focused: boolean): void {
    this.emailFocused = focused;
  }

  /**
   * Estado de animación para el input de email
   */
  getEmailFocusState(): string {
    return this.emailFocused ? 'focused' : 'normal';
  }

  /**
   * Genera un dummy token para sesiones ficticias, similar al formato real
   */
  private generateDummyToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomString = (len: number) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return randomString(32) + '-' + randomString(50);
  }
}
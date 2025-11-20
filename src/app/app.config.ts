import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // ORDEN CRÍTICO de interceptors:
    // 1. authInterceptor: Agrega el token Bearer a las peticiones
    // 2. errorInterceptor: Maneja errores generales (DEBE ir ANTES del token-refresh para errores)
    // 3. tokenRefreshInterceptor: Renueva tokens en errores 401 (DEBE ir al final)
    // NOTA: En catchError, los interceptors se ejecutan en orden INVERSO
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, tokenRefreshInterceptor])),
    provideAnimations(),
  ]
};

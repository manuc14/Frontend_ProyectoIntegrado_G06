import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/pages/home/home.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { authGuard, publicGuard } from './core/guards/auth.guard';

// Administración de Usuarios
import { AdminUsersPage } from './features/admin/pages/ad-users/ad-users.component';
import { AdminUsersEditPage } from './features/admin/pages/ad-users/ad-users-edit/ad-users-edit.component';

// Administración de Administradores
import { AdminAdmsPage } from './features/admin/pages/ad-admin/ad-admin.component';
import { AdminAdmsAddPage } from './features/admin/pages/ad-admin-add/ad-admin-add.component';
import { AdminAdmsEditPage } from './features/admin/pages/ad-admin-edit/ad-admin-edit.component';

// Administración de Creadores de Contenido
import { AdminCreatorsPage } from './features/admin/pages/ad-creators/ad-creators.component';
import { AdminCreatorsAddPage } from './features/admin/pages/ad-creators-add/ad-creators-add.component';
import { AdminCreatorsEditPage } from './features/admin/pages/ad-creators-edit/ad-creators-edit.component';

// Lightweight placeholders for routes we redirect to; replace them with real pages later.
import { ContentCreatorComponent } from './features/content/pages/content-creator/content-creator.component';
import { UploadContentComponent } from './features/content/pages/upload-content/upload-content.component';
import { CatalogComponent } from './features/content/pages/catalog/catalog.component';
import { ContentPreviewComponent } from './features/content/pages/content-preview/content-preview.component';
import { MediaPlayerComponent } from './features/content/pages/media-player/media-player.component';
import { VerifyEmailPage } from './features/auth/pages/verify-email/verify-email.page';
import { VerifyCodePage } from './features/auth/pages/verify-code/verify-code.page';
import { ForgotPasswordPage } from './features/auth/pages/forgot-password/forgot-password.page';
import { ResetPasswordCodePage } from './features/auth/pages/reset-password-code/reset-password-code.page';
import { NewPasswordPage } from './features/auth/pages/new-password/new-password.page';

export const routes: Routes = [
	{ path: '', component: HomeComponent, canActivate: [publicGuard] },
	{ path: 'signup', component: RegisterComponent, canActivate: [publicGuard] },
	{ path: 'login', component: LoginComponent, canActivate: [publicGuard] },
	{ path: 'verify-email', component: VerifyEmailPage, canActivate: [publicGuard] },
	{ path: 'verify-code', component: VerifyCodePage, canActivate: [publicGuard] },

	// Rutas de Admin (protegidas)
	{ path: 'ad-users', component: AdminUsersPage, canActivate: [authGuard] },
  { path: 'ad-users-edit/:id', component: AdminUsersEditPage, canActivate: [authGuard] },

  { path: 'ad-admin', component: AdminAdmsPage, canActivate: [authGuard] },
  { path: 'ad-admin-add', component: AdminAdmsAddPage, canActivate: [authGuard] },
  { path: 'ad-admin-edit/:id', component: AdminAdmsEditPage, canActivate: [authGuard] },

  { path: 'ad-creators', component: AdminCreatorsPage, canActivate: [authGuard] },
  { path: 'ad-creators-add', component: AdminCreatorsAddPage, canActivate: [authGuard] },
  { path: 'ad-creators-edit/:id', component: AdminCreatorsEditPage, canActivate: [authGuard] },

	// Rutas de Creator (protegidas)
	{ path: 'content-creator', component: ContentCreatorComponent, canActivate: [authGuard] },
	{ path: 'upload-content', component: UploadContentComponent, canActivate: [authGuard] },
	
	// Rutas de User (protegidas)
	{ path: 'catalog', component: CatalogComponent, canActivate: [authGuard] },
	{ path: 'content/preview', component: ContentPreviewComponent, canActivate: [authGuard] },
	{ path: 'player', component: MediaPlayerComponent, canActivate: [authGuard] },
	
	// Rutas de recuperación de contraseña (públicas)
	{ path: 'forgot-password', component: ForgotPasswordPage, canActivate: [publicGuard] },
	{ path: 'reset-password-code', component: ResetPasswordCodePage, canActivate: [publicGuard] },
	{ path: 'new-password', component: NewPasswordPage, canActivate: [publicGuard] },
];

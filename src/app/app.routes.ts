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
import { AdminContentPage } from './features/admin/pages/ad-content/ad-content.component';

// Administración de Creadores de Contenido
import { AdminCreatorsPage } from './features/admin/pages/ad-creators/ad-creators.component';
import { AdminCreatorsAddPage } from './features/admin/pages/ad-creators-add/ad-creators-add.component';
import { AdminCreatorsEditPage } from './features/admin/pages/ad-creators-edit/ad-creators-edit.component';

// Listas Públicas
import { CreatePublicListComponent } from './features/content/pages/create-public-list/create-public-list.component';
import { EditPublicListComponent } from './features/content/pages/edit-public-list/edit-public-list.component';

// Listas Privadas del Usuario
import { PrivateListsComponent } from './features/user/pages/private-lists/private-lists.component';
import { CreatePrivateListComponent } from './features/user/pages/create-private-list/create-private-list.component';
import { EditPrivateListComponent } from './features/user/pages/edit-private-list/edit-private-list.component';

// Perfil de Administrador
import { AdConsultprofileComponent } from './features/admin/pages/ad-consultprofile/ad-consultprofile.component';

// Perfil de Creador de Contenido
import { ContentCreatorConsultprofileComponent } from './features/content/pages/content-creator-consultprofile/content-creator-consultprofile.component';

// Perfil de Usuario
import { UserConsultprofileComponent } from './features/user/pages/user-consultprofile/user-consultprofile.component';

// Lightweight placeholders for routes we redirect to; replace them with real pages later.
import { ContentCreatorComponent } from './features/content/pages/content-creator/content-creator.component';
import { UploadContentComponent } from './features/content/pages/upload-content/upload-content.component';
import { CatalogComponent } from './features/content/pages/catalog/catalog.component';
import { ContentPreviewComponent } from './features/content/pages/content-preview/content-preview.component';
import { MediaPlayerComponent } from './features/content/pages/media-player/media-player.component';
import { SearchComponent } from './features/content/pages/search/search.component';
import { CreatorCatalogComponent } from './features/creator/pages/creator-catalog/creator-catalog.component';
import { VerifyEmailPage } from './features/auth/pages/verify-email/verify-email.page';
import { VerifyCodePage } from './features/auth/pages/verify-code/verify-code.page';
import { ForgotPasswordPage } from './features/auth/pages/forgot-password/forgot-password.page';
import { ResetPasswordCodePage } from './features/auth/pages/reset-password-code/reset-password-code.page';
import { NewPasswordPage } from './features/auth/pages/new-password/new-password.page';
import { TwoFactorContainerComponent } from './features/auth/pages/2fa-container/2fa-container.component';

export const routes: Routes = [
	// Home con publicGuard - bloqueado para autenticados (como login)
	{ path: '', component: HomeComponent, canActivate: [publicGuard] },
	{ path: 'signup', component: RegisterComponent, canActivate: [publicGuard] },
	{ path: 'login', component: LoginComponent, canActivate: [publicGuard] },

	// ===== Verificación de Email (1FA) =====
	{ path: 'auth/verify-email', component: VerifyEmailPage, canActivate: [publicGuard] },
	{ path: 'auth/verify-code', component: VerifyCodePage, canActivate: [publicGuard] },

	// ===== Segundo Factor (2FA - Login y Setup) =====
	{ path: 'auth/2fa', component: TwoFactorContainerComponent, canActivate: [publicGuard] },

	// ===== Redirects para compatibilidad (rutas legacy) =====
	{ path: 'verify-email', redirectTo: 'auth/verify-email', pathMatch: 'full' },
	{ path: 'verify-code', redirectTo: 'auth/verify-code', pathMatch: 'full' },
	{ path: 'qr-code-setup', redirectTo: 'auth/2fa', pathMatch: 'full' },
	{ path: 'verify-otp', redirectTo: 'auth/2fa', pathMatch: 'full' },
	{ path: 'auth/2fa/setup', redirectTo: 'auth/2fa', pathMatch: 'full' },
	{ path: 'auth/2fa/verify-otp', redirectTo: 'auth/2fa', pathMatch: 'full' },

	// Rutas de Admin (protegidas)
	{ path: 'ad-users', component: AdminUsersPage, canActivate: [authGuard] },
  { path: 'ad-users-edit/:id', component: AdminUsersEditPage, canActivate: [authGuard] },

  { path: 'ad-admin', component: AdminAdmsPage, canActivate: [authGuard] },
  { path: 'ad-admin-add', component: AdminAdmsAddPage, canActivate: [authGuard] },
  { path: 'ad-admin-edit/:id', component: AdminAdmsEditPage, canActivate: [authGuard] },

  { path: 'ad-creators', component: AdminCreatorsPage, canActivate: [authGuard] },
  { path: 'ad-creators-add', component: AdminCreatorsAddPage, canActivate: [authGuard] },
  { path: 'ad-creators-edit/:id', component: AdminCreatorsEditPage, canActivate: [authGuard] },

  { path: 'ad-content', component: AdminContentPage, canActivate: [authGuard] },
  { path: 'ad-consultprofile', component: AdConsultprofileComponent, canActivate: [authGuard] },

	// Rutas de Creator (protegidas)
	{ path: 'content-creator', component: ContentCreatorComponent, canActivate: [authGuard] },
	{ path: 'upload-content', component: UploadContentComponent, canActivate: [authGuard] },
	{ path: 'edit-content', component: UploadContentComponent, canActivate: [authGuard] },
	{ path: 'creator/catalog', component: CreatorCatalogComponent, canActivate: [authGuard] },
  { path: 'content-creator-consultprofile', component: ContentCreatorConsultprofileComponent, canActivate: [authGuard] },

  // Rutas de Listas Públicas (protegidas)
  { path: 'create-list', component: CreatePublicListComponent, canActivate: [authGuard] },
  { path: 'edit-list', component: EditPublicListComponent, canActivate: [authGuard] },

  // Rutas de Listas Privadas (protegidas)
  { path: 'my-lists', component: PrivateListsComponent, canActivate: [authGuard] },
  { path: 'create-private-list', component: CreatePrivateListComponent, canActivate: [authGuard] },
  { path: 'edit-private-list', component: EditPrivateListComponent, canActivate: [authGuard] },

  // Rutas de User (protegidas)
	{ path: 'catalog', component: CatalogComponent, canActivate: [authGuard] },
	{ path: 'search', component: SearchComponent, canActivate: [authGuard] },
	{ path: 'content/preview', component: ContentPreviewComponent, canActivate: [authGuard] },
	{ path: 'player', component: MediaPlayerComponent, canActivate: [authGuard] },
  { path: 'user-consultprofile', component: UserConsultprofileComponent, canActivate: [authGuard] },

	// ===== Recuperación de Contraseña =====
	{ path: 'auth/forgot-password', component: ForgotPasswordPage, canActivate: [publicGuard] },
	{ path: 'auth/reset-password-code', component: ResetPasswordCodePage, canActivate: [publicGuard] },
	{ path: 'auth/new-password', component: NewPasswordPage, canActivate: [publicGuard] },

	// Redirects para rutas legacy de recuperación
	{ path: 'forgot-password', redirectTo: 'auth/forgot-password', pathMatch: 'full' },
	{ path: 'reset-password-code', redirectTo: 'auth/reset-password-code', pathMatch: 'full' },
	{ path: 'new-password', redirectTo: 'auth/new-password', pathMatch: 'full' },
];

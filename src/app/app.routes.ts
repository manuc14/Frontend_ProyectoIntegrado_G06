import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/pages/home/home.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { LoginComponent } from './features/auth/pages/login/login.component';

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
import { CatalogPage } from './features/content/pages/catalog/catalog.page';
import { VerifyEmailPage } from './features/auth/pages/verify-email/verify-email.page';
import { VerifyCodePage } from './features/auth/pages/verify-code/verify-code.page';
import { ForgotPasswordPage } from './features/auth/pages/forgot-password/forgot-password.page';
import { ResetPasswordCodePage } from './features/auth/pages/reset-password-code/reset-password-code.page';
import { NewPasswordPage } from './features/auth/pages/new-password/new-password.page';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'signup', component: RegisterComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'verify-email', component: VerifyEmailPage },
	{ path: 'verify-code', component: VerifyCodePage },

	{ path: 'ad-users', component: AdminUsersPage },
  { path: 'ad-users-edit/:id', component: AdminUsersEditPage },

  { path: 'ad-admin', component: AdminAdmsPage },
  { path: 'ad-admin-add', component: AdminAdmsAddPage },
  { path: 'ad-admin-edit/:id', component: AdminAdmsEditPage },

  { path: 'ad-creators', component: AdminCreatorsPage },
  { path: 'ad-creators-add', component: AdminCreatorsAddPage },
  { path: 'ad-creators-edit/:id', component: AdminCreatorsEditPage },

	{ path: 'content-creator', component: ContentCreatorComponent },
	{ path: 'upload-content', component: UploadContentComponent },
	
	{ path: 'catalog', component: CatalogPage },
	{ path: 'forgot-password', component: ForgotPasswordPage },
	{ path: 'reset-password-code', component: ResetPasswordCodePage },
	{ path: 'new-password', component: NewPasswordPage },
];

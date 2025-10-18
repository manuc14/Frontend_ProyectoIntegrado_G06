import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

// Administración de Usuarios
import { AdminUsersPage } from './pages/ad-users/ad-users.component';
import { AdminUsersEditPage } from './pages/ad-users-edit/ad-users-edit.component';

// Administración de Administradores
import { AdminAdmsPage } from './pages/ad-admin/ad-admin.component';
import { AdminAdmsAddPage } from './pages/ad-admin-add/ad-admin-add.component';
import { AdminAdmsEditPage } from './pages/ad-admin-edit/ad-admin-edit.component';

// Administración de Creadores de Contenido
import { AdminCreatorsPage } from './pages/ad-creators/ad-creators.component';
import { AdminCreatorsAddPage } from './pages/ad-creators-add/ad-creators-add.component';
import { AdminCreatorsEditPage } from './pages/ad-creators-edit/ad-creators-edit.component';

// Lightweight placeholders for routes we redirect to; replace them with real pages later.
import { ContentPage } from './pages/content/content.page';
import { CatalogPage } from './pages/catalog/catalog.page';
import { VerifyEmailPage } from './pages/verify-email/verify-email.page';
import { VerifyCodePage } from './pages/verify-code/verify-code.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { ResetPasswordCodePage } from './pages/reset-password-code/reset-password-code.page';
import { NewPasswordPage } from './pages/new-password/new-password.page';

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

	{ path: 'content', component: ContentPage },
	{ path: 'catalog', component: CatalogPage },
	{ path: 'forgot-password', component: ForgotPasswordPage },
	{ path: 'reset-password-code', component: ResetPasswordCodePage },
	{ path: 'new-password', component: NewPasswordPage },
];

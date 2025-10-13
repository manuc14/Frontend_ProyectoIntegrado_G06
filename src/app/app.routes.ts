import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminUsersPage } from './pages/ad-users/ad-users.component';
import { AdminAdmsPage } from './pages/ad-admin/ad-admin.component';
import { AdminCreatorsPage } from './pages/ad-creators/ad-creators.component';
import { AdminAdmsAddPage } from './pages/ad-admin-add/ad-admin-add.component';
import { AdminCreatorsAddPage } from './pages/ad-creators-add/ad-creators-add.component';
import { AdminAdmsAddSuccessPage } from './pages/ad-admin-add-success/ad-admin-add-success.component';
import { AdminCreatorsAddSuccessPage } from './pages/ad-creators-add-success/ad-creators-add-success.component';

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
	{ path: 'verified-email', component: VerifiedEmailPage },
	{ path: 'ad-users', component: AdminUsersPage },
  { path: 'ad-admin', component: AdminAdmsPage },
  { path: 'ad-creators', component: AdminCreatorsPage },
  { path: 'ad-admin-add', component: AdminAdmsAddPage },
  { path: 'ad-creators-add', component: AdminCreatorsAddPage },
  { path: 'ad-admin-add-success', component: AdminAdmsAddSuccessPage },
  { path: 'ad-creators-add-success', component: AdminCreatorsAddSuccessPage },
	{ path: 'content', component: ContentPage },
	{ path: 'catalog', component: CatalogPage },
	{ path: 'forgot-password', component: ForgotPasswordPage },
	{ path: 'reset-password-code', component: ResetPasswordCodePage },
	{ path: 'new-password', component: NewPasswordPage },
];

import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminUsersPage } from './pages/ad-users/ad-users.component';
import { AdminAdmsPage } from './pages/ad-admin/ad-admin.component';
import { AdminCreatorsPage } from './pages/ad-creators/ad-creators.component';
import { AdminAdmsAddPage } from './pages/ad-admin-add/ad-admin-add.component';
import { AdminAdmsAddSuccessPage } from './pages/ad-admin-add-success/ad-admin-add-success.component';

// Lightweight placeholders for routes we redirect to; replace them with real pages later.
import { ContentPage } from './pages/content/content.page';
import { CatalogPage } from './pages/catalog/catalog.page';
import { VerifyEmailPage } from './pages/verify-email/verify-email.page';
import { VerifyCodePage } from './pages/verify-code/verify-code.page';
import { VerifiedEmailPage } from './pages/verified-email/verified-email.page';
import { UploadContentComponent } from './pages/upload-content/upload-content.component';
import { ContentCreatorComponent } from './pages/content-creator/content-creator.component';
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
  { path: 'ad-admin', component: AdminAdmsPage },
  { path: 'ad-creators', component: AdminCreatorsPage },
  { path: 'ad-admin-add', component: AdminAdmsAddPage },
  { path: 'ad-admin-add-success', component: AdminAdmsAddSuccessPage },
	{ path: 'content', component: ContentPage },
	{ path: 'catalog', component: CatalogPage },
	{ path: 'upload-content', component: UploadContentComponent },
	{ path: 'content-creator', component: ContentCreatorComponent },
	{ path: 'forgot-password', component: ForgotPasswordPage },
	{ path: 'reset-password-code', component: ResetPasswordCodePage },
	{ path: 'new-password', component: NewPasswordPage },
];

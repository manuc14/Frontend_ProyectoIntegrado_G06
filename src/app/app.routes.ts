import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

// Lightweight placeholders for routes we redirect to; replace with real pages later.
import { AdminPage } from './pages/admin/admin.page';
import { ContentPage } from './pages/content/content.page';
import { CatalogPage } from './pages/catalog/catalog.page';
import { VerifyEmailPage } from './pages/verify-email/verify-email.page';
import { VerifyCodePage } from './pages/verify-code/verify-code.page';
import { VerifiedEmailPage } from './pages/verified-email/verified-email.page';
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
	{ path: 'admin', component: AdminPage },
	{ path: 'content', component: ContentPage },
	{ path: 'catalog', component: CatalogPage },
	{ path: 'forgot-password', component: ForgotPasswordPage },
	{ path: 'reset-password-code', component: ResetPasswordCodePage },
	{ path: 'new-password', component: NewPasswordPage },
];

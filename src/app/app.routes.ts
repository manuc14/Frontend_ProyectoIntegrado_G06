import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

// Lightweight placeholders for routes we redirect to; replace with real pages later.
import { Component } from '@angular/core';
import { AdminPage } from './pages/admin/admin.page';
import { ContentPage } from './pages/content/content.page';
import { CatalogPage } from './pages/catalog/catalog.page';
@Component({ selector: 'app-forgot', standalone: true, template: '<main class="placeholder"><h2>Recuperar contraseña</h2></main>' })
class ForgotPlaceholder {}

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'signup', component: RegisterComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'admin', component: AdminPage },
	{ path: 'content', component: ContentPage },
	{ path: 'catalog', component: CatalogPage },
	{ path: 'forgot-password', component: ForgotPlaceholder }, //sin asignar todavía
];

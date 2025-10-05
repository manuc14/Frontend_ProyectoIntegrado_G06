import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

// Lightweight placeholders for routes we redirect to; replace with real pages later.
import { Component } from '@angular/core';
@Component({ selector: 'app-admin', standalone: true, template: '<app-header /><main class="placeholder"><h2>Panel de administración</h2></main><app-footer />' })
class AdminPlaceholder {}
@Component({ selector: 'app-content', standalone: true, template: '<app-header /><main class="placeholder"><h2>Gestión de contenidos</h2></main><app-footer />' })
class ContentPlaceholder {}
@Component({ selector: 'app-catalog', standalone: true, template: '<app-header /><main class="placeholder"><h2>Catálogo</h2></main><app-footer />' })
class CatalogPlaceholder {}
@Component({ selector: 'app-forgot', standalone: true, template: '<app-header /><main class="placeholder"><h2>Recuperar contraseña</h2></main><app-footer />' })
class ForgotPlaceholder {}

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'signup', component: RegisterComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'admin', component: AdminPlaceholder }, //sin asignar todavía
	{ path: 'content', component: ContentPlaceholder }, //sin asignar todavía
	{ path: 'catalog', component: CatalogPlaceholder }, //sin asignar todavía
	{ path: 'forgot-password', component: ForgotPlaceholder }, //sin asignar todavía
];

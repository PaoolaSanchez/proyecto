import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PanelAgenciaComponent } from './components/panel-agencia/panel-agencia.component';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { JoinTripComponent } from './components/unirse-viaje/join-trip.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent }, 
  {
    path: 'panel-agencia',
    component: PanelAgenciaComponent
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'unirse-viaje/:codigo', component: JoinTripComponent }
];
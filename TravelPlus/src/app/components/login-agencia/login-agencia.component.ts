import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-agencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-agencia.component.html',
  styleUrls: ['./login-agencia.component.css']
})
export class LoginAgenciaComponent implements OnInit {
  modoRegistro = false;
  loginData = { email: '', password: '' };
  registroData = { nombre: '', email: '', password: '', descripcion: '', logo: '🏢', contacto: '' };
  cargando = false;
  error = '';
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Si ya está logueado, redirigir al panel
    if (this.isBrowser) {
      const agenciaGuardada = localStorage.getItem('agencia');
      if (agenciaGuardada) {
        this.router.navigate(['/panel-agencia']);
      }
    }
  }
  
  login() {
    if (!this.loginData.email || !this.loginData.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }
    
    this.cargando = true;
    this.error = '';
    
    this.http.post<any>(`${this.apiUrl}/agencias/login`, this.loginData)
      .subscribe({
        next: (response) => {
          this.cargando = false;
          if (response.success) {
            if (this.isBrowser) {
              localStorage.setItem('agencia', JSON.stringify(response.agencia));
            }
            this.router.navigate(['/panel-agencia']);
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = error.error?.error || 'Credenciales inválidas';
        }
      });
  }

  registro() {
    if (!this.registroData.nombre || !this.registroData.email || !this.registroData.password) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }
    
    if (this.registroData.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    
    this.cargando = true;
    this.error = '';
    
    this.http.post<any>(`${this.apiUrl}/agencias/registro`, this.registroData)
      .subscribe({
        next: (response) => {
          this.cargando = false;
          if (response.success) {
            if (this.isBrowser) {
              localStorage.setItem('agencia', JSON.stringify(response.agencia));
            }
            this.router.navigate(['/panel-agencia']);
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = error.error?.error || 'Error al registrar agencia';
        }
      });
  }

  toggleModoRegistro() {
    this.modoRegistro = !this.modoRegistro;
    this.error = '';
  }
  
  irInicio() {
    this.router.navigate(['/']);
  }
}

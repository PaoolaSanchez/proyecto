// src/app/components/login/login.component.ts (Ejemplo conceptual)

import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Para la navegación
import { FormsModule } from '@angular/forms'; //  IMPORTA ESTO
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, // Si es un componente standalone
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  
  // 🚨 AÑADE FormsModule al array imports
  imports: [FormsModule,
  CommonModule]
})
export class LoginComponent {
  
  email = '';
  password = '';
  errorMessage: string | null = null;

  // 1. Inyectar el servicio de autenticación y el router
  constructor(
    private authService: AuthService, 
    private router: Router
  ) { }

  /**
   * 2. Método llamado al enviar el formulario
   */
  async onLoginSubmit(): Promise<void> {
    this.errorMessage = null; // Limpiar errores anteriores

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, introduce email y contraseña.';
      return;
    }

    try {
      // 3. Llamar al método login del servicio
      // Este método devuelve una Promise<void> que espera la respuesta del servidor Node.js
      await this.authService.login(this.email, this.password);

      // 4. Si la promesa se resuelve (login exitoso), navegar a la página principal
      this.router.navigate(['/home']); 

    } catch (error: any) {
      // 5. Manejar errores del servidor (ej. 401 Credenciales inválidas)
      console.error('Error durante el login:', error);
      
      // Asume que el servidor devuelve un error JSON con un mensaje
      this.errorMessage = error.error?.error || 'Error de conexión. Inténtalo más tarde.';
    }
  }
}
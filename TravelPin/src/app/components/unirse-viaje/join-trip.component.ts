import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-join-trip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="join-container">
      <div class="join-card">
        <h1>{{ mensaje }}</h1>
        <p *ngIf="nombreViaje">Viaje: {{ nombreViaje }}</p>
        <button (click)="unirseAlViaje()" *ngIf="!errorMensaje">
          Unirme al viaje
        </button>
      </div>
    </div>
  `,
  styles: [`
    .join-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #F7FAFC;
    }
    .join-card {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
    }
  `]
})
export class JoinTripComponent implements OnInit {
  codigoInvitacion: string = '';
  nombreViaje: string = '';
  mensaje: string = 'Cargando...';
  errorMensaje: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.codigoInvitacion = this.route.snapshot.params['codigo'];
    this.validarInvitacion();
  }

  validarInvitacion(): void {
    try {
      const invitaciones = JSON.parse(localStorage.getItem('travelplus_invitaciones') || '{}');
      const invitacion = invitaciones[this.codigoInvitacion];
      
      if (invitacion) {
        this.nombreViaje = invitacion.nombreViaje;
        this.mensaje = '¡Te han invitado a unirte a este viaje!';
      } else {
        this.mensaje = 'Esta invitación no es válida';
        this.errorMensaje = true;
      }
    } catch (error) {
      this.mensaje = 'Error al validar la invitación';
      this.errorMensaje = true;
    }
  }

  unirseAlViaje(): void {
    alert('¡Te has unido al viaje exitosamente!');
    this.router.navigate(['/']);
  }
}
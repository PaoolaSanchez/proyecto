import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-warning-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-warning-modal.component.html',
  styleUrls: ['./auth-warning-modal.component.css']
})
export class AuthWarningModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() login = new EventEmitter<void>();
  @Output() signup = new EventEmitter<void>();

  constructor(private router: Router) {}

  closeModal(): void {
    this.close.emit();
  }

  goToLogin(): void {
    this.login.emit();
  }

  goToSignup(): void {
    this.signup.emit();
  }
}

import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { PerfilModalComponent } from './shared/components/perfil-modal/perfil-modal.component';
import { AuthService } from './core/services/auth.service';
import { SignalrService } from './core/services/signalr.service';
import { ChangeDetectionService } from './core/services/change-detection.service';
import { ChatComponent } from './shared/components/chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
imports: [CommonModule, RouterOutlet, NavbarComponent, PerfilModalComponent, ChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  perfilAbierto = false;

 constructor(
  public auth: AuthService,
  private signalr: SignalrService,
  private cd: ChangeDetectionService,
  private router: Router
) {}

  ngOnInit() {
  this.auth.user$.subscribe(user => {
    if (user) {
      this.signalr.startConnection();
      // Si es conductor, redirigir a su vista
      if (this.auth.isConductor) {
        this.router.navigate(['/conductor']);
      }
    }
  });
}
  
}
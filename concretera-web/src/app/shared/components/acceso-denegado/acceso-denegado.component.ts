import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="denied-page">
      <div class="denied-card">
        <div class="denied-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h1 class="denied-title">Acceso denegado</h1>
        <p class="denied-msg">No tienes permisos para ver esta página.</p>
        <p class="denied-rol">Tu rol actual: <strong>{{ rolLabel }}</strong></p>
        <button class="btn-back" (click)="volver()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver al inicio
        </button>
      </div>
    </div>
  `,
  styles: [`
    .denied-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0c0d0f;
      padding: 24px;
    }

    .denied-card {
      background: #13151a;
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 16px;
      padding: 48px 40px;
      text-align: center;
      max-width: 400px;
      width: 100%;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .denied-icon {
      width: 80px; height: 80px;
      border-radius: 20px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .denied-title {
      font-size: 24px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .denied-msg {
      font-size: 14px;
      color: #5a5e6a;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .denied-rol {
      font-size: 13px;
      color: #5a5e6a;
      margin-bottom: 28px;
    }

    .denied-rol strong { color: #f97316; }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(249,115,22,0.2);
    }

    .btn-back:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.3); }
  `]
})
export class AccesoDenegadoComponent {
  constructor(private auth: AuthService, private router: Router) {}

  get rolLabel(): string {
    const m: Record<string, string> = {
      'ADMIN': 'Administrador', 'DESPACHADOR': 'Despachador', 'CONDUCTOR': 'Conductor',
      '0': 'Administrador', '1': 'Despachador', '2': 'Conductor'
    };
    return m[this.auth.rol] || 'Usuario';
  }

  volver() {
    if (this.auth.isConductor) this.router.navigate(['/conductor']);
    else this.router.navigate(['/fleet']);
  }
}
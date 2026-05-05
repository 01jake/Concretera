import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="login-bg">
      <!-- Noise texture overlay -->
      <div class="noise"></div>

      <!-- Geometric accents -->
      <div class="accent accent-1"></div>
      <div class="accent accent-2"></div>
      <div class="accent accent-3"></div>

      <!-- Card -->
      <div class="login-card">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-mark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 18L12 3L22 18H2Z" fill="white" opacity="0.9"/>
              <rect x="7" y="18" width="10" height="4" rx="1.5" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">Concretera</span>
            <span class="logo-tag">Sistema de despacho</span>
          </div>
        </div>

        <div class="login-divider"></div>

        <h2 class="login-title">Bienvenido de vuelta</h2>
        <p class="login-sub">Ingresa tus credenciales para continuar</p>

        <form [formGroup]="form" (ngSubmit)="onLogin()" class="login-form">

          <div class="field-group">
            <label class="field-label">Correo electrónico</label>
            <div class="field-wrap" [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
              <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                formControlName="email"
                placeholder="admin@concretera.com"
                autocomplete="email"
                class="field-input">
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Contraseña</label>
            <div class="field-wrap" [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
              <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                [type]="showPass ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
                class="field-input">
              <button type="button" class="toggle-pass" (click)="showPass = !showPass">
                <svg *ngIf="!showPass" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showPass" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="remember-row">
            <label class="remember-label">
              <input type="checkbox" class="remember-check">
              <span>Recordarme</span>
            </label>
          </div>

          <button type="submit" class="btn-login" [class.loading]="loading" [disabled]="form.invalid || loading">
            <span *ngIf="!loading">Ingresar al sistema</span>
            <span *ngIf="loading" class="btn-spinner"></span>
          </button>

        </form>

        <p class="login-footer">
          Sistema de gestión de flota · v1.0
        </p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

    .login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0c0d0f;
      position: relative;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      padding: 24px;
    }

    /* Noise */
    .noise {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      opacity: 0.4;
    }

    /* Accent shapes */
    .accent {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }

    .accent-1 {
      width: 400px; height: 400px;
      background: rgba(249,115,22,0.08);
      top: -100px; left: -100px;
    }

    .accent-2 {
      width: 300px; height: 300px;
      background: rgba(59,130,246,0.06);
      bottom: -50px; right: -50px;
    }

    .accent-3 {
      width: 200px; height: 200px;
      background: rgba(249,115,22,0.05);
      bottom: 30%; right: 20%;
    }

    /* Card */
    .login-card {
      position: relative;
      width: 100%;
      max-width: 400px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      animation: slideUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Logo */
    .login-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .logo-mark {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(249,115,22,0.3);
    }

    .logo-text { display: flex; flex-direction: column; }

    .logo-name {
      font-size: 17px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
    }

    .logo-tag {
      font-size: 11px;
      color: #5a5e6a;
    }

    .login-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 24px;
    }

    .login-title {
      font-size: 20px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .login-sub {
      font-size: 13px;
      color: #5a5e6a;
      margin-bottom: 24px;
    }

    /* Form */
    .login-form { display: flex; flex-direction: column; gap: 16px; }

    .field-group { display: flex; flex-direction: column; gap: 6px; }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #8b8f9a;
      letter-spacing: 0.02em;
    }

    .field-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      transition: border-color 0.15s ease;
    }

    .field-wrap:focus-within { border-color: #f97316; }
    .field-wrap.error { border-color: rgba(239,68,68,0.5); }

    .field-icon { color: #5a5e6a; flex-shrink: 0; }

    .field-input {
      flex: 1;
      padding: 11px 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f0f1f3;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
    }

    .field-input::placeholder { color: #3a3e48; }

    .toggle-pass {
      background: none;
      border: none;
      color: #5a5e6a;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s;
    }

    .toggle-pass:hover { color: #8b8f9a; }

    /* Remember */
    .remember-row { display: flex; align-items: center; justify-content: flex-end; }

    .remember-label {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      color: #5a5e6a;
      cursor: pointer;
    }

    .remember-check {
      width: 14px;
      height: 14px;
      accent-color: #f97316;
      cursor: pointer;
    }

    /* Submit */
    .btn-login {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      letter-spacing: 0.01em;
      margin-top: 4px;
      box-shadow: 0 4px 16px rgba(249,115,22,0.25);
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(249,115,22,0.35);
    }

    .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Footer */
    .login-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #3a3e48;
    }

    @media (max-width: 480px) {
      .login-card { padding: 24px; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  showPass = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/fleet']),
      error: () => {
        this.snack.open('Credenciales incorrectas', 'OK', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}

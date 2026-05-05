import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

interface Perfil {
  id: number;
  nombre: string;
  email: string;
  rol: string | number;
  telefono?: string;
  fotoUrl?: string;
  activo: boolean;
  fechaIngreso?: string;
  notas?: string;
  camion?: { id: number; nombre: string; placas: string };
  estadisticas?: { totalPedidos: number };
  ultimosPedidos?: any[];
}

@Component({
  selector: 'app-perfil-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="modal-overlay" (click)="cerrar()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">Mi perfil</h3>
          <button class="modal-close" (click)="cerrar()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Loading -->
        <div class="loading-state" *ngIf="cargando">
          <div class="spinner"></div>
          <span>Cargando perfil...</span>
        </div>

        <div class="modal-body" *ngIf="!cargando && perfil">

          <!-- Tabs -->
          <div class="tabs">
            <button class="tab" [class.active]="tab === 'perfil'" (click)="tab = 'perfil'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Perfil
            </button>
            <button class="tab" [class.active]="tab === 'password'" (click)="tab = 'password'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Contraseña
            </button>
            <button class="tab" [class.active]="tab === 'actividad'" (click)="tab = 'actividad'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Actividad
            </button>
          </div>

          <!-- TAB: PERFIL -->
          <div class="tab-content" *ngIf="tab === 'perfil'">

            <!-- Avatar + info -->
            <div class="profile-hero">
              <div class="avatar-big" [class.has-photo]="perfil.fotoUrl">
                <img *ngIf="perfil.fotoUrl" [src]="perfil.fotoUrl" [alt]="perfil.nombre" class="avatar-img">
                <span *ngIf="!perfil.fotoUrl" class="avatar-letter">
                  {{ perfil.nombre.charAt(0).toUpperCase() }}
                </span>
                <div class="avatar-ring"></div>
              </div>
              <div class="profile-info">
                <div class="profile-name">{{ perfil.nombre }}</div>
                <div class="profile-email">{{ perfil.email }}</div>
                <div class="profile-badges">
                  <span class="rol-badge" [class]="'rol-' + rolClass">{{ rolLabel }}</span>
                  <span class="status-badge active" *ngIf="perfil.activo">Activo</span>
                  <span class="camion-badge" *ngIf="perfil.camion">
                    🚛 {{ perfil.camion.nombre }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-val">{{ perfil.estadisticas?.totalPedidos || 0 }}</div>
                <div class="stat-lbl">Total viajes</div>
              </div>
              <div class="stat-box" *ngIf="perfil.fechaIngreso">
                <div class="stat-val">{{ diasEnServicio }}</div>
                <div class="stat-lbl">Días en servicio</div>
              </div>
              <div class="stat-box" *ngIf="perfil.camion">
                <div class="stat-val">{{ perfil.camion.placas }}</div>
                <div class="stat-lbl">Placas asignadas</div>
              </div>
            </div>

            <!-- Form editar -->
            <div class="section-label">Editar información</div>

            <div class="form-grid">
              <div class="fg">
                <label class="fl">Nombre completo</label>
                <input class="fi" [(ngModel)]="editNombre" placeholder="Tu nombre">
              </div>
              <div class="fg">
                <label class="fl">Email</label>
                <input class="fi" [(ngModel)]="editEmail" type="email" placeholder="tu@email.com">
              </div>
              <div class="fg">
                <label class="fl">Teléfono</label>
                <input class="fi" [(ngModel)]="editTelefono" placeholder="662 123 4567">
              </div>
              <div class="fg">
                <label class="fl">Rol</label>
                <input class="fi" [value]="rolLabel" disabled style="opacity:0.5">
              </div>
            </div>

            <div class="fg full mt-10">
              <label class="fl">URL de foto de perfil</label>
              <div class="foto-input-wrap">
                <input class="fi" [(ngModel)]="editFotoUrl" placeholder="https://...">
                <div class="foto-preview-mini" *ngIf="editFotoUrl">
                  <img [src]="editFotoUrl" alt="preview"
                    (error)="$any($event.target).style.display='none'">
                </div>
              </div>
            </div>

            <button class="btn-save-perfil" (click)="guardarPerfil()" [disabled]="guardando">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
            </button>

          </div>

          <!-- TAB: CONTRASEÑA -->
          <div class="tab-content" *ngIf="tab === 'password'">

            <div class="password-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <div class="fg full">
              <label class="fl">Contraseña actual</label>
              <div class="password-field">
                <input class="fi" [type]="showPass1 ? 'text' : 'password'"
                  [(ngModel)]="passActual" placeholder="Tu contraseña actual">
                <button class="eye-btn" (click)="showPass1 = !showPass1">
                  {{ showPass1 ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="fg full mt-10">
              <label class="fl">Nueva contraseña</label>
              <div class="password-field">
                <input class="fi" [type]="showPass2 ? 'text' : 'password'"
                  [(ngModel)]="passNueva" placeholder="Mínimo 6 caracteres">
                <button class="eye-btn" (click)="showPass2 = !showPass2">
                  {{ showPass2 ? '🙈' : '👁️' }}
                </button>
              </div>
              <!-- Indicador de fuerza -->
              <div class="pass-strength" *ngIf="passNueva">
                <div class="strength-bar">
                  <div class="strength-fill" [style.width.%]="passStrength * 25"
                    [style.background]="passStrengthColor">
                  </div>
                </div>
                <span class="strength-label" [style.color]="passStrengthColor">
                  {{ passStrengthLabel }}
                </span>
              </div>
            </div>

            <div class="fg full mt-10">
              <label class="fl">Confirmar nueva contraseña</label>
              <div class="password-field">
                <input class="fi" [type]="showPass3 ? 'text' : 'password'"
                  [(ngModel)]="passConfirm" placeholder="Repite la nueva contraseña"
                  [class.fi-error]="passConfirm && passNueva !== passConfirm">
                <button class="eye-btn" (click)="showPass3 = !showPass3">
                  {{ showPass3 ? '🙈' : '👁️' }}
                </button>
              </div>
              <span class="pass-error" *ngIf="passConfirm && passNueva !== passConfirm">
                Las contraseñas no coinciden
              </span>
            </div>

            <button class="btn-save-perfil btn-orange" (click)="cambiarPassword()"
              [disabled]="guardando || !passActual || !passNueva || passNueva !== passConfirm || passNueva.length < 6">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Cambiando...' : 'Cambiar contraseña' }}
            </button>

          </div>

          <!-- TAB: ACTIVIDAD -->
          <div class="tab-content" *ngIf="tab === 'actividad'">

            <div class="actividad-header">
              <div class="act-title">Últimos viajes</div>
              <span class="act-sub" *ngIf="perfil.camion">{{ perfil.camion.nombre }}</span>
            </div>

            <div class="actividad-list" *ngIf="perfil.ultimosPedidos?.length">
              <div class="act-item" *ngFor="let p of perfil.ultimosPedidos">
                <div class="act-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13" rx="2"/>
                    <path d="M16 8h4l3 5v3h-7V8z"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div class="act-info">
                  <div class="act-cliente">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                  <div class="act-dir">{{ p.direccion }}</div>
                </div>
                <div class="act-meta">
                  <span [class]="'act-status status-' + statusClass(p.status)">
                    {{ statusLabel(p.status) }}
                  </span>
                  <div class="act-fecha">{{ p.fechaSolicitada | date:'dd/MM HH:mm' }}</div>
                </div>
              </div>
            </div>

            <div class="empty-act" *ngIf="!perfil.ultimosPedidos?.length">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>Sin actividad registrada</p>
            </div>

            <!-- Info adicional -->
            <div class="info-grid mt-16" *ngIf="perfil.fechaIngreso">
              <div class="info-item">
                <div class="info-lbl">Fecha de ingreso</div>
                <div class="info-val">{{ perfil.fechaIngreso | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="info-item" *ngIf="perfil.telefono">
                <div class="info-lbl">Teléfono</div>
                <div class="info-val">{{ perfil.telefono }}</div>
              </div>
              <div class="info-item" *ngIf="perfil.notas">
                <div class="info-lbl">Notas</div>
                <div class="info-val">{{ perfil.notas }}</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 300;
      padding: 24px;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .modal-title { font-size: 16px; font-weight: 700; color: #f0f1f3; }

    .modal-close {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #5a5e6a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .modal-close:hover { background: rgba(255,255,255,0.1); color: #f0f1f3; }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 48px; color: #5a5e6a; font-size: 13px; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 2px;
      padding: 12px 24px 0;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 7px 7px 0 0;
      border: none;
      background: transparent;
      color: #5a5e6a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      border-bottom: 2px solid transparent;
    }

    .tab:hover { color: #8b8f9a; }
    .tab.active { color: #f97316; border-bottom-color: #f97316; }

    /* Tab content */
    .tab-content { padding: 20px 24px; }

    /* Modal body */
    .modal-body {}

    /* Profile hero */
    .profile-hero {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .avatar-big {
      position: relative;
      width: 64px; height: 64px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f97316, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-letter { font-size: 28px; font-weight: 700; color: white; }

    .avatar-ring {
      position: absolute;
      inset: -2px;
      border-radius: 16px;
      border: 2px solid rgba(249,115,22,0.4);
      pointer-events: none;
    }

    .profile-info { flex: 1; min-width: 0; }
    .profile-name { font-size: 16px; font-weight: 700; color: #f0f1f3; margin-bottom: 3px; }
    .profile-email { font-size: 12px; color: #5a5e6a; margin-bottom: 8px; }

    .profile-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .rol-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rol-admin { background: rgba(249,115,22,0.15); color: #f97316; }
    .rol-despachador { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .rol-conductor { background: rgba(34,197,94,0.15); color: #22c55e; }

    .status-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .status-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; }

    .camion-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: rgba(168,85,247,0.1);
      color: #a855f7;
    }

    /* Stats */
    .stats-row {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-box {
      flex: 1;
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      text-align: center;
    }

    .stat-val { font-size: 18px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .stat-lbl { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }

    /* Form */
    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 12px;
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .mt-10 { margin-top: 10px; }
    .mt-16 { margin-top: 16px; }
    .fl { font-size: 11px; font-weight: 600; color: #5a5e6a; }

    .fi {
      padding: 9px 12px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.15s;
      width: 100%;
    }

    .fi:focus { border-color: #f97316; }
    .fi::placeholder { color: #3a3e48; }
    .fi.fi-error { border-color: rgba(239,68,68,0.5); }

    .foto-input-wrap { display: flex; align-items: center; gap: 10px; }
    .foto-preview-mini { width: 36px; height: 36px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.08); }
    .foto-preview-mini img { width: 100%; height: 100%; object-fit: cover; }

    .btn-save-perfil {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 11px;
      margin-top: 16px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(34,197,94,0.2);
    }

    .btn-save-perfil.btn-orange { background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 4px 12px rgba(249,115,22,0.2); }
    .btn-save-perfil:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save-perfil:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    .btn-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

    /* Password */
    .password-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px; height: 64px;
      border-radius: 14px;
      background: rgba(249,115,22,0.08);
      border: 1px solid rgba(249,115,22,0.15);
      margin: 0 auto 20px;
    }

    .password-field { position: relative; display: flex; align-items: center; }
    .password-field .fi { padding-right: 40px; }

    .eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      line-height: 1;
    }

    .pass-strength { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

    .strength-bar {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
      overflow: hidden;
    }

    .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease, background 0.3s ease; }
    .strength-label { font-size: 11px; font-weight: 600; white-space: nowrap; }
    .pass-error { font-size: 11px; color: #ef4444; margin-top: 4px; }

    /* Actividad */
    .actividad-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .act-title { font-size: 13px; font-weight: 600; color: #f0f1f3; }
    .act-sub { font-size: 11px; color: #5a5e6a; }

    .actividad-list { display: flex; flex-direction: column; gap: 0; }

    .act-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .act-item:last-child { border-bottom: none; }

    .act-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(59,130,246,0.1);
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .act-info { flex: 1; min-width: 0; }
    .act-cliente { font-size: 12px; font-weight: 600; color: #f0f1f3; }
    .act-dir { font-size: 11px; color: #5a5e6a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .act-meta { text-align: right; flex-shrink: 0; }
    .act-fecha { font-size: 10px; color: #3a3e48; font-family: 'DM Mono', monospace; margin-top: 3px; }

    .act-status {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-entregado { background: rgba(34,197,94,0.1); color: #22c55e; }
    .status-pendiente { background: rgba(234,179,8,0.1); color: #eab308; }
    .status-asignado { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .status-en_proceso { background: rgba(168,85,247,0.1); color: #a855f7; }
    .status-cancelado { background: rgba(239,68,68,0.1); color: #ef4444; }

    .empty-act {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: #3a3e48;
      font-size: 12px;
    }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .info-item {
      padding: 10px 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 7px;
    }

    .info-lbl { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .info-val { font-size: 13px; color: #f0f1f3; font-weight: 500; }

    @media (max-width: 640px) {
      .modal { max-width: 100%; border-radius: 12px 12px 0 0; }
      .form-grid { grid-template-columns: 1fr; }
      .stats-row { flex-wrap: wrap; }
      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PerfilModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  perfil: Perfil | null = null;
  cargando = false;
  guardando = false;
  tab: 'perfil' | 'password' | 'actividad' = 'perfil';

  // Edit fields
  editNombre = '';
  editEmail = '';
  editTelefono = '';
  editFotoUrl = '';

  // Password fields
  passActual = '';
  passNueva = '';
  passConfirm = '';
  showPass1 = false;
  showPass2 = false;
  showPass3 = false;

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.http.get<Perfil>(`${environment.apiUrl}/perfil`).subscribe({
      next: p => {
        this.perfil = p;
        this.editNombre = p.nombre;
        this.editEmail = p.email;
        this.editTelefono = p.telefono || '';
        this.editFotoUrl = p.fotoUrl || '';
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  get rolLabel(): string {
    const m: Record<string, string> = {
      '0': 'Admin', '1': 'Despachador', '2': 'Conductor',
      'ADMIN': 'Admin', 'DESPACHADOR': 'Despachador', 'CONDUCTOR': 'Conductor'
    };
    return m[this.perfil?.rol?.toString() || ''] || 'Usuario';
  }

  get rolClass(): string {
    const m: Record<string, string> = {
      '0': 'admin', '1': 'despachador', '2': 'conductor',
      'ADMIN': 'admin', 'DESPACHADOR': 'despachador', 'CONDUCTOR': 'conductor'
    };
    return m[this.perfil?.rol?.toString() || ''] || 'admin';
  }

  get diasEnServicio(): number {
    if (!this.perfil?.fechaIngreso) return 0;
    return Math.floor((Date.now() - new Date(this.perfil.fechaIngreso).getTime()) / 86400000);
  }

  get passStrength(): number {
    const p = this.passNueva;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 4);
  }

  get passStrengthColor(): string {
    const c = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    return c[this.passStrength - 1] || '#3a3e48';
  }

  get passStrengthLabel(): string {
    const l = ['Muy débil', 'Débil', 'Regular', 'Fuerte'];
    return l[this.passStrength - 1] || '';
  }

  guardarPerfil() {
    if (!this.editNombre || !this.editEmail) return;
    this.guardando = true;
    this.http.put(`${environment.apiUrl}/perfil`, {
      nombre: this.editNombre,
      email: this.editEmail,
      telefono: this.editTelefono || null,
      fotoUrl: this.editFotoUrl || null
    }).subscribe({
      next: () => {
        this.snack.open('✓ Perfil actualizado', 'OK', { duration: 3000 });
        this.cargar();
        this.guardando = false;
      },
      error: () => {
        this.snack.open('Error al guardar', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  cambiarPassword() {
    if (!this.passActual || !this.passNueva || this.passNueva !== this.passConfirm) return;
    this.guardando = true;
    this.http.put(`${environment.apiUrl}/perfil/password`, {
      passwordActual: this.passActual,
      nuevoPassword: this.passNueva
    }).subscribe({
      next: () => {
        this.snack.open('✓ Contraseña actualizada', 'OK', { duration: 3000 });
        this.passActual = ''; this.passNueva = ''; this.passConfirm = '';
        this.guardando = false;
      },
      error: (err) => {
        this.snack.open(err.error || 'Contraseña actual incorrecta', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  statusClass(status: any): string {
    const m: Record<string, string> = {
      '0':'pendiente','1':'asignado','2':'en_proceso','3':'entregado','4':'cancelado',
      'PENDIENTE':'pendiente','ASIGNADO':'asignado','EN_PROCESO':'en_proceso',
      'ENTREGADO':'entregado','CANCELADO':'cancelado'
    };
    return m[status?.toString()] || '';
  }

  statusLabel(status: any): string {
    const l: Record<string, string> = {
      '0':'Pendiente','1':'Asignado','2':'En proceso','3':'Entregado','4':'Cancelado',
      'PENDIENTE':'Pendiente','ASIGNADO':'Asignado','EN_PROCESO':'En proceso',
      'ENTREGADO':'Entregado','CANCELADO':'Cancelado'
    };
    return l[status?.toString()] || status || '—';
  }

  cerrar() { this.closed.emit(); }
}
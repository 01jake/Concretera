import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

interface Conductor {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  telefono?: string;
  fotoUrl?: string;
  numeroLicencia?: string;
  licenciaVencimiento?: string;
  camionAsignadoId?: number;
  camion?: { id: number; nombre: string; placas: string };
  activo: boolean;
  notas?: string;
  fechaIngreso?: string;
  totalViajes?: number;
  m3Total?: number;
}

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="drivers-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Conductores</h1>
          <p class="page-sub">{{ conductoresFiltrados.length }} conductores · {{ activos }} activos</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input [(ngModel)]="busqueda" (ngModelChange)="filtrar()"
              placeholder="Buscar conductor..." class="search-input">
          </div>
          <button class="btn-new" (click)="abrirModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo conductor
          </button>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button class="tab" [class.active]="filtroActivo === 'todos'" (click)="setFiltro('todos')">
          Todos <span class="tab-count">{{ conductores.length }}</span>
        </button>
        <button class="tab" [class.active]="filtroActivo === 'activos'" (click)="setFiltro('activos')">
          Activos <span class="tab-count">{{ activos }}</span>
        </button>
        <button class="tab" [class.active]="filtroActivo === 'inactivos'" (click)="setFiltro('inactivos')">
          Inactivos <span class="tab-count">{{ conductores.length - activos }}</span>
        </button>
        <button class="tab" [class.active]="filtroActivo === 'sin_camion'" (click)="setFiltro('sin_camion')">
          Sin camión <span class="tab-count">{{ sinCamion }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando conductores...</span>
      </div>

      <!-- Cards -->
      <div class="cards-grid" *ngIf="!cargando">

        <div class="driver-card" *ngFor="let c of conductoresFiltrados"
          [class.inactive]="!c.activo">

          <!-- Card header -->
          <div class="card-head">
            <div class="driver-avatar" [class.has-photo]="c.fotoUrl">
              <img *ngIf="c.fotoUrl" [src]="c.fotoUrl" [alt]="c.nombre" class="avatar-img">
              <span *ngIf="!c.fotoUrl">{{ c.nombre.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="driver-info">
              <div class="driver-name">{{ c.nombre }}</div>
              <div class="driver-email">{{ c.email }}</div>
            </div>
            <div class="card-actions">
              <button class="icon-btn" (click)="abrirModal(c)" title="Editar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn icon-btn-danger" (click)="confirmarEliminar(c)" title="Desactivar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Status + camion -->
          <div class="card-badges">
            <span class="status-badge" [class.active]="c.activo" [class.inactive-b]="!c.activo">
              <div class="s-dot"></div>
              {{ c.activo ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="camion-badge" *ngIf="c.camion">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v3h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              {{ c.camion.nombre }}
            </span>
            <span class="camion-badge sin-camion" *ngIf="!c.camion && c.activo">
              Sin camión asignado
            </span>
          </div>

          <!-- Details -->
          <div class="driver-details">
            <div class="detail-row" *ngIf="c.telefono">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{{ c.telefono }}</span>
            </div>
            <div class="detail-row" *ngIf="c.numeroLicencia">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>Lic: {{ c.numeroLicencia }}</span>
              <span class="lic-vence" [class.vence-pronto]="vencePronto(c)" [class.vencida]="vencida(c)"
                *ngIf="c.licenciaVencimiento">
                · Vence {{ c.licenciaVencimiento | date:'dd/MM/yyyy' }}
              </span>
            </div>
            <div class="detail-row" *ngIf="c.fechaIngreso">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Ingreso: {{ c.fechaIngreso | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Rendimiento -->
          <div class="rendimiento">
            <div class="rend-item">
              <div class="rend-val">{{ c.totalViajes || 0 }}</div>
              <div class="rend-lbl">Viajes</div>
            </div>
            <div class="rend-sep"></div>
            <div class="rend-item">
              <div class="rend-val">{{ c.m3Total || 0 | number:'1.0-0' }}</div>
              <div class="rend-lbl">m³ entregados</div>
            </div>
            <div class="rend-sep"></div>
            <div class="rend-item">
              <div class="rend-val" [class.lic-ok]="!vencePronto(c) && !vencida(c)"
                [class.lic-warn]="vencePronto(c)" [class.lic-bad]="vencida(c)">
                {{ licenciaStatus(c) }}
              </div>
              <div class="rend-lbl">Licencia</div>
            </div>
          </div>

          <!-- Notas -->
          <div class="card-notes" *ngIf="c.notas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ c.notas }}
          </div>

        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="conductoresFiltrados.length === 0 && !cargando">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <p>No hay conductores que coincidan</p>
          <button class="btn-new" (click)="abrirModal()">Registrar conductor</button>
        </div>

      </div>
    </div>

    <!-- ══════════ MODAL CREAR/EDITAR ══════════ -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h3 class="modal-title">{{ editando ? 'Editar conductor' : 'Nuevo conductor' }}</h3>
          <button class="modal-close" (click)="cerrarModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="modal-form">

          <!-- Datos personales -->
          <div class="modal-section">
            <div class="ms-title">Datos personales</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Nombre completo *</label>
                <input class="fi" formControlName="nombre" placeholder="Juan García López">
              </div>
              <div class="fg">
                <label class="fl">Teléfono</label>
                <input class="fi" formControlName="telefono" placeholder="662 123 4567">
              </div>
              <div class="fg">
                <label class="fl">Email *</label>
                <input class="fi" formControlName="email" placeholder="juan@concretera.com">
              </div>
              <div class="fg">
                <label class="fl">{{ editando ? 'Nueva contraseña (opcional)' : 'Contraseña *' }}</label>
                <input class="fi" type="password" formControlName="password"
                  [placeholder]="editando ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'">
              </div>
            </div>
            <div class="fg full mt-8">
              <label class="fl">URL de foto (opcional)</label>
              <input class="fi" formControlName="fotoUrl" placeholder="https://...">
            </div>
          </div>

          <!-- Licencia -->
          <div class="modal-section">
            <div class="ms-title">Licencia de conducir</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Número de licencia</label>
                <input class="fi" formControlName="numeroLicencia" placeholder="HER-123456">
              </div>
              <div class="fg">
                <label class="fl">Fecha de vencimiento</label>
                <input class="fi" type="date" formControlName="licenciaVencimiento">
              </div>
            </div>
          </div>

          <!-- Asignación -->
          <div class="modal-section">
            <div class="ms-title">Asignación</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Camión asignado</label>
                <select class="fi" formControlName="camionAsignadoId">
                  <option [ngValue]="null">Sin asignar</option>
                  <option *ngFor="let cam of camiones" [ngValue]="cam.id">
                    {{ cam.nombre }} — {{ cam.placas }}
                  </option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">Estatus</label>
                <select class="fi" formControlName="activo">
                  <option [ngValue]="true">Activo</option>
                  <option [ngValue]="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div class="modal-section">
            <div class="fg full">
              <label class="fl">Notas internas</label>
              <textarea class="fi fi-area" formControlName="notas" rows="3"
                placeholder="Observaciones, restricciones, etc..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="form.invalid || guardando">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Registrar conductor') }}
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- Confirm delete -->
    <div class="modal-overlay" *ngIf="conductorAEliminar" (click)="conductorAEliminar = null">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="confirm-title">¿Desactivar conductor?</h3>
        <p class="confirm-text">
          <strong>{{ conductorAEliminar?.nombre }}</strong> quedará inactivo pero su historial se conserva.
        </p>
        <div class="confirm-btns">
          <button class="btn-cancel" (click)="conductorAEliminar = null">Cancelar</button>
          <button class="btn-danger" (click)="eliminar()">Sí, desactivar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drivers-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .page-sub { font-size: 13px; color: #5a5e6a; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      transition: border-color 0.15s;
    }

    .search-box:focus-within { border-color: #f97316; }
    .search-box svg { color: #5a5e6a; }

    .search-input {
      padding: 9px 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      width: 200px;
    }

    .search-input::placeholder { color: #3a3e48; }

    .btn-new {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 4px 12px rgba(249,115,22,0.2);
      white-space: nowrap;
    }

    .btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.3); }

    /* Tabs */
    .filter-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 6px;
      color: #5a5e6a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab:hover { border-color: rgba(255,255,255,0.14); color: #8b8f9a; }
    .tab.active { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.25); color: #f97316; }

    .tab-count {
      font-size: 11px;
      padding: 1px 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 10px;
    }

    /* Loading */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: #5a5e6a;
      font-size: 13px;
    }

    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Cards */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .driver-card {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    }

    .driver-card:hover {
      border-color: rgba(255,255,255,0.14);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .driver-card.inactive { opacity: 0.5; }

    /* Avatar */
    .card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .driver-avatar {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .driver-info { flex: 1; min-width: 0; }

    .driver-name {
      font-size: 14px;
      font-weight: 600;
      color: #f0f1f3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .driver-email {
      font-size: 11px;
      color: #5a5e6a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .icon-btn {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      color: #5a5e6a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .icon-btn:hover { background: rgba(255,255,255,0.09); color: #f0f1f3; }
    .icon-btn-danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444; }

    /* Badges */
    .card-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; }
    .status-badge.inactive-b { background: rgba(239,68,68,0.1); color: #ef4444; }

    .s-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

    .camion-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: rgba(59,130,246,0.1);
      color: #60a5fa;
    }

    .camion-badge.sin-camion { background: rgba(234,179,8,0.1); color: #eab308; }

    /* Details */
    .driver-details { display: flex; flex-direction: column; gap: 6px; }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #8b8f9a;
    }

    .detail-row svg { color: #5a5e6a; flex-shrink: 0; }

    .lic-vence { font-size: 11px; }
    .vence-pronto { color: #eab308; }
    .vencida { color: #ef4444; }

    /* Rendimiento */
    .rendimiento {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 7px;
    }

    .rend-item { flex: 1; text-align: center; }
    .rend-val { font-size: 16px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .rend-val.lic-ok { color: #22c55e; }
    .rend-val.lic-warn { color: #eab308; }
    .rend-val.lic-bad { color: #ef4444; }
    .rend-lbl { font-size: 9px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .rend-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.06); flex-shrink: 0; }

    /* Notes */
    .card-notes {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 11px;
      color: #5a5e6a;
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border-radius: 6px;
      border-left: 2px solid rgba(59,130,246,0.3);
    }

    /* Empty */
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px;
      color: #3a3e48;
    }

    .empty-icon {
      width: 56px; height: 56px;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state p { font-size: 13px; color: #5a5e6a; }

    /* ══ MODAL ══ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 24px;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      width: 100%;
      max-width: 560px;
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

    .modal-form { display: flex; flex-direction: column; }

    .modal-section {
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .ms-title {
      font-size: 10px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 12px;
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .mt-8 { margin-top: 8px; }

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
    .fi-area { resize: vertical; min-height: 70px; }
    .fi option { background: #1a1d24; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
    }

    .btn-cancel {
      padding: 9px 18px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 7px;
      color: #8b8f9a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: #f0f1f3; }

    .btn-save {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 7px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(249,115,22,0.2);
    }

    .btn-save:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    /* Confirm */
    .confirm-modal {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 32px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      animation: slideUp 0.2s ease;
    }

    .confirm-icon {
      width: 52px; height: 52px;
      border-radius: 12px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .confirm-title { font-size: 17px; font-weight: 700; color: #f0f1f3; margin-bottom: 8px; }
    .confirm-text { font-size: 13px; color: #5a5e6a; line-height: 1.5; margin-bottom: 24px; }
    .confirm-btns { display: flex; gap: 10px; justify-content: center; }

    .btn-danger {
      padding: 9px 20px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 7px;
      color: #ef4444;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-danger:hover { background: rgba(239,68,68,0.2); }

    .btn-spin {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Responsive */
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) {
      .drivers-page { padding: 16px; }
      .cards-grid { grid-template-columns: 1fr; }
      .search-input { width: 140px; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DriverListComponent implements OnInit {
  conductores: Conductor[] = [];
  conductoresFiltrados: Conductor[] = [];
  camiones: any[] = [];
  cargando = false;
  busqueda = '';
  filtroActivo = 'activos';
  modalAbierto = false;
  editando = false;
  guardando = false;
  conductorAEliminar: Conductor | null = null;
  form: FormGroup;
  private _conductorEditando: Conductor | null = null;

  get activos() { return this.conductores.filter(c => c.activo).length; }
  get sinCamion() { return this.conductores.filter(c => c.activo && !c.camion).length; }

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      telefono: [''],
      fotoUrl: [''],
      numeroLicencia: [''],
      licenciaVencimiento: [''],
      camionAsignadoId: [null],
      activo: [true],
      notas: ['']
    });
  }

  ngOnInit() {
    this.cargar();
    this.cargarCamiones();
  }

  cargar() {
    this.cargando = true;
  this.cdr.detectChanges();

    this.http.get<Conductor[]>(`${environment.apiUrl}/conductores`).subscribe({
      next: c => { this.conductores = c; this.filtrar(); this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  cargarCamiones() {
    this.http.get<any[]>(`${environment.apiUrl}/camiones`).subscribe({
      next: c => this.camiones = c,
      error: () => {}
    });
  }

  filtrar() {
    let base = this.conductores;
    if (this.filtroActivo === 'activos')   base = base.filter(c => c.activo);
    if (this.filtroActivo === 'inactivos') base = base.filter(c => !c.activo);
    if (this.filtroActivo === 'sin_camion') base = base.filter(c => c.activo && !c.camion);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      base = base.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q) ||
        c.numeroLicencia?.toLowerCase().includes(q)
      );
    }
    this.conductoresFiltrados = base;
  }

  setFiltro(f: string) { this.filtroActivo = f; this.filtrar(); }

  abrirModal(conductor?: Conductor) {
    this.editando = !!conductor;
    this._conductorEditando = conductor || null;
    if (conductor) {
      this.form.patchValue({
        ...conductor,
        licenciaVencimiento: conductor.licenciaVencimiento
          ? new Date(conductor.licenciaVencimiento).toISOString().split('T')[0]
          : '',
        password: ''
      });
      if (this.editando) {
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
      }
    } else {
      this.form.reset({ activo: true, camionAsignadoId: null });
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
    this.modalAbierto = true;
  }

  cerrarModal() { this.modalAbierto = false; this._conductorEditando = null; }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    const dto = this.form.value;

    const req = this.editando && this._conductorEditando?.id
      ? this.http.put(`${environment.apiUrl}/conductores/${this._conductorEditando.id}`, dto)
      : this.http.post(`${environment.apiUrl}/conductores`, dto);

    req.subscribe({
      next: () => {
        this.snack.open(this.editando ? '✓ Conductor actualizado' : '✓ Conductor registrado', 'OK', { duration: 3000 });
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snack.open('Error al guardar', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  confirmarEliminar(c: Conductor) { this.conductorAEliminar = c; }

  eliminar() {
    if (!this.conductorAEliminar?.id) return;
    this.http.delete(`${environment.apiUrl}/conductores/${this.conductorAEliminar.id}`).subscribe({
      next: () => {
        this.snack.open('Conductor desactivado', 'OK', { duration: 3000 });
        this.conductorAEliminar = null;
        this.cargar();
      },
      error: () => { this.snack.open('Error', 'OK', { duration: 3000 }); }
    });
  }

  vencePronto(c: Conductor): boolean {
    if (!c.licenciaVencimiento) return false;
    const dias = Math.ceil((new Date(c.licenciaVencimiento).getTime() - Date.now()) / 86400000);
    return dias > 0 && dias <= 30;
  }

  vencida(c: Conductor): boolean {
    if (!c.licenciaVencimiento) return false;
    return new Date(c.licenciaVencimiento).getTime() < Date.now();
  }

  licenciaStatus(c: Conductor): string {
    if (!c.licenciaVencimiento) return '—';
    if (this.vencida(c)) return 'Vencida';
    if (this.vencePronto(c)) {
      const dias = Math.ceil((new Date(c.licenciaVencimiento).getTime() - Date.now()) / 86400000);
      return `${dias}d`;
    }
    return 'Vigente';
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface Inventario {
  id: number;
  m3Disponibles: number;
  capacidadMaxima: number;
  alertaMinima: number;
  ultimaActualizacion: string;
  reservas: number;
  m3Neto: number;
  pctOcupado: number;
  alertaBaja: boolean;
  diasRestantes: number;
  promedioDiario: number;
}

interface Movimiento {
  id: number;
  tipo: string;
  m3: number;
  m3Anterior: number;
  m3Posterior: number;
  descripcion: string;
  fecha: string;
  pedidoId?: number;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="inv-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Inventario de planta</h1>
          <p class="page-sub">Stock de concreto en tiempo real</p>
        </div>
        <div class="header-actions">
          <button class="btn-config" (click)="modalConfig = true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 1.41 14.14M4.93 4.93A10 10 0 0 0 3.52 19.07"/>
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
            </svg>
            Configurar
          </button>
          <button class="btn-new" (click)="modalProduccion = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar producción
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando && !inv">
        <div class="spinner"></div>
        <span>Cargando inventario...</span>
      </div>

      <div *ngIf="inv">

        <!-- Alerta stock bajo -->
        <div class="alerta-stock" *ngIf="inv.alertaBaja">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          ⚠️ Stock bajo — quedan {{ inv.m3Disponibles | number:'1.0-1' }} m³ disponibles.
          Se requiere producción urgente.
        </div>

        <!-- Main gauge + KPIs -->
        <div class="top-section">

          <!-- Gauge principal -->
          <div class="gauge-card">
            <div class="gauge-title">Stock disponible</div>

            <div class="gauge-wrap">
              <svg viewBox="0 0 200 120" class="gauge-svg">
                <!-- Track -->
                <path d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16" stroke-linecap="round"/>
                <!-- Fill -->
                <path d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none" [attr.stroke]="gaugeColor"
                  stroke-width="16" stroke-linecap="round"
                  [attr.stroke-dasharray]="gaugeDash + ' 251'"
                  stroke-dashoffset="0"
                  style="transition: stroke-dasharray 0.8s ease"/>
                <!-- Value -->
                <text x="100" y="85" text-anchor="middle"
                  fill="#f0f1f3" font-size="28" font-weight="700" font-family="DM Mono">
                  {{ inv.m3Disponibles | number:'1.0-0' }}
                </text>
                <text x="100" y="100" text-anchor="middle"
                  fill="#5a5e6a" font-size="11" font-family="DM Sans">
                  m³ disponibles
                </text>
              </svg>

              <div class="gauge-pct" [style.color]="gaugeColor">
                {{ inv.pctOcupado | number:'1.0-0' }}%
              </div>
            </div>

            <!-- Barra lineal -->
            <div class="stock-bar">
              <div class="stock-bar-fill"
                [style.width.%]="inv.pctOcupado"
                [style.background]="gaugeColor">
              </div>
              <div class="stock-bar-alerta"
                [style.left.%]="(inv.alertaMinima / inv.capacidadMaxima) * 100">
              </div>
            </div>

            <div class="stock-labels">
              <span>0</span>
              <span class="alerta-label">Alerta: {{ inv.alertaMinima }} m³</span>
              <span>{{ inv.capacidadMaxima }} m³</span>
            </div>
          </div>

          <!-- KPIs -->
          <div class="kpi-col">
            <div class="kpi-card-inv" [class.alert]="inv.alertaBaja">
              <div class="kci-icon" style="background:rgba(249,115,22,0.1);color:#f97316">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div class="kci-body">
                <div class="kci-val">{{ inv.m3Disponibles | number:'1.0-1' }} m³</div>
                <div class="kci-lbl">Total en planta</div>
              </div>
            </div>

            <div class="kpi-card-inv">
              <div class="kci-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 5v3h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div class="kci-body">
                <div class="kci-val">{{ inv.reservas | number:'1.0-1' }} m³</div>
                <div class="kci-lbl">Reservado (pedidos)</div>
              </div>
            </div>

            <div class="kpi-card-inv" [class.alert]="inv.m3Neto < inv.alertaMinima">
              <div class="kci-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="kci-body">
                <div class="kci-val">{{ inv.m3Neto | number:'1.0-1' }} m³</div>
                <div class="kci-lbl">Disponible neto</div>
              </div>
            </div>

            <div class="kpi-card-inv">
              <div class="kci-icon" style="background:rgba(168,85,247,0.1);color:#a855f7">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="kci-body">
                <div class="kci-val" [class.alert-val]="inv.diasRestantes < 2">
                  {{ inv.diasRestantes === 999 ? '∞' : (inv.diasRestantes | number:'1.0-1') }} días
                </div>
                <div class="kci-lbl">Proyección de agotamiento</div>
              </div>
            </div>

            <div class="kpi-card-inv">
              <div class="kci-icon" style="background:rgba(234,179,8,0.1);color:#eab308">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div class="kci-body">
                <div class="kci-val">{{ inv.promedioDiario | number:'1.0-1' }} m³/día</div>
                <div class="kci-lbl">Consumo promedio</div>
              </div>
            </div>

            <!-- Acciones rápidas -->
            <div class="quick-actions">
              <button class="qa-btn qa-descontar" (click)="modalDescontar = true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Descontar m³
              </button>
              <button class="qa-btn qa-ajuste" (click)="modalAjuste = true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Ajuste manual
              </button>
            </div>
          </div>
        </div>

        <!-- Historial -->
        <div class="historial-section">
          <div class="hist-header">
            <div class="hist-title">Historial de movimientos</div>
            <div class="hist-sub">Últimos {{ movimientos.length }} movimientos</div>
          </div>

          <div class="loading-state" *ngIf="cargandoMov">
            <div class="spinner"></div>
            <span>Cargando movimientos...</span>
          </div>

          <div class="mov-list" *ngIf="!cargandoMov">
            <div class="mov-item" *ngFor="let m of movimientos">
              <div class="mov-icon" [class]="'mov-' + m.tipo.toLowerCase()">
                {{ tipoEmoji(m.tipo) }}
              </div>
              <div class="mov-info">
                <div class="mov-desc">{{ m.descripcion }}</div>
                <div class="mov-fecha">{{ m.fecha | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
              <div class="mov-m3" [class.pos]="m.m3 > 0" [class.neg]="m.m3 < 0">
                {{ m.m3 > 0 ? '+' : '' }}{{ m.m3 | number:'1.0-1' }} m³
              </div>
              <div class="mov-resultado">
                {{ m.m3Posterior | number:'1.0-1' }} m³
              </div>
            </div>

            <div class="empty-mov" *ngIf="movimientos.length === 0">
              <p>Sin movimientos registrados</p>
            </div>

            <button class="btn-more" *ngIf="totalMov > movimientos.length" (click)="cargarMas()">
              Cargar más ({{ totalMov - movimientos.length }} restantes)
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ══ MODAL PRODUCCIÓN ══ -->
    <div class="modal-overlay" *ngIf="modalProduccion" (click)="modalProduccion = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Agregar producción</h3>
          <button class="modal-close" (click)="modalProduccion = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="fg">
            <label class="fl">m³ producidos *</label>
            <input class="fi" type="number" [(ngModel)]="inputM3" placeholder="0" min="0.1" step="0.5">
          </div>
          <div class="fg mt-10">
            <label class="fl">Descripción (opcional)</label>
            <input class="fi" [(ngModel)]="inputDesc" placeholder="Turno matutino, mezcla especial...">
          </div>
          <div class="disponible-preview" *ngIf="inv && inputM3 > 0">
            Nuevo stock: <strong>{{ (inv.m3Disponibles + inputM3) | number:'1.0-1' }} m³</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="modalProduccion = false">Cancelar</button>
          <button class="btn-save btn-green" [disabled]="!inputM3 || inputM3 <= 0 || guardando"
            (click)="agregarProduccion()">
            <div class="btn-spin" *ngIf="guardando"></div>
            {{ guardando ? 'Guardando...' : '+ Agregar producción' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL DESCONTAR ══ -->
    <div class="modal-overlay" *ngIf="modalDescontar" (click)="modalDescontar = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Descontar m³</h3>
          <button class="modal-close" (click)="modalDescontar = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="fg">
            <label class="fl">m³ a descontar *</label>
            <input class="fi" type="number" [(ngModel)]="inputM3" placeholder="0" min="0.1" step="0.5">
          </div>
          <div class="fg mt-10">
            <label class="fl">Descripción *</label>
            <input class="fi" [(ngModel)]="inputDesc" placeholder="Motivo del descuento...">
          </div>
          <div class="disponible-preview warn" *ngIf="inv && inputM3 > 0">
            Nuevo stock: <strong>{{ (inv.m3Disponibles - inputM3) | number:'1.0-1' }} m³</strong>
            <span *ngIf="inputM3 > inv.m3Disponibles" class="error-msg">⚠️ Stock insuficiente</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="modalDescontar = false">Cancelar</button>
          <button class="btn-save btn-red"
            [disabled]="!inputM3 || !inputDesc || inputM3 <= 0 || (inv && inputM3 > inv.m3Disponibles) || guardando"
            (click)="descontar()">
            <div class="btn-spin" *ngIf="guardando"></div>
            {{ guardando ? 'Guardando...' : '− Descontar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL AJUSTE ══ -->
    <div class="modal-overlay" *ngIf="modalAjuste" (click)="modalAjuste = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Ajuste manual de inventario</h3>
          <button class="modal-close" (click)="modalAjuste = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Establece el valor exacto del inventario actual.</p>
          <div class="fg">
            <label class="fl">Nuevo valor de stock (m³) *</label>
            <input class="fi" type="number" [(ngModel)]="inputM3" placeholder="0" min="0" step="0.5">
          </div>
          <div class="fg mt-10">
            <label class="fl">Motivo del ajuste *</label>
            <input class="fi" [(ngModel)]="inputDesc" placeholder="Inventario físico, corrección...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="modalAjuste = false">Cancelar</button>
          <button class="btn-save"
            [disabled]="inputM3 < 0 || !inputDesc || guardando"
            (click)="ajuste()">
            <div class="btn-spin" *ngIf="guardando"></div>
            {{ guardando ? 'Guardando...' : 'Aplicar ajuste' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL CONFIG ══ -->
    <div class="modal-overlay" *ngIf="modalConfig" (click)="modalConfig = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Configurar planta</h3>
          <button class="modal-close" (click)="modalConfig = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="fg">
            <label class="fl">Capacidad máxima (m³)</label>
            <input class="fi" type="number" [(ngModel)]="configCapacidad" min="1">
          </div>
          <div class="fg mt-10">
            <label class="fl">Alerta de stock mínimo (m³)</label>
            <input class="fi" type="number" [(ngModel)]="configAlerta" min="0">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="modalConfig = false">Cancelar</button>
          <button class="btn-save" [disabled]="guardando" (click)="configurar()">
            <div class="btn-spin" *ngIf="guardando"></div>
            {{ guardando ? 'Guardando...' : 'Guardar configuración' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inv-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }

    .header-actions { display: flex; gap: 10px; }

    .btn-config {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #8b8f9a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-config:hover { border-color: rgba(255,255,255,0.16); color: #f0f1f3; }

    .btn-new {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(34,197,94,0.2);
    }

    .btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.3); }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Alerta */
    .alerta-stock {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px;
      color: #ef4444;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: rgba(239,68,68,0.3); }
      50% { border-color: rgba(239,68,68,0.7); }
    }

    /* Top section */
    .top-section {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      margin-bottom: 20px;
    }

    /* Gauge card */
    .gauge-card {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 24px;
    }

    .gauge-title {
      font-size: 11px;
      font-weight: 700;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }

    .gauge-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .gauge-svg { width: 220px; height: 130px; }

    .gauge-pct {
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Mono', monospace;
      margin-top: 8px;
    }

    .stock-bar {
      position: relative;
      height: 8px;
      background: rgba(255,255,255,0.06);
      border-radius: 4px;
      overflow: visible;
      margin: 20px 0 8px;
    }

    .stock-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease;
    }

    .stock-bar-alerta {
      position: absolute;
      top: -4px;
      width: 2px;
      height: 16px;
      background: #ef4444;
      border-radius: 1px;
    }

    .stock-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #5a5e6a;
    }

    .alerta-label { color: #ef4444; font-size: 9px; }

    /* KPI col */
    .kpi-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kpi-card-inv {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      transition: border-color 0.2s;
    }

    .kpi-card-inv.alert { border-color: rgba(239,68,68,0.3); }

    .kci-icon {
      width: 30px; height: 30px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kci-body { flex: 1; }
    .kci-val { font-size: 15px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .kci-val.alert-val { color: #ef4444; }
    .kci-lbl { font-size: 10px; color: #5a5e6a; margin-top: 1px; }

    .quick-actions { display: flex; gap: 8px; margin-top: 4px; }

    .qa-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .qa-descontar {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.2);
    }

    .qa-descontar:hover { background: rgba(239,68,68,0.18); }

    .qa-ajuste {
      background: rgba(234,179,8,0.1);
      color: #eab308;
      border: 1px solid rgba(234,179,8,0.2);
    }

    .qa-ajuste:hover { background: rgba(234,179,8,0.18); }

    /* Historial */
    .historial-section {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
    }

    .hist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .hist-title { font-size: 13px; font-weight: 600; color: #f0f1f3; }
    .hist-sub { font-size: 11px; color: #5a5e6a; }

    .mov-list { display: flex; flex-direction: column; }

    .mov-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    }

    .mov-item:hover { background: rgba(255,255,255,0.02); }
    .mov-item:last-child { border-bottom: none; }

    .mov-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .mov-produccion { background: rgba(34,197,94,0.1); }
    .mov-despacho { background: rgba(59,130,246,0.1); }
    .mov-ajuste { background: rgba(234,179,8,0.1); }
    .mov-merma { background: rgba(239,68,68,0.1); }

    .mov-info { flex: 1; min-width: 0; }
    .mov-desc { font-size: 12px; color: #f0f1f3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mov-fecha { font-size: 10px; color: #5a5e6a; margin-top: 2px; font-family: 'DM Mono', monospace; }

    .mov-m3 {
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Mono', monospace;
      min-width: 80px;
      text-align: right;
    }

    .mov-m3.pos { color: #22c55e; }
    .mov-m3.neg { color: #ef4444; }

    .mov-resultado {
      font-size: 12px;
      color: #5a5e6a;
      font-family: 'DM Mono', monospace;
      min-width: 80px;
      text-align: right;
    }

    .empty-mov { padding: 32px; text-align: center; font-size: 13px; color: #5a5e6a; }

    .btn-more {
      width: 100%;
      padding: 12px;
      background: transparent;
      border: none;
      border-top: 1px solid rgba(255,255,255,0.05);
      color: #5a5e6a;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: color 0.15s;
    }

    .btn-more:hover { color: #f97316; }

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
      max-width: 400px;
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
      padding: 18px 22px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .modal-title { font-size: 15px; font-weight: 700; color: #f0f1f3; }

    .modal-close {
      background: none; border: none; color: #5a5e6a;
      font-size: 16px; cursor: pointer; padding: 4px;
      transition: color 0.15s;
    }

    .modal-close:hover { color: #f0f1f3; }

    .modal-body { padding: 20px 22px; }
    .modal-hint { font-size: 12px; color: #5a5e6a; margin-bottom: 14px; }

    .fg { display: flex; flex-direction: column; gap: 6px; }
    .mt-10 { margin-top: 10px; }
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

    .disponible-preview {
      margin-top: 10px;
      padding: 8px 12px;
      background: rgba(34,197,94,0.08);
      border-radius: 6px;
      font-size: 12px;
      color: #8b8f9a;
    }

    .disponible-preview.warn { background: rgba(239,68,68,0.08); }
    .error-msg { color: #ef4444; margin-left: 6px; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .btn-cancel {
      padding: 8px 16px;
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
      gap: 7px;
      padding: 9px 18px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 7px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-save.btn-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .btn-save.btn-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-spin {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @media (max-width: 900px) {
      .top-section { grid-template-columns: 1fr; }
      .inv-page { padding: 16px; }
    }
  `]
})
export class InventarioComponent implements OnInit, OnDestroy {
  
  inv: Inventario | null = null;
  movimientos: Movimiento[] = [];
  totalMov = 0;
  pagina = 1;
  cargando = false;
  cargandoMov = false;
  guardando = false;

  modalProduccion = false;
  modalDescontar = false;
  modalAjuste = false;
  modalConfig = false;

  inputM3 = 0;
  inputDesc = '';
  configCapacidad = 500;
  configAlerta = 50;

  private refreshSub?: Subscription;

  get gaugeColor(): string {
    if (!this.inv) return '#5a5e6a';
    const pct = this.inv.pctOcupado;
    if (pct <= 20) return '#ef4444';
    if (pct <= 40) return '#f97316';
    if (pct <= 70) return '#eab308';
    return '#22c55e';
  }

  get gaugeDash(): number {
    if (!this.inv) return 0;
    return Math.min(251, (this.inv.pctOcupado / 100) * 251);
  }

constructor(
  private http: HttpClient,
  private snack: MatSnackBar,
  private cdr: ChangeDetectorRef
) {}
  ngOnInit() {
    this.cargar();
    this.cargarMovimientos();
    this.refreshSub = interval(30000).subscribe(() => this.cargar());
  }

  ngOnDestroy() { this.refreshSub?.unsubscribe(); }

  cargar() {
  this.cargando = true;
  this.http.get<Inventario>(`${environment.apiUrl}/inventario`).subscribe({
    next: i => {
      this.inv = i;
      this.configCapacidad = i.capacidadMaxima;
      this.configAlerta = i.alertaMinima;
      this.cargando = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
}

 cargarMovimientos() {
  this.cargandoMov = true;
  this.http.get<any>(`${environment.apiUrl}/inventario/movimientos?page=1&pageSize=20`).subscribe({
    next: r => {
      this.movimientos = r.movimientos;
      this.totalMov = r.total;
      this.pagina = 1;
      this.cargandoMov = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.cargandoMov = false;
      this.cdr.detectChanges();
    }
  });
}

  cargarMas() {
    this.pagina++;
    this.http.get<any>(`${environment.apiUrl}/inventario/movimientos?page=${this.pagina}&pageSize=20`).subscribe({
      next: r => { this.movimientos = [...this.movimientos, ...r.movimientos]; }
    });
  }

  agregarProduccion() {
    if (!this.inputM3 || this.inputM3 <= 0) return;
    this.guardando = true;
    this.http.post(`${environment.apiUrl}/inventario/produccion`, {
      m3: this.inputM3, descripcion: this.inputDesc || null
    }).subscribe({
      next: () => {
        this.snack.open(`✓ +${this.inputM3} m³ agregados`, 'OK', { duration: 3000 });
        this.cerrarModales();
        this.cargar();
        this.cargarMovimientos();
      },
      error: () => {
        this.snack.open('Error al agregar producción', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  descontar() {
    if (!this.inputM3 || !this.inputDesc) return;
    this.guardando = true;
    this.http.post(`${environment.apiUrl}/inventario/descontar`, {
      m3: this.inputM3, descripcion: this.inputDesc
    }).subscribe({
      next: () => {
        this.snack.open(`✓ -${this.inputM3} m³ descontados`, 'OK', { duration: 3000 });
        this.cerrarModales();
        this.cargar();
        this.cargarMovimientos();
      },
      error: (err) => {
        this.snack.open(err.error || 'Error al descontar', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  ajuste() {
    if (!this.inputDesc) return;
    this.guardando = true;
    this.http.post(`${environment.apiUrl}/inventario/ajuste`, {
      m3: this.inputM3, descripcion: this.inputDesc
    }).subscribe({
      next: () => {
        this.snack.open(`✓ Inventario ajustado a ${this.inputM3} m³`, 'OK', { duration: 3000 });
        this.cerrarModales();
        this.cargar();
        this.cargarMovimientos();
      },
      error: () => {
        this.snack.open('Error al ajustar', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  configurar() {
    this.guardando = true;
    this.http.put(`${environment.apiUrl}/inventario/configurar`, {
      capacidadMaxima: this.configCapacidad,
      alertaMinima: this.configAlerta
    }).subscribe({
      next: () => {
        this.snack.open('✓ Configuración guardada', 'OK', { duration: 3000 });
        this.cerrarModales();
        this.cargar();
      },
      error: () => {
        this.snack.open('Error al guardar', 'OK', { duration: 3000 });
        this.guardando = false;
      }
    });
  }

  cerrarModales() {
    this.modalProduccion = false;
    this.modalDescontar = false;
    this.modalAjuste = false;
    this.modalConfig = false;
    this.inputM3 = 0;
    this.inputDesc = '';
    this.guardando = false;
  }

  tipoEmoji(tipo: string): string {
    const e: Record<string, string> = {
      'PRODUCCION': '🟢', 'DESPACHO': '🔵', 'AJUSTE': '🟡', 'MERMA': '🔴',
      '0': '🟢', '1': '🔵', '2': '🟡', '3': '🔴'
    };
    return e[tipo?.toString()] || '⚪';
  }
}

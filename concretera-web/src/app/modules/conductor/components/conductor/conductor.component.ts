import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleMapsModule } from '@angular/google-maps';
import { interval, Subscription } from 'rxjs';
import { SignalrService } from '../../../../core/services/signalr.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, GoogleMapsModule],
  template: `
    <div class="conductor-app">

      <!-- Header móvil -->
      <div class="mobile-header">
        <div class="mh-brand">
          <div class="brand-mark">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M2 14L10 2L18 14H2Z" fill="currentColor"/>
            </svg>
          </div>
          <span>Concretera</span>
        </div>
        <div class="mh-right">
          <div class="conn-dot-wrap" [class.online]="conectado">
            <div class="conn-dot-small"></div>
          </div>
          <button class="btn-logout-mobile" (click)="auth.logout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-full" *ngIf="cargando">
        <div class="spinner-big"></div>
        <p>Cargando tu camión...</p>
      </div>

      <!-- Sin camión asignado -->
      <div class="sin-camion" *ngIf="!cargando && !datos">
        <div class="sc-icon">🚛</div>
        <h2>Sin camión asignado</h2>
        <p>Contacta al administrador para que te asigne un camión.</p>
      </div>

      <!-- Vista principal -->
      <div class="main-content" *ngIf="!cargando && datos">

        <!-- Camión info card -->
        <div class="camion-card" [class]="'status-' + statusClass">
          <div class="cc-left">
            <div class="camion-emoji">🚛</div>
            <div>
              <div class="camion-nombre">{{ datos.camion.nombre }}</div>
              <div class="camion-placas">{{ datos.camion.placas }}</div>
            </div>
          </div>
          <div class="cc-right">
            <div class="status-badge-big" [class]="'sb-' + statusClass">
              {{ statusLabel(datos.camion.status) }}
            </div>
            <div class="capacidad-info">{{ datos.camion.capacidadM3 }} m³ cap.</div>
          </div>
        </div>

        <!-- Pedido activo: mostrar también cuando está regresando -->
        <div class="pedido-activo" *ngIf="pedidoVisible">

          <!-- Timer fase actual -->
          <div class="timer-section">
            <div class="timer-label">{{ faseLabel }}</div>
            <div class="timer-display" [class.timer-urgente]="segundosRestantes < 120">
              {{ tiempoRestante }}
            </div>
            <div class="timer-barra">
              <div class="timer-fill" [style.width.%]="pctFase" [style.background]="faseColor"></div>
            </div>
            <div class="timer-sub">{{ pctFase | number:'1.0-0' }}% completado</div>
          </div>

          <!-- Destino / Regreso -->
          <div class="destino-card">
            <div class="dc-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ statusClass === 'regresando' ? 'Regreso a planta' : 'Destino' }}</span>
            </div>
            <div class="dc-dir" *ngIf="statusClass !== 'regresando'">{{ pedidoVisible.direccion }}</div>
            <div class="dc-dir" *ngIf="statusClass === 'regresando'">Planta Hermosillo</div>
            <div class="dc-cliente" *ngIf="pedidoVisible.cliente && statusClass !== 'regresando'">
              <span class="dc-label">Cliente:</span> {{ pedidoVisible.cliente.nombre }}
            </div>
            <div class="dc-meta">
              <span class="dc-chip" *ngIf="statusClass !== 'regresando'">{{ pedidoVisible.travelMinutos }}min ida</span>
              <span class="dc-chip" *ngIf="statusClass !== 'regresando'">{{ pedidoVisible.descargaMinutos }}min descarga</span>
              <span class="dc-chip" *ngIf="statusClass === 'regresando'">
                {{ datos.camion.travelMinutos || pedidoVisible.travelMinutos }}min regreso
              </span>
              <span class="dc-chip dc-m3">{{ pedidoVisible.m3Solicitados }} m³</span>
            </div>
            <div class="dc-notas" *ngIf="pedidoVisible.notas && statusClass !== 'regresando'">
              📋 {{ pedidoVisible.notas }}
            </div>
          </div>

          <!-- Mapa — origen/destino cambia según fase -->
          <div class="mapa-section">
            <div class="mapa-label">Ruta</div>
            <div class="mapa-wrap">
              <google-map height="240px" width="100%"
                [center]="mapCenter" [zoom]="13" [options]="mapOptions">
                <map-marker [position]="plantaPos" [options]="plantaMarker" title="Planta"></map-marker>
                <map-marker *ngIf="destinoPos && statusClass !== 'regresando'"
                  [position]="destinoPos" [options]="destinoMarker" title="Destino">
                </map-marker>
                <map-marker *ngIf="miPos" [position]="miPos" [options]="miMarker" title="Yo"></map-marker>
                <map-directions-renderer *ngIf="rutaResult" [directions]="rutaResult" [options]="rutaOptions">
                </map-directions-renderer>
              </google-map>
            </div>
          </div>

          <!-- Acciones -->
          <div class="acciones">
            <button class="btn-accion btn-carga"
              *ngIf="statusClass === 'cargando'"
              (click)="confirmarCarga()"
              [disabled]="accionando">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Confirmar carga lista</span>
            </button>

            <button class="btn-accion btn-entrega"
              *ngIf="statusClass === 'descargando'"
              (click)="modalEntregaAbierto = true"
              [disabled]="accionando">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Confirmar entrega</span>
            </button>

            <!-- Info de regreso -->
            <div class="regreso-info" *ngIf="statusClass === 'regresando'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              </svg>
              Regresando a planta — sigue la ruta en el mapa
            </div>
          </div>

        </div>

        <!-- Sin pedido activo Y no regresando -->
        <div class="libre-card" *ngIf="!pedidoVisible">
          <div class="libre-icon">✅</div>
          <div class="libre-title">Camión libre</div>
          <div class="libre-sub">En espera de asignación</div>
        </div>

        <!-- GPS activo -->
        <div class="gps-card">
          <div class="gps-left">
            <div class="gps-icon" [class.gps-on]="gpsActivo">📍</div>
            <div>
              <div class="gps-title">GPS</div>
              <div class="gps-sub">{{ gpsActivo ? 'Enviando ubicación' : 'GPS desactivado' }}</div>
            </div>
          </div>
          <button class="gps-toggle" [class.on]="gpsActivo" (click)="toggleGPS()">
            {{ gpsActivo ? 'Pausar' : 'Activar' }}
          </button>
        </div>

        <!-- Botón reportar incidencia -->
        <button class="btn-incidencia" (click)="modalIncidenciaAbierto = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Reportar incidencia
        </button>

        <!-- Historial -->
        <div class="historial-section" *ngIf="datos.historial?.length">
          <div class="hist-title">Últimos viajes</div>
          <div class="hist-list">
            <div class="hist-item" *ngFor="let h of datos.historial">
              <div class="hi-info">
                <div class="hi-cliente">{{ h.cliente?.nombre || 'Sin cliente' }}</div>
                <div class="hi-dir">{{ h.direccion }}</div>
              </div>
              <div class="hi-meta">
                <div class="hi-m3">{{ h.m3Solicitados }}m³</div>
                <div class="hi-fecha">{{ h.fechaEntrega | date:'dd/MM HH:mm' }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ══ MODAL ENTREGA ══ -->
      <div class="mobile-modal" *ngIf="modalEntregaAbierto">
        <div class="mm-card">
          <div class="mm-header">
            <h3>Confirmar entrega</h3>
            <button class="mm-close" (click)="modalEntregaAbierto = false">✕</button>
          </div>
          <div class="mm-body">
            <div class="mm-section">
              <div class="mm-label">Foto de entrega</div>
              <div class="foto-tap" *ngIf="!fotoPreview" (click)="fotoInput.click()">📷 Tomar foto</div>
              <div class="foto-preview" *ngIf="fotoPreview">
                <img [src]="fotoPreview" alt="foto" class="foto-img">
                <button class="btn-quitar-foto" (click)="quitarFoto()">✕ Quitar</button>
              </div>
              <input #fotoInput type="file" accept="image/*" capture="environment"
                style="display:none" (change)="onFotoSelected($event)">
            </div>
            <div class="mm-section">
              <div class="mm-label">Firma del cliente</div>
              <div class="firma-wrap">
                <canvas #firmaCanvas class="firma-canvas"
                  (mousedown)="startDraw($event)" (mousemove)="draw($event)"
                  (mouseup)="stopDraw()" (mouseleave)="stopDraw()"
                  (touchstart)="startDrawTouch($event)" (touchmove)="drawTouch($event)"
                  (touchend)="stopDraw()">
                </canvas>
                <div class="firma-placeholder" *ngIf="!firmaIniciada">✍️ Firma aquí</div>
              </div>
              <button class="btn-limpiar-firma" (click)="limpiarFirma()">Limpiar firma</button>
            </div>
          </div>
          <button class="btn-confirmar-entrega"
            [disabled]="accionando || (!fotoPreview && !firmaIniciada)"
            (click)="confirmarEntrega()">
            {{ accionando ? 'Confirmando...' : '✅ Confirmar entrega' }}
          </button>
        </div>
      </div>

      <!-- ══ MODAL INCIDENCIA ══ -->
      <div class="mobile-modal" *ngIf="modalIncidenciaAbierto">
        <div class="mm-card">
          <div class="mm-header">
            <h3>Reportar incidencia</h3>
            <button class="mm-close" (click)="modalIncidenciaAbierto = false">✕</button>
          </div>
          <div class="mm-body">
            <div class="mm-section">
              <div class="mm-label">Tipo</div>
              <select class="mm-select" [(ngModel)]="incTipo">
                <option value="LLANTA_PONCHADA">🔧 Llanta ponchada</option>
                <option value="ACCIDENTE">🚨 Accidente</option>
                <option value="DEMORA_EN_OBRA">⏱ Demora en obra</option>
                <option value="FALLA_MECANICA">⚙️ Falla mecánica</option>
                <option value="PROBLEMA_CLIENTE">👤 Problema con cliente</option>
                <option value="OTRO">📋 Otro</option>
              </select>
            </div>
            <div class="mm-section">
              <div class="mm-label">Severidad</div>
              <div class="sev-btns">
                <button *ngFor="let s of severidades" class="sev-btn"
                  [class.active]="incSeveridad === s.val"
                  [style.border-color]="incSeveridad === s.val ? s.color : ''"
                  [style.color]="incSeveridad === s.val ? s.color : ''"
                  (click)="incSeveridad = s.val">
                  {{ s.label }}
                </button>
              </div>
            </div>
            <div class="mm-section">
              <div class="mm-label">Descripción *</div>
              <textarea class="mm-textarea" [(ngModel)]="incDesc"
                placeholder="¿Qué pasó?..." rows="3"></textarea>
            </div>
          </div>
          <button class="btn-reportar-inc"
            [disabled]="!incDesc || accionando"
            (click)="reportarIncidencia()">
            {{ accionando ? 'Reportando...' : '🚨 Reportar incidencia' }}
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .conductor-app { min-height: 100vh; background: #0c0d0f; font-family: 'DM Sans', sans-serif; padding-bottom: 24px; max-width: 480px; margin: 0 auto; }
    .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(12,13,15,0.95); border-bottom: 1px solid rgba(255,255,255,0.07); position: sticky; top: 0; z-index: 50; }
    .mh-brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #f0f1f3; }
    .brand-mark { width: 28px; height: 28px; background: linear-gradient(135deg, #f97316, #fb923c); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: white; }
    .mh-right { display: flex; align-items: center; gap: 10px; }
    .conn-dot-wrap { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
    .conn-dot-wrap.online { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .conn-dot-small { width: 100%; height: 100%; border-radius: 50%; background: inherit; }
    .btn-logout-mobile { width: 32px; height: 32px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .loading-full { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 60vh; color: #5a5e6a; font-size: 14px; }
    .spinner-big { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sin-camion { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; }
    .sc-icon { font-size: 56px; }
    .sin-camion h2 { font-size: 20px; font-weight: 700; color: #f0f1f3; }
    .sin-camion p { font-size: 14px; color: #5a5e6a; }
    .main-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .camion-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid #5a5e6a; }
    .status-libre { border-left-color: #22c55e; }
    .status-cargando { border-left-color: #f97316; }
    .status-en_ruta { border-left-color: #3b82f6; }
    .status-descargando { border-left-color: #a855f7; }
    .status-regresando { border-left-color: #eab308; }
    .status-mantenimiento { border-left-color: #ef4444; }
    .cc-left { display: flex; align-items: center; gap: 12px; }
    .camion-emoji { font-size: 32px; }
    .camion-nombre { font-size: 16px; font-weight: 700; color: #f0f1f3; }
    .camion-placas { font-size: 12px; color: #5a5e6a; font-family: 'DM Mono', monospace; }
    .status-badge-big { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
    .sb-libre { background: rgba(34,197,94,0.1); color: #22c55e; }
    .sb-cargando { background: rgba(249,115,22,0.1); color: #f97316; }
    .sb-en_ruta { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .sb-descargando { background: rgba(168,85,247,0.1); color: #a855f7; }
    .sb-regresando { background: rgba(234,179,8,0.1); color: #eab308; }
    .sb-mantenimiento { background: rgba(239,68,68,0.1); color: #ef4444; }
    .capacidad-info { font-size: 10px; color: #5a5e6a; text-align: center; margin-top: 4px; }
    .pedido-activo { display: flex; flex-direction: column; gap: 12px; }
    .timer-section { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; text-align: center; }
    .timer-label { font-size: 11px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .timer-display { font-size: 48px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; letter-spacing: -0.02em; margin-bottom: 12px; }
    .timer-display.timer-urgente { color: #ef4444; animation: blink 1s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .timer-barra { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
    .timer-fill { height: 100%; border-radius: 3px; transition: width 1s linear; }
    .timer-sub { font-size: 11px; color: #5a5e6a; }
    .destino-card { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; }
    .dc-header { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .dc-dir { font-size: 14px; font-weight: 600; color: #f0f1f3; margin-bottom: 8px; line-height: 1.4; }
    .dc-cliente { font-size: 12px; color: #8b8f9a; margin-bottom: 6px; }
    .dc-label { color: #5a5e6a; }
    .tel-btn { display: inline-block; margin-left: 8px; padding: 2px 8px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 4px; color: #22c55e; font-size: 11px; text-decoration: none; font-weight: 600; }
    .dc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .dc-chip { padding: 3px 8px; border-radius: 4px; font-size: 11px; background: rgba(255,255,255,0.05); color: #8b8f9a; }
    .dc-chip.dc-m3 { background: rgba(249,115,22,0.1); color: #f97316; font-weight: 700; }
    .dc-notas { margin-top: 8px; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; font-size: 12px; color: #5a5e6a; border-left: 2px solid rgba(249,115,22,0.3); }
    .mapa-section { background: #13151a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
    .mapa-label { padding: 10px 14px; font-size: 11px; font-weight: 700; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.08em; }
    .mapa-wrap { border-radius: 0 0 12px 12px; overflow: hidden; }
    .acciones { display: flex; flex-direction: column; gap: 10px; }
    .btn-accion { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-accion:active { transform: scale(0.97); }
    .btn-accion:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-carga { background: linear-gradient(135deg, #f97316, #ea580c); color: white; box-shadow: 0 4px 16px rgba(249,115,22,0.3); }
    .btn-entrega { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
    .regreso-info { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2); border-radius: 10px; font-size: 13px; color: #eab308; font-weight: 600; }
    .libre-card { text-align: center; padding: 32px; background: #13151a; border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; }
    .libre-icon { font-size: 40px; margin-bottom: 8px; }
    .libre-title { font-size: 16px; font-weight: 700; color: #22c55e; }
    .libre-sub { font-size: 13px; color: #5a5e6a; margin-top: 4px; }
    .gps-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
    .gps-left { display: flex; align-items: center; gap: 10px; }
    .gps-icon { font-size: 24px; opacity: 0.4; transition: opacity 0.3s; }
    .gps-icon.gps-on { opacity: 1; animation: gps-pulse 2s infinite; }
    @keyframes gps-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    .gps-title { font-size: 14px; font-weight: 600; color: #f0f1f3; }
    .gps-sub { font-size: 11px; color: #5a5e6a; }
    .gps-toggle { padding: 7px 16px; border-radius: 7px; border: none; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; background: rgba(255,255,255,0.06); color: #5a5e6a; transition: all 0.15s; }
    .gps-toggle.on { background: rgba(34,197,94,0.15); color: #22c55e; }
    .btn-incidencia { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; color: #ef4444; font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-incidencia:active { transform: scale(0.97); }
    .historial-section { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
    .hist-title { padding: 12px 16px; font-size: 12px; font-weight: 700; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .hist-list { display: flex; flex-direction: column; }
    .hist-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .hist-item:last-child { border-bottom: none; }
    .hi-info { flex: 1; min-width: 0; }
    .hi-cliente { font-size: 13px; font-weight: 600; color: #f0f1f3; }
    .hi-dir { font-size: 11px; color: #5a5e6a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hi-meta { text-align: right; flex-shrink: 0; margin-left: 12px; }
    .hi-m3 { font-size: 14px; font-weight: 700; color: #f97316; font-family: 'DM Mono', monospace; }
    .hi-fecha { font-size: 10px; color: #3a3e48; font-family: 'DM Mono', monospace; margin-top: 2px; }
    .mobile-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: flex-end; z-index: 200; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .mm-card { background: #13151a; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px 20px 0 0; width: 100%; padding: 20px; animation: slideUp 0.25s ease; max-height: 90vh; overflow-y: auto; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .mm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .mm-header h3 { font-size: 16px; font-weight: 700; color: #f0f1f3; }
    .mm-close { background: none; border: none; color: #5a5e6a; font-size: 18px; cursor: pointer; padding: 4px; }
    .mm-body { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
    .mm-section { display: flex; flex-direction: column; gap: 8px; }
    .mm-label { font-size: 11px; font-weight: 700; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.07em; }
    .foto-tap { padding: 24px; text-align: center; background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,255,255,0.1); border-radius: 10px; font-size: 15px; color: #8b8f9a; cursor: pointer; }
    .foto-preview { position: relative; }
    .foto-img { width: 100%; border-radius: 10px; max-height: 180px; object-fit: cover; }
    .btn-quitar-foto { position: absolute; top: 8px; right: 8px; padding: 4px 10px; background: rgba(239,68,68,0.9); border: none; border-radius: 6px; color: white; font-size: 12px; cursor: pointer; }
    .firma-wrap { position: relative; }
    .firma-canvas { width: 100%; height: 130px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; touch-action: none; display: block; }
    .firma-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #3a3e48; pointer-events: none; }
    .btn-limpiar-firma { background: none; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #5a5e6a; font-size: 12px; font-family: 'DM Sans', sans-serif; padding: 5px 12px; cursor: pointer; width: fit-content; }
    .mm-select { padding: 10px 12px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #f0f1f3; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
    .mm-select option { background: #1a1d24; }
    .sev-btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .sev-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #8b8f9a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .sev-btn.active { font-weight: 700; }
    .mm-textarea { padding: 10px 12px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #f0f1f3; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: none; min-height: 80px; }
    .btn-confirmar-entrega, .btn-reportar-inc { width: 100%; padding: 16px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-confirmar-entrega { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
    .btn-reportar-inc { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; box-shadow: 0 4px 16px rgba(239,68,68,0.3); }
    .btn-confirmar-entrega:disabled, .btn-reportar-inc:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ConductorComponent implements OnInit, OnDestroy {
  @ViewChild('firmaCanvas') firmaCanvasRef!: ElementRef<HTMLCanvasElement>;

  datos: any = null;
  cargando = false;
  accionando = false;
  conectado = false;

  modalEntregaAbierto = false;
  modalIncidenciaAbierto = false;

  fotoPreview = '';
  fotoBase64 = '';
  firmaIniciada = false;
  private ctx!: CanvasRenderingContext2D;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;

  incTipo = 'LLANTA_PONCHADA';
  incSeveridad = 'MEDIA';
  incDesc = '';

  gpsActivo = false;
  miPos: any = null;

  severidades = [
    { val: 'BAJA', label: '🟢 Baja', color: '#22c55e' },
    { val: 'MEDIA', label: '🟡 Media', color: '#eab308' },
    { val: 'ALTA', label: '🟠 Alta', color: '#f97316' },
    { val: 'CRITICA', label: '🔴 Crítica', color: '#ef4444' },
  ];

  private subs = new Subscription();
  private refreshSub?: Subscription;
  private gpsSub?: Subscription;
  private watchId?: number;

  plantaPos = { lat: 29.0729, lng: -110.9559 };
  mapCenter = { lat: 29.0729, lng: -110.9559 };
  rutaResult: any = null;
  private directionsService: any;

  mapOptions: any = {
    mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1d24' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#5a5e6a' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22262f' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0d0f' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    ]
  };

  plantaMarker: any = { icon: { path: 0, scale: 10, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } };
  destinoMarker: any = { icon: { path: 3, scale: 7, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } };
  miMarker: any = { icon: { path: 0, scale: 8, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } };
  rutaOptions: any = { suppressMarkers: true, polylineOptions: { strokeColor: '#f97316', strokeWeight: 4 } };

  private timerSub?: Subscription;
  segundosRestantes = 0;

  // ← FIX 2: Pedido visible también cuando está regresando
 

  constructor(
    private http: HttpClient,
    private snack: MatSnackBar,
    private signalr: SignalrService,
    public auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    
    this.subs.add(this.auth.user$.subscribe(user => {
      if (user) this.cdr.detectChanges();
    }));

  setTimeout(() => this.cargar(), 50); 
  this.refreshSub = interval(15000).subscribe(() => this.cargar());
    this.refreshSub = interval(15000).subscribe(() => this.cargar());
    this.subs.add(this.signalr.connected$.subscribe(c => this.conectado = c));

    // ← FIX 1: Actualizar cuando cambia status por SignalR y recargar datos
    this.subs.add(this.signalr.trucks$.subscribe(trucks => {
      if (this.datos?.camion) {
        const updated = trucks.find((t: any) => t.id === this.datos.camion.id);
        if (updated) {
          this.ngZone.run(() => {
            const statusAnterior = this.datos.camion.status;
            this.datos.camion = { ...this.datos.camion, ...updated };
            // Si cambió el status, recargar datos completos y recalcular ruta
            if (statusAnterior !== updated.status) {
              this.cargar();
            } else {
              this.initTimer();
            }
            this.cdr.detectChanges();
          });
        }
      }
    }));

    this.subs.add(this.signalr.nuevaRuta$.subscribe(ruta => {
      if (!ruta) return;
      this.ngZone.run(() => {
        this.snack.open('🚛 Nueva ruta asignada — activando GPS', 'OK', { duration: 4000 });
        this.cargar();
        if (!this.gpsActivo) this.toggleGPS();
        this.cdr.detectChanges();
      });
    }));

    this.subs.add(this.signalr.ubicaciones$.subscribe(ub => {
      if (!ub || !this.datos?.camion) return;
      if (ub.camionId === this.datos.camion.id) {
        this.ngZone.run(() => {
          this.datos.camion.travelMinutos = ub.travelMinutosRestantes;
          this.initTimer();
          this.cdr.detectChanges();
        });
      }
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.gpsSub?.unsubscribe();
    this.timerSub?.unsubscribe();
    if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
  }
calcularEstado() {
  const s = this.datos?.camion?.status;
  const m: Record<string, string> = {
    '0':'libre','1':'cargando','2':'en_ruta','3':'descargando','4':'regresando','5':'mantenimiento',
    'LIBRE':'libre','CARGANDO':'cargando','EN_RUTA':'en_ruta','DESCARGANDO':'descargando',
    'REGRESANDO':'regresando','MANTENIMIENTO':'mantenimiento'
  };
  this.statusClass = m[s?.toString()] || 'libre';

  // pedidoVisible
  if (this.datos?.pedidoActivo) {
    this.pedidoVisible = this.datos.pedidoActivo;
  } else if (this.statusClass === 'regresando' && this.datos?.historial?.length > 0) {
    this.pedidoVisible = this.datos.historial[0];
  } else {
    this.pedidoVisible = null;
  }

  // destinoPos
  const p = this.datos?.pedidoActivo;
  this.destinoPos = (p?.lat && p?.lng) ? { lat: p.lat, lng: p.lng } : null;

  // faseLabel
  const labels: Record<string, string> = {
    libre: '✅ Libre', cargando: '🔶 Cargando', en_ruta: '🔵 En ruta',
    descargando: '🟣 Descargando', regresando: '🟡 Regresando a planta', mantenimiento: '🔴 Mantenimiento'
  };
  this.faseLabel = labels[this.statusClass] || 'En espera';

  // faseColor
  const colors: Record<string, string> = {
    cargando: '#f97316', en_ruta: '#3b82f6', descargando: '#a855f7', regresando: '#eab308'
  };
  this.faseColor = colors[this.statusClass] || '#5a5e6a';
}
 cargar() {
  this.cargando = !this.datos;
  this.http.get<any>(`${environment.apiUrl}/conductor/mi-camion`).subscribe({
    next: d => {
      this.ngZone.run(() => {
        this.datos = d;
        this.cargando = false;
        this.calcularEstado();
        this.initTimer();
        this.initRuta();
        setTimeout(() => {
          this.cdr.detectChanges();
          this.initCanvas();
        }, 0);
      });
    },
    error: () => {
      this.ngZone.run(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }
  });
}

  initTimer() {
  this.timerSub?.unsubscribe();
  this.calcularEstado(); // ← agrega esto al inicio

  if (!this.datos?.camion) return;
  const c = this.datos.camion;

  const tiempos: Record<string, number> = {
    cargando: 10, en_ruta: c.travelMinutos,
    descargando: c.descargaMinutos, regresando: c.travelMinutos
  };

  const totalMin = tiempos[this.statusClass] || 0;
  if (!totalMin) return;

  const inicio = c.ultimaActualizacion;
  if (!inicio) return;

  const totalSeg = totalMin * 60;
  const fechaInicio = new Date(inicio.endsWith('Z') ? inicio : inicio + 'Z');
  const transcurrido = Math.max(0, Math.floor((Date.now() - fechaInicio.getTime()) / 1000));
  this.segundosRestantes = Math.max(0, totalSeg - transcurrido);

  this.actualizarDisplayTimer(totalSeg);

  this.timerSub = interval(1000).subscribe(() => {
    this.ngZone.run(() => {
      if (this.segundosRestantes > 0) this.segundosRestantes--;
      this.actualizarDisplayTimer(totalSeg);
      this.cdr.detectChanges();
    });
  });
}
actualizarDisplayTimer(totalSeg: number) {
  const m = Math.floor(this.segundosRestantes / 60);
  const s = this.segundosRestantes % 60;
  this.tiempoRestante = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  this.pctFase = Math.min(100, ((totalSeg - this.segundosRestantes) / totalSeg) * 100);
}
tiempoRestante = '00:00';
pctFase = 0;
faseLabel = '';
faseColor = '#5a5e6a';
statusClass = 'libre';
destinoPos: any = null;
pedidoVisible: any = null;

  statusLabel(s: any): string {
    const l: Record<string, string> = { '0':'Libre','1':'Cargando','2':'En ruta','3':'Descargando','4':'Regresando','5':'Mantenimiento','LIBRE':'Libre','CARGANDO':'Cargando','EN_RUTA':'En ruta','DESCARGANDO':'Descargando','REGRESANDO':'Regresando','MANTENIMIENTO':'Mantenimiento' };
    return l[s?.toString()] || s || '—';
  }

  // ← FIX 3: Ruta cambia según fase — regresando muestra ruta de vuelta a planta
  initRuta() {
    const status = this.statusClass;
    let origin: any;
    let destination: any;

    if (status === 'regresando') {
      // Ruta desde posición actual (o destino del pedido) de vuelta a la planta
      origin = this.miPos || this.destinoPos || this.plantaPos;
      destination = this.plantaPos;
    } else if (this.destinoPos) {
      origin = this.plantaPos;
      destination = this.destinoPos;
    } else {
      return;
    }

    this.mapCenter = {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2
    };

    if (typeof google === 'undefined' || !google.maps?.DirectionsService) {
      setTimeout(() => this.initRuta(), 500);
      return;
    }

    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }

    this.directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      this.ngZone.run(() => {
        if (status === 'OK') {
          this.rutaResult = result;
          // Color amarillo para ruta de regreso
          this.rutaOptions = {
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: this.statusClass === 'regresando' ? '#eab308' : '#f97316',
              strokeWeight: 4
            }
          };
          this.cdr.detectChanges();
        }
      });
    });
  }

  toggleGPS() {
    if (this.gpsActivo) {
      this.gpsActivo = false;
      if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
      this.gpsSub?.unsubscribe();
      return;
    }

    if (!navigator.geolocation) {
      this.snack.open('GPS no disponible en este dispositivo', 'OK', { duration: 2000 });
      return;
    }

    this.gpsActivo = true;

    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        this.ngZone.run(() => {
          this.miPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          // Si está regresando y se mueve, actualizar la ruta
          if (this.statusClass === 'regresando') {
            this.initRuta();
          }
          this.cdr.detectChanges();
        });
      },
      () => { this.gpsActivo = false; },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    this.gpsSub = interval(10000).subscribe(() => {
      if (!this.miPos || !this.datos?.camion?.id) return;
      this.signalr.enviarUbicacion(this.datos.camion.id, this.miPos.lat, this.miPos.lng);
      this.http.post(`${environment.apiUrl}/conductor/ubicacion`, { lat: this.miPos.lat, lng: this.miPos.lng }).subscribe();
    });

    navigator.geolocation.getCurrentPosition(pos => {
      this.ngZone.run(() => {
        this.miPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (this.datos?.camion?.id) {
          this.signalr.enviarUbicacion(this.datos.camion.id, pos.coords.latitude, pos.coords.longitude);
        }
        this.cdr.detectChanges();
      });
    });
  }

  confirmarCarga() {
    this.accionando = true;
    this.http.post(`${environment.apiUrl}/conductor/confirmar-carga`, {}).subscribe({
     next: d => {
  this.ngZone.run(() => {
    this.datos = d;
    this.cargando = false;
    this.calcularEstado(); // ← agrega
    this.initTimer();
    this.initRuta();
    this.cdr.detectChanges();
    setTimeout(() => this.initCanvas(), 200);
  });
},
      error: () => {
        this.ngZone.run(() => { this.snack.open('Error', 'OK', { duration: 2000 }); this.accionando = false; });
      }
    });
  }

  confirmarEntrega() {
    if (!this.datos?.pedidoActivo?.id) return;
    this.accionando = true;
    const firmaUrl = this.firmaIniciada ? this.firmaCanvasRef.nativeElement.toDataURL('image/png') : null;
    this.http.post(`${environment.apiUrl}/conductor/confirmar-entrega`, {
      pedidoId: this.datos.pedidoActivo.id,
      fotoUrl: this.fotoBase64 || null,
      firmaUrl
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.snack.open('✅ Entrega confirmada', 'OK', { duration: 3000 });
          this.modalEntregaAbierto = false;
          this.accionando = false;
          this.cargar();
        });
      },
      error: () => {
        this.ngZone.run(() => { this.snack.open('Error', 'OK', { duration: 2000 }); this.accionando = false; });
      }
    });
  }

  reportarIncidencia() {
    if (!this.incDesc || !this.datos?.camion?.id) return;
    this.accionando = true;
    this.http.post(`${environment.apiUrl}/incidencias`, {
      camionId: this.datos.camion.id, tipo: this.incTipo,
      severidad: this.incSeveridad, descripcion: this.incDesc
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.snack.open('🚨 Incidencia reportada', 'OK', { duration: 3000 });
          this.modalIncidenciaAbierto = false;
          this.incDesc = '';
          this.accionando = false;
        });
      },
      error: () => { this.ngZone.run(() => { this.snack.open('Error', 'OK', { duration: 2000 }); this.accionando = false; }); }
    });
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.fotoBase64 = e.target.result; this.fotoPreview = e.target.result; };
    reader.readAsDataURL(file);
  }

  quitarFoto() { this.fotoPreview = ''; this.fotoBase64 = ''; }

  initCanvas() {
    if (!this.firmaCanvasRef) return;
    const canvas = this.firmaCanvasRef.nativeElement;
    canvas.width = canvas.offsetWidth || 340;
    canvas.height = 130;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#f0f1f3';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDraw(e: MouseEvent) {
    this.dibujando = true; this.firmaIniciada = true;
    const r = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    this.lastX = e.clientX - r.left; this.lastY = e.clientY - r.top;
  }

  draw(e: MouseEvent) {
    if (!this.dibujando || !this.ctx) return;
    const r = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    this.ctx.beginPath(); this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y); this.ctx.stroke();
    this.lastX = x; this.lastY = y;
  }

  startDrawTouch(e: TouchEvent) {
    e.preventDefault(); this.dibujando = true; this.firmaIniciada = true;
    const r = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const t = e.touches[0];
    this.lastX = t.clientX - r.left; this.lastY = t.clientY - r.top;
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.dibujando || !this.ctx) return;
    const r = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - r.left; const y = t.clientY - r.top;
    this.ctx.beginPath(); this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y); this.ctx.stroke();
    this.lastX = x; this.lastY = y;
  }

  stopDraw() { this.dibujando = false; }

  limpiarFirma() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.firmaCanvasRef.nativeElement.width, 130);
    this.firmaIniciada = false;
  }
}
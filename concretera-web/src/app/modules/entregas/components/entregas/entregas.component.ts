import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

interface Pedido {
  id: number;
  direccion: string;
  m3Solicitados: number;
  travelMinutos: number;
  descargaMinutos: number;
  notas?: string;
  fechaAsignada?: string;
  fotoEntregaUrl?: string;
  firmaDigitalUrl?: string;
  status: string;
  camion?: { id: number; nombre: string; placas: string };
  cliente?: { id: number; nombre: string; telefono: string; email?: string };
}

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="entregas-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Confirmación de entregas</h1>
          <p class="page-sub">{{ pedidos.length }} pedidos en proceso · selecciona uno para confirmar</p>
        </div>
        <button class="btn-refresh" (click)="cargar()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando pedidos en proceso...</span>
      </div>

      <!-- Layout -->
      <div class="entregas-layout" *ngIf="!cargando">

        <!-- Lista de pedidos -->
        <div class="pedidos-list">
          <div class="list-label">Pedidos en proceso</div>

          <div class="pedido-item" *ngFor="let p of pedidos"
            [class.selected]="pedidoSeleccionado?.id === p.id"
            (click)="seleccionar(p)">

            <div class="pi-head">
              <div class="pi-id">#{{ p.id }}</div>
              <div class="pi-status">En proceso</div>
            </div>

            <div class="pi-cliente" *ngIf="p.cliente">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {{ p.cliente.nombre }}
            </div>

            <div class="pi-dir">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ p.direccion }}
            </div>

            <div class="pi-meta">
              <span>{{ p.m3Solicitados }} m³</span>
              <span>·</span>
              <span *ngIf="p.camion">{{ p.camion.nombre }}</span>
            </div>

          </div>

          <div class="empty-list" *ngIf="pedidos.length === 0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>No hay pedidos en proceso</p>
          </div>
        </div>

        <!-- Panel de confirmación -->
        <div class="confirmacion-panel" *ngIf="pedidoSeleccionado">

          <!-- Info del pedido -->
          <div class="panel-section">
            <div class="section-label">Detalles del pedido #{{ pedidoSeleccionado.id }}</div>
            <div class="pedido-info-grid">
              <div class="info-item" *ngIf="pedidoSeleccionado.cliente">
                <div class="info-label">Cliente</div>
                <div class="info-val">{{ pedidoSeleccionado.cliente.nombre }}</div>
                <div class="info-sub" *ngIf="pedidoSeleccionado.cliente.telefono">
                  {{ pedidoSeleccionado.cliente.telefono }}
                </div>
              </div>
              <div class="info-item" *ngIf="pedidoSeleccionado.camion">
                <div class="info-label">Camión</div>
                <div class="info-val">{{ pedidoSeleccionado.camion.nombre }}</div>
                <div class="info-sub">{{ pedidoSeleccionado.camion.placas }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Volumen</div>
                <div class="info-val">{{ pedidoSeleccionado.m3Solicitados }} m³</div>
              </div>
              <div class="info-item">
                <div class="info-label">Fecha</div>
                <div class="info-val">{{ pedidoSeleccionado.fechaAsignada | date:'dd/MM HH:mm' }}</div>
              </div>
            </div>
            <div class="pedido-dir">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ pedidoSeleccionado.direccion }}
            </div>
            <div class="pedido-notas" *ngIf="pedidoSeleccionado.notas">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {{ pedidoSeleccionado.notas }}
            </div>
          </div>

          <!-- Foto de entrega -->
          <div class="panel-section">
            <div class="section-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Foto de entrega
            </div>

            <div class="foto-area" *ngIf="!fotoPreview" (click)="fotoInput.click()">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p>Tomar foto o seleccionar archivo</p>
              <span>JPG, PNG hasta 10MB</span>
            </div>

            <div class="foto-preview" *ngIf="fotoPreview">
              <img [src]="fotoPreview" alt="Foto entrega" class="preview-img">
              <button class="btn-remove-foto" (click)="quitarFoto()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Quitar foto
              </button>
            </div>

            <input #fotoInput type="file" accept="image/*" capture="environment"
              style="display:none" (change)="onFotoSelected($event)">

            <div class="foto-url-alt">
              <span class="alt-label">O pegar URL de foto:</span>
              <input class="fi" [(ngModel)]="fotoUrl" placeholder="https://..."
                (ngModelChange)="onFotoUrlChange()">
            </div>
          </div>

          <!-- Firma digital -->
          <div class="panel-section">
            <div class="section-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Firma del cliente
            </div>

            <div class="firma-container">
              <canvas #firmaCanvas
                class="firma-canvas"
                [width]="canvasWidth"
                [height]="150"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()">
              </canvas>
              <div class="firma-placeholder" *ngIf="!firmaIniciada">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>El cliente firma aquí</span>
              </div>
            </div>

            <button class="btn-clear-firma" (click)="limpiarFirma()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Limpiar firma
            </button>
          </div>

          <!-- Notas adicionales -->
          <div class="panel-section">
            <div class="section-label">Notas de entrega (opcional)</div>
            <textarea class="fi fi-area" [(ngModel)]="notasEntrega" rows="2"
              placeholder="Observaciones adicionales..."></textarea>
          </div>

          <!-- Botón confirmar -->
          <div class="panel-footer">
            <div class="confirm-requirements">
              <div class="req-item" [class.done]="fotoUrl || fotoBase64">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Foto de entrega
              </div>
              <div class="req-item" [class.done]="firmaIniciada">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Firma del cliente
              </div>
            </div>

            <button class="btn-confirmar"
              [disabled]="confirmando || (!fotoUrl && !fotoBase64) || !firmaIniciada"
              (click)="confirmarEntrega()">
              <div class="btn-spin" *ngIf="confirmando"></div>
              <svg *ngIf="!confirmando" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ confirmando ? 'Confirmando...' : 'Confirmar entrega' }}
            </button>
          </div>

        </div>

        <!-- Placeholder cuando no hay selección -->
        <div class="no-selection" *ngIf="!pedidoSeleccionado && !cargando">
          <div class="no-sel-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="12" y2="16"/>
            </svg>
          </div>
          <h3>Selecciona un pedido</h3>
          <p>Elige un pedido de la lista para confirmar la entrega con foto y firma del cliente</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .entregas-page {
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
    }

    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }

    .btn-refresh {
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

    .btn-refresh:hover { border-color: rgba(255,255,255,0.16); color: #f0f1f3; }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Layout */
    .entregas-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 16px;
      align-items: start;
    }

    /* Pedidos List */
    .pedidos-list {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
    }

    .list-label {
      padding: 12px 16px;
      font-size: 10px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .pedido-item {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pedido-item:hover { background: rgba(255,255,255,0.03); }
    .pedido-item.selected { background: rgba(249,115,22,0.08); border-left: 2px solid #f97316; }
    .pedido-item:last-child { border-bottom: none; }

    .pi-head { display: flex; align-items: center; justify-content: space-between; }

    .pi-id { font-size: 13px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }

    .pi-status {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(59,130,246,0.1);
      color: #3b82f6;
    }

    .pi-cliente, .pi-dir {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #8b8f9a;
    }

    .pi-dir { color: #5a5e6a; }

    .pi-meta {
      display: flex;
      gap: 6px;
      font-size: 11px;
      color: #3a3e48;
    }

    .empty-list {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #3a3e48;
      font-size: 12px;
    }

    /* Confirmation Panel */
    .confirmacion-panel {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
    }

    .panel-section {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }

    /* Pedido info */
    .pedido-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .info-item {}
    .info-label { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .info-val { font-size: 14px; font-weight: 600; color: #f0f1f3; }
    .info-sub { font-size: 11px; color: #5a5e6a; margin-top: 2px; }

    .pedido-dir {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: #8b8f9a;
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .pedido-notas {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 11px;
      color: #5a5e6a;
      padding: 6px 10px;
      border-left: 2px solid rgba(249,115,22,0.3);
    }

    /* Foto */
    .foto-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      background: rgba(255,255,255,0.02);
      border: 2px dashed rgba(255,255,255,0.08);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      color: #5a5e6a;
      margin-bottom: 12px;
    }

    .foto-area:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,0.04); }
    .foto-area p { font-size: 13px; font-weight: 500; }
    .foto-area span { font-size: 11px; color: #3a3e48; }

    .foto-preview {
      margin-bottom: 12px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }

    .preview-img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }

    .btn-remove-foto {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 12px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 6px;
      color: #ef4444;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-remove-foto:hover { background: rgba(239,68,68,0.18); }

    .foto-url-alt {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alt-label { font-size: 11px; color: #5a5e6a; white-space: nowrap; }

    .fi {
      flex: 1;
      padding: 8px 12px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }

    .fi:focus { border-color: #f97316; }
    .fi::placeholder { color: #3a3e48; }
    .fi-area { resize: vertical; min-height: 60px; width: 100%; }

    /* Firma */
    .firma-container {
      position: relative;
      margin-bottom: 8px;
    }

    .firma-canvas {
      width: 100%;
      height: 150px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      cursor: crosshair;
      display: block;
      touch-action: none;
    }

    .firma-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #3a3e48;
      font-size: 12px;
      pointer-events: none;
    }

    .btn-clear-firma {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 6px;
      color: #5a5e6a;
      font-size: 11px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-clear-firma:hover { border-color: rgba(255,255,255,0.14); color: #8b8f9a; }

    /* Footer */
    .panel-footer {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: space-between;
    }

    .confirm-requirements {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .req-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #3a3e48;
      transition: color 0.2s;
    }

    .req-item svg { opacity: 0.3; transition: opacity 0.2s; }
    .req-item.done { color: #22c55e; }
    .req-item.done svg { opacity: 1; }

    .btn-confirmar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 16px rgba(34,197,94,0.2);
      white-space: nowrap;
    }

    .btn-confirmar:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(34,197,94,0.3);
    }

    .btn-confirmar:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    .btn-spin {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* No selection */
    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 80px 40px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      text-align: center;
      color: #3a3e48;
    }

    .no-sel-icon {
      width: 72px; height: 72px;
      border-radius: 16px;
      background: rgba(255,255,255,0.03);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-selection h3 { font-size: 16px; font-weight: 600; color: #5a5e6a; }
    .no-selection p { font-size: 13px; color: #3a3e48; max-width: 280px; line-height: 1.5; }

    /* Responsive */
    @media (max-width: 900px) {
      .entregas-layout { grid-template-columns: 1fr; }
      .pedido-info-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .entregas-page { padding: 16px; }
      .pedido-info-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class EntregasComponent implements OnInit, AfterViewInit {
  @ViewChild('firmaCanvas') firmaCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fotoInput') fotoInputRef!: ElementRef<HTMLInputElement>;

  pedidos: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;
  cargando = false;
  confirmando = false;

  fotoUrl = '';
  fotoBase64 = '';
  fotoPreview = '';
  notasEntrega = '';
  firmaIniciada = false;
  canvasWidth = 600;

  private ctx!: CanvasRenderingContext2D;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private http: HttpClient, private snack: MatSnackBar, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

  ngAfterViewInit() {
    this.initCanvas();
  }

  initCanvas() {
    if (!this.firmaCanvasRef) return;
    const canvas = this.firmaCanvasRef.nativeElement;
    this.canvasWidth = canvas.parentElement?.offsetWidth || 600;
    canvas.width = this.canvasWidth;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#f0f1f3';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  cargar() {
    this.cargando = true;
    this.http.get<Pedido[]>(`${environment.apiUrl}/despacho/en-proceso`).subscribe({
      next: p => { this.pedidos = p; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; }
    });
  }

  seleccionar(p: Pedido) {
    this.pedidoSeleccionado = p;
    this.fotoUrl = '';
    this.fotoBase64 = '';
    this.fotoPreview = '';
    this.notasEntrega = '';
    setTimeout(() => {
      this.initCanvas();
      this.limpiarFirma();
    }, 100);
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotoBase64 = e.target.result;
      this.fotoPreview = e.target.result;
      this.fotoUrl = '';
    };
    reader.readAsDataURL(file);
  }

  onFotoUrlChange() {
    if (this.fotoUrl) {
      this.fotoPreview = this.fotoUrl;
      this.fotoBase64 = '';
    }
  }

  quitarFoto() {
    this.fotoUrl = '';
    this.fotoBase64 = '';
    this.fotoPreview = '';
  }

  // Canvas drawing
  startDrawing(e: MouseEvent) {
    this.dibujando = true;
    this.firmaIniciada = true;
    const rect = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e: MouseEvent) {
    if (!this.dibujando) return;
    const rect = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing() { this.dibujando = false; }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    this.dibujando = true;
    this.firmaIniciada = true;
    const rect = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.dibujando) return;
    const rect = this.firmaCanvasRef.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  limpiarFirma() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.firmaCanvasRef.nativeElement.width, 150);
    this.firmaIniciada = false;
  }

  confirmarEntrega() {
    if (!this.pedidoSeleccionado) return;
    this.confirmando = true;

    const firmaUrl = this.firmaIniciada
      ? this.firmaCanvasRef.nativeElement.toDataURL('image/png')
      : null;

    const dto = {
      pedidoId: this.pedidoSeleccionado.id,
      fotoUrl: this.fotoBase64 || this.fotoUrl || null,
      firmaUrl,
      notas: this.notasEntrega || null
    };

    this.http.post(`${environment.apiUrl}/despacho/confirmar-entrega`, dto).subscribe({
      next: () => {
        this.snack.open('✓ Entrega confirmada exitosamente', 'OK', { duration: 4000 });
        this.pedidoSeleccionado = null;
        this.confirmando = false;
        this.cargar();
      },
      error: () => {
        this.snack.open('Error al confirmar entrega', 'OK', { duration: 3000 });
        this.confirmando = false;
      }
    });
  }
}

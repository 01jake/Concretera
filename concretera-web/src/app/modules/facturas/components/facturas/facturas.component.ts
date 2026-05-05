import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';
interface Factura {
  id: number;
  folio: number;
  folioFormateado: string;
  status: string;
  fechaEmision: string;
  fechaPago?: string;
  fechaVencimiento?: string;
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
  rfcCliente?: string;
  cliente?: { id: number; nombre: string; email: string };
  conceptos: Concepto[];
}

interface Concepto {
  id: number;
  descripcion: string;
  cantidadM3: number;
  precioUnitario: number;
  importe: number;
  pedidoId?: number;
}

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
  <div class="facturas-page page-enter">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Facturación</h1>
<p class="page-sub">{{ facturas.length }} facturas · $ {{ totalFacturado | number:'1.0-0' }} facturado</p>
   </div>
      <button class="btn-new" (click)="abrirModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva factura
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-blue">
        <div class="kpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-num">{{ pendientes }}</div>
          <div class="kpi-label">Pendientes</div>
        </div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-num">{{ pagadas }}</div>
          <div class="kpi-label">Pagadas</div>
        </div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-num">$ {{ totalPendiente | number:'1.0-0' }}</div>
          <div class="kpi-label">Por cobrar</div>
        </div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-num">$ {{ totalCobrado | number:'1.0-0' }}</div>
          <div class="kpi-label">Cobrado</div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <select class="filter-sel" [(ngModel)]="filtroStatus" (ngModelChange)="filtrar()">
        <option value="">Todos los estados</option>
        <option value="PENDIENTE">Pendientes</option>
        <option value="PAGADA">Pagadas</option>
        <option value="CANCELADA">Canceladas</option>
      </select>
      <select class="filter-sel" [(ngModel)]="filtroCliente" (ngModelChange)="filtrar()">
        <option value="">Todos los clientes</option>
        <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombre }}</option>
      </select>
      <button class="btn-clear" (click)="limpiarFiltros()">Limpiar</button>
    </div>

    <!-- Loading -->
    <div class="loading-state" *ngIf="cargando">
      <div class="spinner"></div>
      <span>Cargando facturas...</span>
    </div>

    <!-- Lista -->
    <div class="facturas-list" *ngIf="!cargando">
      <div class="factura-card" *ngFor="let f of facturasFiltradas"
        [class.fc-pagada]="f.status === 'PAGADA'"
        [class.fc-cancelada]="f.status === 'CANCELADA'">

        <div class="fc-head">
          <div class="fc-folio-wrap">
            <div class="fc-folio">{{ f.folioFormateado }}</div>
            <div class="fc-cliente">{{ f.cliente?.nombre || '—' }}</div>
          </div>
          <div class="fc-badges">
            <span [class]="'status-badge sb-' + statusClass(f.status)">
              {{ statusLabel(f.status) }}
            </span>
            <div class="fc-total">$ {{ f.total | number:'1.2-2' }}</div>
          </div>
          <div class="fc-actions">
            <button class="icon-btn btn-verde"
              *ngIf="f.status === 'PENDIENTE'"
              (click)="pagar(f)" title="Marcar pagada">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button class="icon-btn" (click)="verPDF(f)" title="Ver PDF">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </button>
            <button class="icon-btn icon-btn-danger"
              *ngIf="f.status !== 'CANCELADA'"
              (click)="cancelar(f)" title="Cancelar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <button class="icon-btn icon-btn-danger" (click)="eliminar(f)" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="fc-body">
          <div class="fc-row">
            <div class="fc-det-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Emitida: {{ f.fechaEmision | date:'dd/MM/yyyy' }}
            </div>
            <div class="fc-det-item" *ngIf="f.fechaVencimiento">
              ⏰ Vence: {{ f.fechaVencimiento | date:'dd/MM/yyyy' }}
            </div>
            <div class="fc-det-item" *ngIf="f.fechaPago">
              ✅ Pagada: {{ f.fechaPago | date:'dd/MM/yyyy' }}
            </div>
          </div>

          <div class="fc-conceptos">
            <div class="fc-concepto" *ngFor="let c of f.conceptos">
              <span class="fc-con-desc">{{ c.descripcion }}</span>
              <span class="fc-con-m3">{{ c.cantidadM3 }}m³</span>
              <span class="fc-con-precio">$ {{ c.precioUnitario | number:'1.0-0' }}/m³</span>
              <span class="fc-con-imp">$ {{ c.importe | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="fc-totales">
            <div class="fc-tot-row">
              <span>Subtotal</span><span>$ {{ f.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="fc-tot-row">
              <span>IVA 16%</span><span>$ {{ f.iva | number:'1.2-2' }}</span>
            </div>
            <div class="fc-tot-row fc-total-final">
              <span>Total</span><span>$ {{ f.total | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="fc-notas" *ngIf="f.notas">📋 {{ f.notas }}</div>
        </div>

      </div>

      <div class="empty-state" *ngIf="facturasFiltradas.length === 0">
        <div class="empty-icon">🧾</div>
        <p>No hay facturas para los filtros seleccionados</p>
        <button class="btn-new" (click)="abrirModal()">Crear primera factura</button>
      </div>
    </div>

    <!-- ══ MODAL NUEVA FACTURA ══ -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Nueva factura</h3>
          <button class="modal-close" (click)="cerrarModal()">✕</button>
        </div>
        <div class="modal-form">

          <div class="modal-section">
            <div class="ms-title">Cliente</div>
            <div class="form-grid">
              <div class="fg full">
                <label class="fl">Cliente *</label>
                <select class="fi" [(ngModel)]="form.clienteId" (ngModelChange)="onClienteChange()">
                  <option value="">Seleccionar cliente...</option>
                  <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">RFC</label>
                <input class="fi" [(ngModel)]="form.rfcCliente" placeholder="RFC del cliente">
              </div>
              <div class="fg">
                <label class="fl">Fecha vencimiento</label>
                <input class="fi" type="date" [(ngModel)]="form.fechaVencimiento">
              </div>
            </div>
          </div>

          <div class="modal-section" *ngIf="form.clienteId">
            <div class="ms-title">Tipo de factura</div>
            <div class="tipo-tabs">
              <button class="tipo-tab" [class.active]="form.tipo === 'pedidos'"
                (click)="form.tipo = 'pedidos'; cargarPedidosSinFacturar()">
                Por pedidos entregados
              </button>
              <button class="tipo-tab" [class.active]="form.tipo === 'manual'"
                (click)="form.tipo = 'manual'">
                Manual
              </button>
            </div>
          </div>

          <div class="modal-section" *ngIf="form.tipo === 'pedidos' && form.clienteId">
            <div class="ms-title">Pedidos entregados sin facturar</div>
            <div class="loading-state" *ngIf="cargandoPedidos">
              <div class="spinner"></div>
            </div>
            <div class="pedidos-list" *ngIf="!cargandoPedidos">
              <div class="pedido-item" *ngFor="let p of pedidosSinFacturar"
                [class.selected]="pedidosSeleccionados.includes(p.id)"
                (click)="togglePedido(p.id)">
                <div class="pi-check">
                  <svg *ngIf="pedidosSeleccionados.includes(p.id)" width="12" height="12"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div class="pi-info">
                  <div class="pi-dir">{{ p.direccion }}</div>
                  <div class="pi-fecha">{{ p.fechaEntrega | date:'dd/MM/yyyy' }}</div>
                </div>
                <div class="pi-m3">{{ p.m3Solicitados }}m³</div>
              </div>
              <div class="empty-pedidos" *ngIf="pedidosSinFacturar.length === 0">
                No hay pedidos entregados sin facturar
              </div>
            </div>
            <div class="fg mt-8" *ngIf="pedidosSeleccionados.length > 0">
              <label class="fl">Precio por m³ ($) *</label>
              <input class="fi" type="number" [(ngModel)]="form.precioM3" placeholder="1800">
            </div>
          </div>

          <div class="modal-section" *ngIf="form.tipo === 'manual'">
            <div class="ms-title">
              Conceptos
              <button class="btn-add-concepto" (click)="agregarConcepto()">+ Agregar</button>
            </div>
            <div class="concepto-row" *ngFor="let c of form.conceptos; let i = index">
              <input class="fi" [(ngModel)]="c.descripcion" placeholder="Descripción" style="flex:2">
              <input class="fi" type="number" [(ngModel)]="c.cantidadM3" placeholder="m³" style="flex:0.5">
              <input class="fi" type="number" [(ngModel)]="c.precioUnitario" placeholder="$/m³" style="flex:0.7">
              <div class="concepto-importe">$ {{ (c.cantidadM3 * c.precioUnitario) | number:'1.0-0' }}</div>
              <button class="btn-remove" (click)="quitarConcepto(i)">✕</button>
            </div>
          </div>

          <div class="modal-section" *ngIf="subtotalPreview > 0">
            <div class="preview-totales">
              <div class="pt-row"><span>Subtotal</span><span>$ {{ subtotalPreview | number:'1.2-2' }}</span></div>
              <div class="pt-row"><span>IVA 16%</span><span>$ {{ ivaPreview | number:'1.2-2' }}</span></div>
              <div class="pt-row pt-total"><span>Total</span><span>$ {{ totalPreview | number:'1.2-2' }}</span></div>
            </div>
          </div>

          <div class="modal-section">
            <div class="fg full">
              <label class="fl">Notas</label>
              <textarea class="fi fi-area" [(ngModel)]="form.notas" rows="2" placeholder="Observaciones..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-save" [disabled]="!puedeGuardar || guardando" (click)="guardar()">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Generando...' : 'Generar factura' }}
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- ══ MODAL PDF ══ -->
    <div class="modal-overlay" *ngIf="facturaVisualizando" (click)="facturaVisualizando = null">
      <div class="modal modal-pdf" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ facturaVisualizando.folioFormateado }}</h3>
          <div class="pdf-header-actions">
            <button class="btn-imprimir" (click)="imprimir()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir
            </button>
            <button class="modal-close" (click)="facturaVisualizando = null">✕</button>
          </div>
        </div>
        <div class="pdf-body" id="pdf-content">
          <div class="pdf-empresa">
            <div class="pdf-logo">🏗️ Concretera</div>
            <div class="pdf-empresa-info">
              <div class="pdf-empresa-nombre">Concretera Hermosillo S.A. de C.V.</div>
              <div class="pdf-empresa-datos">Planta Hermosillo · Sonora, México</div>
            </div>
          </div>
          <div class="pdf-divider"></div>
          <div class="pdf-info-grid">
            <div>
              <div class="pdf-section-label">Factura</div>
              <div class="pdf-folio">{{ facturaVisualizando.folioFormateado }}</div>
              <div class="pdf-fecha">Emitida: {{ facturaVisualizando.fechaEmision | date:'dd/MM/yyyy' }}</div>
              <div class="pdf-fecha" *ngIf="facturaVisualizando.fechaVencimiento">
                Vence: {{ facturaVisualizando.fechaVencimiento | date:'dd/MM/yyyy' }}
              </div>
              <div class="pdf-status" [class]="'ps-' + statusClass(facturaVisualizando.status)">
                {{ statusLabel(facturaVisualizando.status) }}
              </div>
            </div>
            <div>
              <div class="pdf-section-label">Cliente</div>
              <div class="pdf-cliente-nombre">{{ facturaVisualizando.cliente?.nombre }}</div>
              <div class="pdf-cliente-email">{{ facturaVisualizando.cliente?.email }}</div>
              <div class="pdf-cliente-rfc" *ngIf="facturaVisualizando.rfcCliente">
                RFC: {{ facturaVisualizando.rfcCliente }}
              </div>
            </div>
          </div>
          <div class="pdf-divider"></div>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of facturaVisualizando.conceptos">
                <td>{{ c.descripcion }}</td>
                <td class="text-right">{{ c.cantidadM3 }} m³</td>
                <td class="text-right">$ {{ c.precioUnitario | number:'1.2-2' }}</td>
                <td class="text-right">$ {{ c.importe | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="pdf-totales">
            <div class="pdf-tot-row">
              <span>Subtotal</span><span>$ {{ facturaVisualizando.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="pdf-tot-row">
              <span>IVA (16%)</span><span>$ {{ facturaVisualizando.iva | number:'1.2-2' }}</span>
            </div>
            <div class="pdf-tot-row pdf-tot-final">
              <span>Total</span><span>$ {{ facturaVisualizando.total | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="pdf-notas" *ngIf="facturaVisualizando.notas">
            <strong>Notas:</strong> {{ facturaVisualizando.notas }}
          </div>
          <div class="pdf-footer">
            Gracias por su preferencia · Concretera Hermosillo
          </div>
        </div>
      </div>
    </div>

  </div>
`,
  styles: [`
    .facturas-page { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }

    .btn-new { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .btn-new:hover { transform: translateY(-1px); }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; }
    .kpi-blue { border-left: 2px solid #3b82f6; }
    .kpi-green { border-left: 2px solid #22c55e; }
    .kpi-orange { border-left: 2px solid #f97316; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-blue .kpi-icon { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .kpi-green .kpi-icon { background: rgba(34,197,94,0.1); color: #22c55e; }
    .kpi-orange .kpi-icon { background: rgba(249,115,22,0.1); color: #f97316; }
    .kpi-body { flex: 1; }
    .kpi-num { font-size: 24px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; line-height: 1; }
    .kpi-label { font-size: 11px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

    /* Filtros */
    .filters-bar { display: flex; gap: 10px; flex-wrap: wrap; padding: 12px 16px; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; margin-bottom: 16px; }
    .filter-sel { padding: 7px 10px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: #f0f1f3; font-size: 13px; font-family: 'DM Sans', sans-serif; min-width: 160px; outline: none; }
    .filter-sel option { background: #1a1d24; }
    .btn-clear { padding: 7px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: #8b8f9a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; }
    .btn-clear:hover { color: #f0f1f3; }

    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Facturas */
    .facturas-list { display: flex; flex-direction: column; gap: 12px; }

    .factura-card { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; border-left: 3px solid #3b82f6; transition: transform 0.2s; }
    .factura-card:hover { transform: translateX(2px); }
    .fc-pagada { border-left-color: #22c55e; opacity: 0.8; }
    .fc-cancelada { border-left-color: #ef4444; opacity: 0.6; }

    .fc-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .fc-folio-wrap { flex: 1; min-width: 0; }
    .fc-folio { font-size: 14px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .fc-cliente { font-size: 12px; color: #5a5e6a; margin-top: 2px; }
    .fc-badges { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .fc-total { font-size: 16px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .fc-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .status-badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .sb-pendiente { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .sb-pagada { background: rgba(34,197,94,0.1); color: #22c55e; }
    .sb-cancelada { background: rgba(239,68,68,0.1); color: #ef4444; }

    .icon-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #5a5e6a; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
    .icon-btn:hover { background: rgba(255,255,255,0.09); color: #f0f1f3; }
    .btn-verde:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #22c55e; }
    .icon-btn-danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444; }

    .fc-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }

    .fc-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .fc-det-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #5a5e6a; }

    .fc-conceptos { display: flex; flex-direction: column; gap: 4px; }
    .fc-concepto { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; font-size: 12px; }
    .fc-con-desc { flex: 1; color: #8b8f9a; }
    .fc-con-m3 { color: #f97316; font-weight: 600; font-family: 'DM Mono', monospace; }
    .fc-con-precio { color: #5a5e6a; font-family: 'DM Mono', monospace; }
    .fc-con-imp { color: #f0f1f3; font-weight: 700; font-family: 'DM Mono', monospace; margin-left: auto; }

    .fc-totales { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; }
    .fc-tot-row { display: flex; justify-content: space-between; font-size: 12px; color: #8b8f9a; }
    .fc-total-final { font-size: 14px; font-weight: 700; color: #f0f1f3; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 2px; }

    .fc-notas { font-size: 11px; color: #5a5e6a; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 2px solid rgba(249,115,22,0.3); }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; color: #3a3e48; text-align: center; }
    .empty-icon { font-size: 48px; }
    .empty-state p { font-size: 13px; color: #5a5e6a; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; animation: fadeIn 0.15s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: #13151a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s ease; }
    .modal-pdf { max-width: 700px; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .modal-title { font-size: 15px; font-weight: 700; color: #f0f1f3; }
    .modal-close { background: none; border: none; color: #5a5e6a; font-size: 16px; cursor: pointer; }
    .modal-close:hover { color: #f0f1f3; }
    .pdf-header-actions { display: flex; align-items: center; gap: 10px; }
    .btn-imprimir { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 7px; color: #3b82f6; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; }

    .modal-form { display: flex; flex-direction: column; }
    .modal-section { padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .ms-title { font-size: 10px; font-weight: 700; color: #3a3e48; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .mt-8 { margin-top: 8px; }
    .fl { font-size: 11px; font-weight: 600; color: #5a5e6a; }
    .fi { padding: 9px 12px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: #f0f1f3; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; width: 100%; }
    .fi:focus { border-color: #f97316; }
    .fi::placeholder { color: #3a3e48; }
    .fi-area { resize: vertical; min-height: 60px; }
    .fi option { background: #1a1d24; }

    .tipo-tabs { display: flex; gap: 8px; }
    .tipo-tab { flex: 1; padding: 8px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #5a5e6a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; text-align: center; }
    .tipo-tab.active { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); color: #f97316; font-weight: 700; }

    .pedidos-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
    .pedido-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.15s; }
    .pedido-item:hover { background: rgba(255,255,255,0.03); }
    .pedido-item.selected { background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2); }
    .pi-check { width: 18px; height: 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .pedido-item.selected .pi-check { background: #f97316; border-color: #f97316; color: white; }
    .pi-info { flex: 1; min-width: 0; }
    .pi-dir { font-size: 12px; color: #f0f1f3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pi-fecha { font-size: 10px; color: #5a5e6a; }
    .pi-m3 { font-size: 13px; font-weight: 700; color: #f97316; font-family: 'DM Mono', monospace; flex-shrink: 0; }
    .empty-pedidos { font-size: 12px; color: #5a5e6a; padding: 16px; text-align: center; }

    .btn-add-concepto { padding: 3px 10px; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2); border-radius: 5px; color: #f97316; font-size: 11px; font-family: 'DM Sans', sans-serif; cursor: pointer; }
    .concepto-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .concepto-importe { font-size: 13px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; white-space: nowrap; }
    .btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 4px; }

    .preview-totales { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
    .pt-row { display: flex; justify-content: space-between; font-size: 13px; color: #8b8f9a; }
    .pt-total { font-size: 15px; font-weight: 700; color: #f0f1f3; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.07); margin-top: 4px; }

    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 14px 24px; }
    .btn-cancel { padding: 8px 16px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: #8b8f9a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; }
    .btn-save { display: flex; align-items: center; gap: 7px; padding: 9px 18px; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 7px; color: white; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

    /* PDF */
    .pdf-body { padding: 32px; background: white; color: #1a1a2e; }
    .pdf-empresa { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .pdf-logo { font-size: 32px; }
    .pdf-empresa-nombre { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .pdf-empresa-datos { font-size: 12px; color: #666; margin-top: 2px; }
    .pdf-divider { height: 1px; background: #e5e7eb; margin: 16px 0; }
    .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
    .pdf-section-label { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .pdf-folio { font-size: 22px; font-weight: 700; color: #1a1a2e; font-family: monospace; }
    .pdf-fecha { font-size: 12px; color: #666; margin-top: 4px; }
    .pdf-status { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-top: 8px; text-transform: uppercase; }
    .ps-pendiente { background: #dbeafe; color: #1d4ed8; }
    .ps-pagada { background: #dcfce7; color: #16a34a; }
    .ps-cancelada { background: #fee2e2; color: #dc2626; }
    .pdf-cliente-nombre { font-size: 16px; font-weight: 700; color: #1a1a2e; }
    .pdf-cliente-email { font-size: 12px; color: #666; margin-top: 4px; }
    .pdf-cliente-rfc { font-size: 12px; color: #666; margin-top: 2px; font-family: monospace; }
    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .pdf-table th { background: #f3f4f6; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    .pdf-table td { padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .text-right { text-align: right; }
    .pdf-totales { display: flex; flex-direction: column; gap: 6px; margin-left: auto; width: 240px; padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; }
    .pdf-tot-row { display: flex; justify-content: space-between; font-size: 13px; color: #374151; }
    .pdf-tot-final { font-size: 16px; font-weight: 700; color: #1a1a2e; padding-top: 8px; border-top: 2px solid #e5e7eb; margin-top: 4px; }
    .pdf-notas { font-size: 12px; color: #666; padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 20px; }
    .pdf-footer { text-align: center; font-size: 11px; color: #999; padding-top: 16px; border-top: 1px solid #e5e7eb; }

    @media (max-width: 768px) {
      .facturas-page { padding: 16px; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FacturasComponent implements OnInit {
  facturas: Factura[] = [];
  facturasFiltradas: Factura[] = [];
  clientes: any[] = [];
  pedidosSinFacturar: any[] = [];
  pedidosSeleccionados: number[] = [];

  cargando = false;
  cargandoPedidos = false;
  guardando = false;

  filtroStatus = '';
  filtroCliente = '';

  modalAbierto = false;
  facturaVisualizando: Factura | null = null;

  form = {
    clienteId: '' as any,
    rfcCliente: '',
    notas: '',
    fechaVencimiento: '',
    tipo: 'pedidos',
    precioM3: 1800,
    conceptos: [] as any[]
  };

pendientes = 0;
pagadas = 0;
totalFacturado = 0;
totalPendiente = 0;
totalCobrado = 0;

  get subtotalPreview(): number {
    if (this.form.tipo === 'pedidos') {
      const pedidos = this.pedidosSinFacturar.filter(p => this.pedidosSeleccionados.includes(p.id));
      return pedidos.reduce((s, p) => s + p.m3Solicitados * this.form.precioM3, 0);
    }
    return this.form.conceptos.reduce((s, c) => s + (c.cantidadM3 * c.precioUnitario), 0);
  }

  get ivaPreview(): number { return Math.round(this.subtotalPreview * 0.16 * 100) / 100; }
  get totalPreview(): number { return this.subtotalPreview + this.ivaPreview; }

  get puedeGuardar(): boolean {
    if (!this.form.clienteId) return false;
    if (this.form.tipo === 'pedidos') return this.pedidosSeleccionados.length > 0 && this.form.precioM3 > 0;
    return this.form.conceptos.length > 0 && this.form.conceptos.every(c => c.descripcion && c.cantidadM3 > 0 && c.precioUnitario > 0);
  }

  constructor(private http: HttpClient, private snack: MatSnackBar, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.cargarClientes();
  }

  cargar() {
  this.cargando = true;
  this.http.get<Factura[]>(`${environment.apiUrl}/facturas`).subscribe({
    next: f => {
      this.facturas = f;
      this.filtrar();
      this.cargando = false;
      this.cdRef.detectChanges(); // ← agrega esto
    },
    error: () => { this.cargando = false; }
  });
}

  cargarClientes() {
    this.http.get<any[]>(`${environment.apiUrl}/clientes`).subscribe({
      next: c => this.clientes = c.filter(x => x.activo !== false),
      error: () => {}
    });
  }

 filtrar() {
  let base = this.facturas;
  if (this.filtroStatus) base = base.filter(f => f.status === this.filtroStatus);
  if (this.filtroCliente) base = base.filter(f => f.cliente?.id?.toString() === this.filtroCliente);
  this.facturasFiltradas = base;

  // Calcular métricas aquí
  this.pendientes = this.facturas.filter(f => f.status === 'PENDIENTE').length;
  this.pagadas = this.facturas.filter(f => f.status === 'PAGADA').length;
  this.totalFacturado = this.facturas.reduce((s, f) => s + f.total, 0);
  this.totalPendiente = this.facturas.filter(f => f.status === 'PENDIENTE').reduce((s, f) => s + f.total, 0);
  this.totalCobrado = this.facturas.filter(f => f.status === 'PAGADA').reduce((s, f) => s + f.total, 0);
}

  limpiarFiltros() { this.filtroStatus = ''; this.filtroCliente = ''; this.filtrar(); }

  abrirModal() {
    this.form = { clienteId: '', rfcCliente: '', notas: '', fechaVencimiento: '', tipo: 'pedidos', precioM3: 1800, conceptos: [] };
    this.pedidosSinFacturar = [];
    this.pedidosSeleccionados = [];
    this.modalAbierto = true;
  }

  cerrarModal() { this.modalAbierto = false; }

  onClienteChange() {
    this.pedidosSinFacturar = [];
    this.pedidosSeleccionados = [];
    if (this.form.clienteId && this.form.tipo === 'pedidos') {
      this.cargarPedidosSinFacturar();
    }
  }

  cargarPedidosSinFacturar() {
    if (!this.form.clienteId) return;
    this.cargandoPedidos = true;
    this.http.get<any[]>(`${environment.apiUrl}/facturas/pedidos-sin-facturar?clienteId=${this.form.clienteId}`).subscribe({
      next: p => { this.pedidosSinFacturar = p; this.cargandoPedidos = false; this.cdRef.detectChanges(); },
      error: () => { this.cargandoPedidos = false; }
    });
  }

  togglePedido(id: number) {
    const idx = this.pedidosSeleccionados.indexOf(id);
    if (idx >= 0) this.pedidosSeleccionados.splice(idx, 1);
    else this.pedidosSeleccionados.push(id);
  }

  agregarConcepto() {
    this.form.conceptos.push({ descripcion: '', cantidadM3: 0, precioUnitario: 1800 });
  }

  quitarConcepto(i: number) { this.form.conceptos.splice(i, 1); }

  recalcularConcepto(i: number) {
    // Se calcula en el template
  }

  guardar() {
    if (!this.puedeGuardar) return;
    this.guardando = true;

    const dto: any = {
      clienteId: parseInt(this.form.clienteId),
      rfcCliente: this.form.rfcCliente || null,
      notas: this.form.notas || null,
      fechaVencimiento: this.form.fechaVencimiento ? new Date(this.form.fechaVencimiento).toISOString() : null,
      precioM3: this.form.precioM3
    };

    if (this.form.tipo === 'pedidos') {
      dto.pedidoIds = this.pedidosSeleccionados;
    } else {
      dto.conceptos = this.form.conceptos.map(c => ({
        descripcion: c.descripcion,
        cantidadM3: c.cantidadM3,
        precioUnitario: c.precioUnitario
      }));
    }

    this.http.post<any>(`${environment.apiUrl}/facturas`, dto).subscribe({
      next: r => {
        this.snack.open(`✓ Factura ${r.folioFormateado} generada — $${r.total}`, 'OK', { duration: 4000 });
        this.cerrarModal();
        this.cargar();
        this.guardando = false;
      },
      error: () => { this.snack.open('Error al generar factura', 'OK', { duration: 3000 }); this.guardando = false; }
    });
  }

  pagar(f: Factura) {
    this.http.put(`${environment.apiUrl}/facturas/${f.id}/pagar`, {}).subscribe({
      next: () => { this.snack.open('✅ Factura marcada como pagada', 'OK', { duration: 3000 }); this.cargar(); },
      error: () => {}
    });
  }

  cancelar(f: Factura) {
    this.http.put(`${environment.apiUrl}/facturas/${f.id}/cancelar`, {}).subscribe({
      next: () => { this.snack.open('Factura cancelada', 'OK', { duration: 3000 }); this.cargar(); },
      error: () => {}
    });
  }

  eliminar(f: Factura) {
    if (!confirm(`¿Eliminar ${f.folioFormateado}?`)) return;
    this.http.delete(`${environment.apiUrl}/facturas/${f.id}`).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => {}
    });
  }

  verPDF(f: Factura) {
    // Cargar factura completa con conceptos
    this.http.get<Factura>(`${environment.apiUrl}/facturas/${f.id}`).subscribe({
      next: factura => this.facturaVisualizando = factura,
      error: () => {}
    });
  }

  imprimir() {
    window.print();
  }

  statusClass(status: any): string {
    const m: Record<string, string> = { 'PENDIENTE': 'pendiente', 'PAGADA': 'pagada', 'CANCELADA': 'cancelada' };
    return m[status] || 'pendiente';
  }

  statusLabel(status: any): string {
    const l: Record<string, string> = { 'PENDIENTE': 'Pendiente', 'PAGADA': 'Pagada', 'CANCELADA': 'Cancelada' };
    return l[status] || status;
  }
}
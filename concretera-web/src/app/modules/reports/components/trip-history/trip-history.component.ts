import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-trip-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Historial de viajes</h1>
          <p class="page-sub">{{ pedidosFiltrados.length }} de {{ pedidos.length }} registros</p>
        </div>
        <div class="header-actions">
          <button class="btn-export" (click)="exportarExcel()" [disabled]="pedidosFiltrados.length === 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <!-- Búsqueda texto -->
        <div class="search-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input [(ngModel)]="busqueda" (ngModelChange)="filtrarLocal()"
            placeholder="Buscar cliente, dirección, camión..." class="search-input">
        </div>

        <div class="filter-group">
          <label class="filter-label">Período</label>
          <select class="filter-select" [(ngModel)]="filtroPeriodo" (ngModelChange)="onPeriodoChange()">
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Camión</label>
          <select class="filter-select" [(ngModel)]="filtroCamion" (ngModelChange)="filtrarLocal()">
            <option value="">Todos</option>
            <option *ngFor="let c of camiones" [value]="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Cliente</label>
          <select class="filter-select" [(ngModel)]="filtroCliente" (ngModelChange)="filtrarLocal()">
            <option value="">Todos</option>
            <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Estado</label>
          <select class="filter-select" [(ngModel)]="filtroStatus" (ngModelChange)="filtrarLocal()">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div class="filter-actions">
          <button class="btn-search" (click)="buscar()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
          </button>
          <button class="btn-clear" (click)="limpiarFiltros()">Limpiar</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-strip" *ngIf="!cargando">
        <div class="kpi-item">
          <div class="kpi-val">{{ pedidosFiltrados.length }}</div>
          <div class="kpi-lbl">Total viajes</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val">{{ totalM3 | number:'1.0-1' }}<span class="kpi-unit">m³</span></div>
          <div class="kpi-lbl">Volumen total</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val kpi-green">{{ entregados }}</div>
          <div class="kpi-lbl">Entregados</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val kpi-yellow">{{ pendientes }}</div>
          <div class="kpi-lbl">Pendientes</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val kpi-red">{{ cancelados }}</div>
          <div class="kpi-lbl">Cancelados</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val">{{ promedioMinutos | number:'1.0-0' }}<span class="kpi-unit">min</span></div>
          <div class="kpi-lbl">Ciclo promedio</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-val">{{ pctEntregados | number:'1.0-0' }}<span class="kpi-unit">%</span></div>
          <div class="kpi-lbl">Tasa de entrega</div>
        </div>
      </div>

      <!-- Gráfica de barras por día -->
      <div class="chart-section" *ngIf="!cargando && viajesPorDia.length > 0">
        <div class="chart-header">
          <div class="chart-title">Viajes por día</div>
          <div class="chart-legend">
            <span class="leg-item"><span class="leg-dot" style="background:#22c55e"></span>Entregados</span>
            <span class="leg-item"><span class="leg-dot" style="background:#f97316"></span>Otros</span>
          </div>
        </div>
        <div class="bar-chart">
          <div class="bars-area">
            <div class="bar-col" *ngFor="let d of viajesPorDia">
              <div class="bar-wrap">
                <div class="bar-tooltip">{{ d.fecha }}: {{ d.total }} viajes ({{ d.entregados }} entregados)</div>
                <div class="bar-stack">
                  <div class="bar-seg"
                    [style.height.%]="maxDia > 0 ? (d.otros / maxDia) * 100 : 0"
                    style="background:#f97316; opacity:0.7; border-radius:3px 3px 0 0">
                  </div>
                  <div class="bar-seg"
                    [style.height.%]="maxDia > 0 ? (d.entregados / maxDia) * 100 : 0"
                    style="background:#22c55e; border-radius:3px 3px 0 0">
                  </div>
                </div>
              </div>
              <div class="bar-label">{{ d.fecha }}</div>
            </div>
          </div>
          <div class="chart-baseline"></div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando historial...</span>
      </div>

      <!-- Table -->
      <div class="table-wrap" *ngIf="!cargando">
        <div class="table-toolbar" *ngIf="pedidosFiltrados.length > 0">
          <span class="table-count">{{ pedidosPaginados.length }} de {{ pedidosFiltrados.length }}</span>
          <div class="sort-group">
            <select class="sort-select" [(ngModel)]="sortField" (ngModelChange)="sortear()">
              <option value="fecha">Fecha</option>
              <option value="m3">m³</option>
              <option value="ciclo">Ciclo</option>
            </select>
            <button class="sort-dir" (click)="toggleSort()">
              {{ sortAsc ? '↑' : '↓' }}
            </button>
          </div>
        </div>

        <table *ngIf="pedidosPaginados.length > 0; else empty">
          <thead>
            <tr>
              <th>#</th>
              <th (click)="setSortField('fecha')" class="th-sort">
                Fecha y hora
                <span *ngIf="sortField==='fecha'">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th>Camión</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th (click)="setSortField('ciclo')" class="th-sort">
                Ciclo
                <span *ngIf="sortField==='ciclo'">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th (click)="setSortField('m3')" class="th-sort">
                m³
                <span *ngIf="sortField==='m3'">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th>Estado</th>
              <th>Entregado</th>
              <th>Firma</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pedidosPaginados; let i = index"
              [class.row-entregado]="esEntregado(p.status)"
              [class.row-cancelado]="esCancelado(p.status)">
              <td class="td-id">#{{ p.id }}</td>
              <td class="td-mono">{{ p.fechaSolicitada | date:'dd/MM/yy HH:mm' }}</td>
              <td>
                <span class="truck-pill">{{ p.camion?.nombre || '—' }}</span>
              </td>
              <td class="td-cliente">{{ p.cliente?.nombre || '—' }}</td>
              <td class="td-addr" [title]="p.direccion">{{ p.direccion }}</td>
              <td class="td-mono td-center">
                <span class="ciclo-val">{{ cicloTotal(p) }}m</span>
                <span class="ciclo-detail">{{ p.travelMinutos }}+{{ p.descargaMinutos }}+{{ p.travelMinutos }}</span>
              </td>
              <td class="td-mono td-center td-m3">{{ p.m3Solicitados }}</td>
              <td>
                <span [class]="'status-chip status-' + statusClass(p.status)">
                  {{ statusLabel(p.status) }}
                </span>
              </td>
              <td class="td-mono td-muted">
                {{ p.fechaEntrega ? (p.fechaEntrega | date:'dd/MM HH:mm') : '—' }}
              </td>
              <td class="td-center">
                <span class="firma-check" *ngIf="p.firmaDigitalUrl" title="Tiene firma">✓</span>
                <span class="firma-none" *ngIf="!p.firmaDigitalUrl">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación -->
        <div class="pagination" *ngIf="totalPaginas > 1">
          <button class="page-btn" [disabled]="paginaActual === 1" (click)="irPagina(1)">«</button>
          <button class="page-btn" [disabled]="paginaActual === 1" (click)="irPagina(paginaActual - 1)">‹</button>
          <button class="page-btn" *ngFor="let p of paginasVisibles"
            [class.active]="p === paginaActual" (click)="irPagina(p)">
            {{ p }}
          </button>
          <button class="page-btn" [disabled]="paginaActual === totalPaginas" (click)="irPagina(paginaActual + 1)">›</button>
          <button class="page-btn" [disabled]="paginaActual === totalPaginas" (click)="irPagina(totalPaginas)">»</button>
          <span class="page-info">Página {{ paginaActual }} de {{ totalPaginas }}</span>
        </div>

        <ng-template #empty>
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <p>No hay registros para los filtros seleccionados</p>
            <button class="btn-clear" (click)="limpiarFiltros()">Ver todos</button>
          </div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
    .reports-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

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

    .btn-export {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.25);
      border-radius: 7px;
      color: #22c55e;
      font-size: 13px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-export:hover:not(:disabled) { background: rgba(34,197,94,0.18); }
    .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      padding: 16px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      flex: 1;
      min-width: 220px;
      transition: border-color 0.15s;
    }

    .search-box:focus-within { border-color: #f97316; }
    .search-box svg { color: #5a5e6a; flex-shrink: 0; }

    .search-input {
      padding: 8px 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      width: 100%;
    }

    .search-input::placeholder { color: #3a3e48; }

    .filter-group { display: flex; flex-direction: column; gap: 6px; }

    .filter-label {
      font-size: 10px;
      font-weight: 600;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .filter-select {
      padding: 8px 10px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      min-width: 130px;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .filter-select:focus { border-color: #f97316; }
    .filter-select option { background: #1a1d24; }

    .filter-actions { display: flex; gap: 8px; align-items: flex-end; }

    .btn-search {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
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

    .btn-search:hover { transform: translateY(-1px); }

    .btn-clear {
      padding: 8px 14px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 7px;
      color: #8b8f9a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-clear:hover { border-color: rgba(255,255,255,0.2); color: #f0f1f3; }

    /* KPI Strip */
    .kpi-strip {
      display: flex;
      align-items: center;
      padding: 14px 20px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      margin-bottom: 16px;
      overflow-x: auto;
    }

    .kpi-item { flex: 1; text-align: center; min-width: 80px; }
    .kpi-val { font-size: 20px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .kpi-val.kpi-green { color: #22c55e; }
    .kpi-val.kpi-yellow { color: #eab308; }
    .kpi-val.kpi-red { color: #ef4444; }
    .kpi-unit { font-size: 11px; color: #5a5e6a; font-weight: 400; margin-left: 2px; font-family: 'DM Sans', sans-serif; }
    .kpi-lbl { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }
    .kpi-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.07); flex-shrink: 0; margin: 0 4px; }

    /* Chart */
    .chart-section {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .chart-title { font-size: 13px; font-weight: 600; color: #f0f1f3; }

    .chart-legend { display: flex; gap: 16px; }

    .leg-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #8b8f9a;
    }

    .leg-dot { width: 8px; height: 8px; border-radius: 50%; }

    .bar-chart { display: flex; flex-direction: column; gap: 8px; }

    .bars-area {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 120px;
    }

    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      height: 100%;
    }

    .bar-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      position: relative;
    }

    .bar-wrap:hover .bar-tooltip { opacity: 1; }

    .bar-tooltip {
      position: absolute;
      bottom: 105%;
      left: 50%;
      transform: translateX(-50%);
      background: #22262f;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      padding: 4px 8px;
      font-size: 10px;
      color: #f0f1f3;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
      z-index: 10;
    }

    .bar-stack {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 1px;
      height: 100%;
    }

    .bar-seg { width: 100%; min-height: 2px; transition: height 0.6s ease; }

    .bar-label { font-size: 9px; color: #5a5e6a; text-align: center; }

    .chart-baseline { height: 1px; background: rgba(255,255,255,0.06); }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Table */
    .table-wrap {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .table-count { font-size: 12px; color: #5a5e6a; }

    .sort-group { display: flex; gap: 6px; align-items: center; }

    .sort-select {
      padding: 4px 8px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 5px;
      color: #f0f1f3;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      cursor: pointer;
    }

    .sort-select option { background: #1a1d24; }

    .sort-dir {
      padding: 4px 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 5px;
      color: #f0f1f3;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sort-dir:hover { background: rgba(255,255,255,0.1); }

    table { width: 100%; border-collapse: collapse; }

    thead { background: #1a1d24; }

    th {
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      white-space: nowrap;
    }

    th.th-sort { cursor: pointer; user-select: none; }
    th.th-sort:hover { color: #f97316; }

    td {
      padding: 11px 14px;
      font-size: 13px;
      color: #8b8f9a;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    tr.row-entregado td { border-left: 2px solid transparent; }
    tr.row-entregado:hover td { border-left-color: #22c55e; }
    tr.row-cancelado { opacity: 0.5; }

    .td-id { font-family: 'DM Mono', monospace; font-size: 11px; color: #3a3e48; }
    .td-mono { font-family: 'DM Mono', monospace; font-size: 12px; }
    .td-center { text-align: center; }
    .td-muted { color: #3a3e48; }
    .td-m3 { color: #f0f1f3; font-weight: 700; font-size: 14px; }

    .td-addr {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }

    .td-cliente { font-weight: 500; color: #f0f1f3; }

    .truck-pill {
      display: inline-block;
      padding: 2px 8px;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 4px;
      font-size: 11px;
      color: #60a5fa;
      font-weight: 600;
      white-space: nowrap;
    }

    .ciclo-val { display: block; font-weight: 700; color: #f0f1f3; }
    .ciclo-detail { display: block; font-size: 9px; color: #3a3e48; margin-top: 1px; }

    .status-chip {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .status-pendiente  { background: rgba(234,179,8,0.1);   color: #eab308; }
    .status-asignado   { background: rgba(59,130,246,0.1);  color: #3b82f6; }
    .status-en_proceso { background: rgba(168,85,247,0.1);  color: #a855f7; }
    .status-entregado  { background: rgba(34,197,94,0.1);   color: #22c55e; }
    .status-cancelado  { background: rgba(239,68,68,0.1);   color: #ef4444; }

    .firma-check { color: #22c55e; font-weight: 700; font-size: 14px; }
    .firma-none { color: #3a3e48; }

    /* Paginación */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 14px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border-radius: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      color: #8b8f9a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: #f0f1f3; }
    .page-btn.active { background: #f97316; border-color: #f97316; color: white; font-weight: 700; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .page-info { font-size: 11px; color: #5a5e6a; margin-left: 8px; }

    /* Empty */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      color: #3a3e48;
    }

    .empty-icon {
      width: 56px; height: 56px;
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state p { font-size: 13px; color: #5a5e6a; }

    @media (max-width: 768px) {
      .reports-page { padding: 16px; }
      .filters-bar { gap: 8px; }
      .kpi-strip { gap: 8px; }
      .kpi-divider { display: none; }
      .table-wrap { overflow-x: auto; }
    }
  `]
})
export class TripHistoryComponent implements OnInit {
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  pedidosPaginados: any[] = [];
  camiones: any[] = [];
  clientes: any[] = [];
  cargando = false;

  // Filtros
  busqueda = '';
  filtroPeriodo = 'mes';
  filtroCamion = '';
  filtroCliente = '';
  filtroStatus = '';
  desde: Date = new Date();
  hasta: Date = new Date();

  // Sort
  sortField = 'fecha';
  sortAsc = false;

  // Paginación
  paginaActual = 1;
  porPagina = 25;

  // Gráfica
  viajesPorDia: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.onPeriodoChange();
    Promise.all([this.cargarCamiones(), this.cargarClientes()]).then(() => this.buscar());
  }

  onPeriodoChange() {
    const hoy = new Date();
    this.hasta = new Date(hoy); this.hasta.setHours(23, 59, 59);
    switch (this.filtroPeriodo) {
      case 'hoy':    this.desde = new Date(hoy); this.desde.setHours(0, 0, 0); break;
      case 'semana': this.desde = new Date(hoy); this.desde.setDate(hoy.getDate() - 7); break;
      case 'mes':    this.desde = new Date(hoy); this.desde.setMonth(hoy.getMonth() - 1); break;
      case 'todo':   this.desde = new Date('2024-01-01'); break;
    }
    this.buscar();
  }

  cargarCamiones(): Promise<void> {
    return new Promise(r => this.http.get<any[]>(`${environment.apiUrl}/camiones`)
      .subscribe({ next: c => { this.camiones = c; r(); }, error: () => r() }));
  }

  cargarClientes(): Promise<void> {
    return new Promise(r => this.http.get<any[]>(`${environment.apiUrl}/clientes`)
      .subscribe({ next: c => { this.clientes = c; r(); }, error: () => r() }));
  }

  buscar() {
    this.cargando = true;
    const params: any = {
      desde: this.desde.toISOString(),
      hasta: this.hasta.toISOString()
    };
    if (this.filtroCamion) params['camionId'] = this.filtroCamion;
    if (this.filtroCliente) params['clienteId'] = this.filtroCliente;
    if (this.filtroStatus) params['status'] = this.filtroStatus;

    const query = new URLSearchParams(params).toString();
    this.http.get<any[]>(`${environment.apiUrl}/despacho/historial?${query}`).subscribe({
      next: p => {
        this.pedidos = p;
        this.filtrarLocal();
        this.calcularGrafica();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; }
    });
  }

  filtrarLocal() {
    let base = [...this.pedidos];

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      base = base.filter(p =>
        p.cliente?.nombre?.toLowerCase().includes(q) ||
        p.camion?.nombre?.toLowerCase().includes(q) ||
        p.direccion?.toLowerCase().includes(q) ||
        p.id?.toString().includes(q)
      );
    }

    if (this.filtroCamion) base = base.filter(p => p.camion?.id?.toString() === this.filtroCamion);
    if (this.filtroCliente) base = base.filter(p => p.cliente?.id?.toString() === this.filtroCliente);
    if (this.filtroStatus) base = base.filter(p => p.status?.toString() === this.filtroStatus);

    this.pedidosFiltrados = base;
    this.sortear();
  }

  sortear() {
    this.pedidosFiltrados.sort((a, b) => {
      let va: any, vb: any;
      if (this.sortField === 'fecha') { va = new Date(a.fechaSolicitada).getTime(); vb = new Date(b.fechaSolicitada).getTime(); }
      else if (this.sortField === 'm3') { va = a.m3Solicitados; vb = b.m3Solicitados; }
      else if (this.sortField === 'ciclo') { va = this.cicloTotal(a); vb = this.cicloTotal(b); }
      else { va = 0; vb = 0; }
      return this.sortAsc ? va - vb : vb - va;
    });
    this.paginaActual = 1;
    this.paginar();
  }

  setSortField(f: string) {
    if (this.sortField === f) this.sortAsc = !this.sortAsc;
    else { this.sortField = f; this.sortAsc = false; }
    this.sortear();
  }

  toggleSort() { this.sortAsc = !this.sortAsc; this.sortear(); }

  paginar() {
    const start = (this.paginaActual - 1) * this.porPagina;
    this.pedidosPaginados = this.pedidosFiltrados.slice(start, start + this.porPagina);
  }

  irPagina(p: number) { this.paginaActual = p; this.paginar(); }

  get totalPaginas() { return Math.ceil(this.pedidosFiltrados.length / this.porPagina); }

  get paginasVisibles(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.paginaActual - 2);
    const end = Math.min(this.totalPaginas, this.paginaActual + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  calcularGrafica() {
    const grupos = new Map<string, { total: number; entregados: number; otros: number }>();
    this.pedidos.forEach(p => {
      const fecha = new Date(p.fechaSolicitada).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
      const g = grupos.get(fecha) || { total: 0, entregados: 0, otros: 0 };
      g.total++;
      if (this.esEntregado(p.status)) g.entregados++;
      else g.otros++;
      grupos.set(fecha, g);
    });
    this.viajesPorDia = Array.from(grupos.entries())
      .map(([fecha, v]) => ({ fecha, ...v }))
      .slice(-14); // últimos 14 días
  }

  get maxDia() {
    return Math.max(...this.viajesPorDia.map(d => d.total), 1);
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroPeriodo = 'mes';
    this.filtroCamion = '';
    this.filtroCliente = '';
    this.filtroStatus = '';
    this.onPeriodoChange();
  }

  // KPIs
  get totalM3() { return this.pedidosFiltrados.reduce((s, p) => s + (p.m3Solicitados || 0), 0); }
  get entregados() { return this.pedidosFiltrados.filter(p => this.esEntregado(p.status)).length; }
  get pendientes() { return this.pedidosFiltrados.filter(p => p.status?.toString() === 'PENDIENTE' || p.status === 0).length; }
  get cancelados() { return this.pedidosFiltrados.filter(p => this.esCancelado(p.status)).length; }
  get pctEntregados() { return this.pedidosFiltrados.length > 0 ? (this.entregados / this.pedidosFiltrados.length) * 100 : 0; }
  get promedioMinutos() {
    if (!this.pedidosFiltrados.length) return 0;
    return this.pedidosFiltrados.reduce((s, p) => s + this.cicloTotal(p), 0) / this.pedidosFiltrados.length;
  }

  cicloTotal(p: any): number {
    return (p.travelMinutos || 0) * 2 + (p.descargaMinutos || 0) + 10;
  }

  esEntregado(status: any): boolean {
    return status?.toString() === 'ENTREGADO' || status === 3;
  }

  esCancelado(status: any): boolean {
    return status?.toString() === 'CANCELADO' || status === 4;
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

  exportarExcel() {
    const data = this.pedidosFiltrados.map(p => ({
      'ID': p.id,
      'Fecha': new Date(p.fechaSolicitada).toLocaleString('es-MX'),
      'Camión': p.camion?.nombre || '—',
      'Placas': p.camion?.placas || '—',
      'Cliente': p.cliente?.nombre || '—',
      'Dirección': p.direccion,
      'Tiempo ida (min)': p.travelMinutos,
      'Tiempo descarga (min)': p.descargaMinutos,
      'Ciclo total (min)': this.cicloTotal(p),
      'm³ solicitados': p.m3Solicitados,
      'Estado': this.statusLabel(p.status),
      'Fecha entrega': p.fechaEntrega ? new Date(p.fechaEntrega).toLocaleString('es-MX') : '—',
      'Con firma': p.firmaDigitalUrl ? 'Sí' : 'No',
      'Con foto': p.fotoEntregaUrl ? 'Sí' : 'No',
      'Notas': p.notas || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      {wch:8},{wch:20},{wch:12},{wch:12},{wch:22},{wch:40},
      {wch:16},{wch:20},{wch:16},{wch:14},{wch:12},{wch:20},{wch:10},{wch:10},{wch:20}
    ];

    // Estilo de encabezados
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F97316' } } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');

    // Hoja de resumen
    const resumen = [
      { 'Métrica': 'Total viajes', 'Valor': this.pedidosFiltrados.length },
      { 'Métrica': 'Volumen total (m³)', 'Valor': this.totalM3 },
      { 'Métrica': 'Entregados', 'Valor': this.entregados },
      { 'Métrica': 'Pendientes', 'Valor': this.pendientes },
      { 'Métrica': 'Cancelados', 'Valor': this.cancelados },
      { 'Métrica': 'Tasa de entrega (%)', 'Valor': Math.round(this.pctEntregados) },
      { 'Métrica': 'Ciclo promedio (min)', 'Valor': Math.round(this.promedioMinutos) },
    ];

    const ws2 = XLSX.utils.json_to_sheet(resumen);
    ws2['!cols'] = [{wch:25},{wch:15}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      `historial_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  }
}
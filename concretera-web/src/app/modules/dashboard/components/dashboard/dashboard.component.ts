import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dash-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard gerencial</h1>
          <p class="page-sub">Métricas y rendimiento operacional</p>
        </div>
        <div class="period-tabs">
          <button class="ptab" [class.active]="periodo === 'hoy'" (click)="setPeriodo('hoy')">Hoy</button>
          <button class="ptab" [class.active]="periodo === 'semana'" (click)="setPeriodo('semana')">Esta semana</button>
          <button class="ptab" [class.active]="periodo === 'mes'" (click)="setPeriodo('mes')">Este mes</button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Calculando métricas...</span>
      </div>

      <div *ngIf="!cargando && data">

        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v3h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-num">{{ data.kpis.totalViajes }}</div>
              <div class="kpi-lbl">Total viajes</div>
            </div>
            <div class="kpi-trend up">+{{ data.kpis.totalViajes }}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-num">{{ data.kpis.m3Total | number:'1.0-0' }}</div>
              <div class="kpi-lbl">m³ entregados</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-num">{{ data.kpis.entregados }}</div>
              <div class="kpi-lbl">Entregados</div>
            </div>
            <div class="kpi-pct" *ngIf="data.kpis.totalViajes > 0">
              {{ (data.kpis.entregados / data.kpis.totalViajes * 100) | number:'1.0-0' }}%
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon yellow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-num">{{ data.kpis.cicloPromedio }}<span class="kpi-unit">min</span></div>
              <div class="kpi-lbl">Ciclo promedio</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-num">{{ data.kpis.pendientes }}</div>
              <div class="kpi-lbl">Pendientes</div>
            </div>
          </div>
        </div>

        <!-- Charts row 1 -->
        <div class="charts-row">

          <!-- Viajes por día -->
          <div class="chart-card wide">
            <div class="chart-header">
              <div class="chart-title">Viajes por día</div>
              <div class="chart-sub">Viajes y m³ en el período</div>
            </div>
            <div class="bar-chart" *ngIf="data.viajesPorDia.length > 0; else noData">
              <div class="bars-area">
                <div class="bar-col" *ngFor="let d of data.viajesPorDia">
                  <div class="bar-wrap">
                    <div class="bar-tooltip">{{ d.viajes }} viajes · {{ d.m3 }} m³</div>
                    <div class="bar-fill"
                      [style.height.%]="getBarHeight(d.viajes, maxViajes)"
                      [style.background]="'linear-gradient(180deg, #f97316, #ea580c)'">
                    </div>
                  </div>
                  <div class="bar-label">{{ d.fecha }}</div>
                </div>
              </div>
              <div class="chart-baseline"></div>
            </div>
          </div>

          <!-- Horas pico -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Horas pico</div>
              <div class="chart-sub">Demanda por hora del día</div>
            </div>
            <div class="horas-chart" *ngIf="data.horasPico.length > 0; else noData">
              <div class="hora-row" *ngFor="let h of data.horasPico">
                <div class="hora-lbl">{{ h.hora }}:00</div>
                <div class="hora-bar-track">
                  <div class="hora-bar-fill"
                    [style.width.%]="getBarHeight(h.viajes, maxHora)"
                    [style.background]="getHoraColor(h.viajes, maxHora)">
                  </div>
                </div>
                <div class="hora-val">{{ h.viajes }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Charts row 2 -->
        <div class="charts-row">

          <!-- Ranking camiones -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Ranking de camiones</div>
              <div class="chart-sub">Por número de viajes</div>
            </div>
            <div class="ranking-list" *ngIf="data.porCamion.length > 0; else noData">
              <div class="rank-item" *ngFor="let c of data.porCamion; let i = index">
                <div class="rank-pos" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                  {{ i + 1 }}
                </div>
                <div class="rank-info">
                  <div class="rank-name">{{ c.camion }}</div>
                  <div class="rank-bar-track">
                    <div class="rank-bar-fill"
                      [style.width.%]="getBarHeight(c.viajes, data.porCamion[0].viajes)"
                      style="background: linear-gradient(90deg, #3b82f6, #60a5fa)">
                    </div>
                  </div>
                </div>
                <div class="rank-stats">
                  <div class="rank-val">{{ c.viajes }}</div>
                  <div class="rank-sub">{{ c.m3 }} m³</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top clientes -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Top clientes</div>
              <div class="chart-sub">Por volumen de m³</div>
            </div>
            <div class="ranking-list" *ngIf="data.porCliente.length > 0; else noData">
              <div class="rank-item" *ngFor="let c of data.porCliente; let i = index">
                <div class="rank-pos" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                  {{ i + 1 }}
                </div>
                <div class="rank-info">
                  <div class="rank-name">{{ c.cliente }}</div>
                  <div class="rank-bar-track">
                    <div class="rank-bar-fill"
                      [style.width.%]="getBarHeight(c.m3, data.porCliente[0].m3)"
                      style="background: linear-gradient(90deg, #a855f7, #c084fc)">
                    </div>
                  </div>
                </div>
                <div class="rank-stats">
                  <div class="rank-val">{{ c.m3 }} m³</div>
                  <div class="rank-sub">{{ c.viajes }} viajes</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Entregados vs Cola -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Estado de pedidos</div>
              <div class="chart-sub">Distribución del período</div>
            </div>
            <div class="donut-area">
              <div class="donut-wrap">
                <svg viewBox="0 0 120 120" class="donut-svg">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="16"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#22c55e" stroke-width="16"
                    [attr.stroke-dasharray]="entregadosDash + ' ' + (301 - entregadosDash)"
                    [attr.stroke-dashoffset]="75" stroke-linecap="round"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f97316" stroke-width="16"
                    [attr.stroke-dasharray]="pendientesDash + ' ' + (301 - pendientesDash)"
                    [attr.stroke-dashoffset]="75 - entregadosDash" stroke-linecap="round"/>
                  <text x="60" y="55" text-anchor="middle" fill="#f0f1f3" font-size="20" font-weight="700" font-family="DM Mono">
                    {{ data.kpis.totalViajes }}
                  </text>
                  <text x="60" y="70" text-anchor="middle" fill="#5a5e6a" font-size="9" font-family="DM Sans">
                    viajes
                  </text>
                </svg>
              </div>
              <div class="donut-legend">
                <div class="legend-item">
                  <div class="legend-dot" style="background:#22c55e"></div>
                  <div>
                    <div class="legend-lbl">Entregados</div>
                    <div class="legend-val">{{ data.kpis.entregados }}</div>
                  </div>
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background:#f97316"></div>
                  <div>
                    <div class="legend-lbl">Pendientes</div>
                    <div class="legend-val">{{ data.kpis.pendientes }}</div>
                  </div>
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background:#3b82f6"></div>
                  <div>
                    <div class="legend-lbl">Asignados</div>
                    <div class="legend-val">{{ data.kpis.totalViajes - data.kpis.entregados - data.kpis.pendientes }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <ng-template #noData>
        <div class="no-data">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Sin datos para este período
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .dash-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .page-sub { font-size: 13px; color: #5a5e6a; }

    .period-tabs {
      display: flex;
      gap: 4px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      padding: 4px;
    }

    .ptab {
      padding: 6px 16px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: #5a5e6a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .ptab:hover { color: #8b8f9a; }
    .ptab.active { background: #f97316; color: white; font-weight: 700; }

    /* Loading */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 48px;
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

    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

    .kpi-icon {
      width: 36px; height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon.blue   { background: rgba(59,130,246,0.15);  color: #3b82f6; }
    .kpi-icon.orange { background: rgba(249,115,22,0.15);  color: #f97316; }
    .kpi-icon.green  { background: rgba(34,197,94,0.15);   color: #22c55e; }
    .kpi-icon.yellow { background: rgba(234,179,8,0.15);   color: #eab308; }
    .kpi-icon.red    { background: rgba(239,68,68,0.15);   color: #ef4444; }

    .kpi-body { flex: 1; min-width: 0; }

    .kpi-num {
      font-size: 24px;
      font-weight: 700;
      color: #f0f1f3;
      font-family: 'DM Mono', monospace;
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .kpi-unit { font-size: 13px; color: #5a5e6a; font-weight: 400; margin-left: 2px; font-family: 'DM Sans', sans-serif; }
    .kpi-lbl { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

    .kpi-trend {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .kpi-trend.up { background: rgba(34,197,94,0.1); color: #22c55e; }

    .kpi-pct {
      font-size: 12px;
      font-weight: 700;
      color: #22c55e;
      flex-shrink: 0;
    }

    /* Charts layout */
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .charts-row:last-child {
      grid-template-columns: repeat(3, 1fr);
    }

    .chart-card {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 20px;
    }

    .chart-card.wide { grid-column: span 1; }

    .chart-header { margin-bottom: 16px; }

    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #f0f1f3;
      margin-bottom: 4px;
    }

    .chart-sub { font-size: 11px; color: #5a5e6a; }

    /* Bar chart */
    .bar-chart { display: flex; flex-direction: column; gap: 8px; }

    .bars-area {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 140px;
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

    .bar-fill {
      width: 100%;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.6s cubic-bezier(0.4,0,0.2,1);
    }

    .bar-label { font-size: 9px; color: #5a5e6a; text-align: center; }

    .chart-baseline {
      height: 1px;
      background: rgba(255,255,255,0.06);
    }

    /* Horas pico */
    .horas-chart { display: flex; flex-direction: column; gap: 6px; }

    .hora-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hora-lbl { font-size: 10px; color: #5a5e6a; width: 32px; flex-shrink: 0; font-family: 'DM Mono', monospace; }

    .hora-bar-track {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.04);
      border-radius: 3px;
      overflow: hidden;
    }

    .hora-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .hora-val { font-size: 10px; color: #8b8f9a; width: 16px; text-align: right; font-family: 'DM Mono', monospace; }

    /* Ranking */
    .ranking-list { display: flex; flex-direction: column; gap: 8px; }

    .rank-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .rank-item:last-child { border-bottom: none; }

    .rank-pos {
      width: 22px; height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.05);
      color: #5a5e6a;
      flex-shrink: 0;
    }

    .rank-pos.gold   { background: rgba(234,179,8,0.15);  color: #eab308; }
    .rank-pos.silver { background: rgba(156,163,175,0.15); color: #9ca3af; }
    .rank-pos.bronze { background: rgba(180,83,9,0.15);   color: #b45309; }

    .rank-info { flex: 1; min-width: 0; }

    .rank-name {
      font-size: 12px;
      font-weight: 600;
      color: #f0f1f3;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rank-bar-track {
      height: 4px;
      background: rgba(255,255,255,0.04);
      border-radius: 2px;
      overflow: hidden;
    }

    .rank-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .rank-stats { text-align: right; flex-shrink: 0; }
    .rank-val { font-size: 14px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .rank-sub { font-size: 10px; color: #5a5e6a; }

    /* Donut */
    .donut-area {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .donut-wrap { flex-shrink: 0; }

    .donut-svg {
      width: 120px;
      height: 120px;
      transform: rotate(-90deg);
    }

    .donut-svg text { transform: rotate(90deg) translate(0, 0); transform-origin: center; }

    .donut-legend { display: flex; flex-direction: column; gap: 12px; }

    .legend-item { display: flex; align-items: center; gap: 8px; }

    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .legend-lbl { font-size: 11px; color: #5a5e6a; }
    .legend-val { font-size: 16px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }

    /* No data */
    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: #3a3e48;
      font-size: 12px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-row { grid-template-columns: repeat(3, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
      .charts-row:last-child { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .dash-page { padding: 16px; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  data: any = null;
  cargando = false;
  periodo = 'semana';

  get maxViajes(): number {
    if (!this.data?.viajesPorDia?.length) return 1;
    return Math.max(...this.data.viajesPorDia.map((d: any) => d.viajes));
  }

  get maxHora(): number {
    if (!this.data?.horasPico?.length) return 1;
    return Math.max(...this.data.horasPico.map((h: any) => h.viajes));
  }

  get entregadosDash(): number {
    if (!this.data?.kpis?.totalViajes) return 0;
    return Math.round((this.data.kpis.entregados / this.data.kpis.totalViajes) * 301);
  }

  get pendientesDash(): number {
    if (!this.data?.kpis?.totalViajes) return 0;
    return Math.round((this.data.kpis.pendientes / this.data.kpis.totalViajes) * 301);
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

  setPeriodo(p: string) {
    this.periodo = p;
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.http.get<any>(`${environment.apiUrl}/metricas?periodo=${this.periodo}`).subscribe({
      next: d => { this.data = d; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; }
    });
  }

  getBarHeight(val: number, max: number): number {
    if (!max) return 0;
    return Math.max(4, (val / max) * 100);
  }

  getHoraColor(val: number, max: number): string {
    const pct = val / max;
    if (pct > 0.7) return 'linear-gradient(90deg, #f97316, #fb923c)';
    if (pct > 0.4) return 'linear-gradient(90deg, #eab308, #fbbf24)';
    return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
  }
}

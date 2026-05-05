import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { Truck } from '../../../../core/models/truck';
import { TruckService } from '../../../../core/services/truck.service';

@Component({
  selector: 'app-truck-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  template: `
    <div class="truck-card" [class]="'card-' + statusKey" [style.--accent]="statusColor">
      <!-- Top row -->
      <div class="card-top">
        <div class="truck-id">
          <div class="truck-dot" [style.background]="truck.color"></div>
          <span class="truck-name">{{ truck.nombre }}</span>
        </div>
        <span class="status-badge" [class]="'badge-' + statusKey">{{ statusLabel }}</span>
      </div>

      <!-- Destination -->
      <div class="truck-dest">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.4">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        {{ truck.destinoNombre || 'Sin asignar' }}
      </div>

      <!-- Countdown -->
      <div class="countdown-area" *ngIf="statusKey !== 'libre'">
        <div class="countdown-num" [style.color]="statusColor">{{ countdownStr }}</div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="progressPct" [style.background]="statusColor"></div>
        </div>
      </div>

      <div class="available-badge" *ngIf="statusKey === 'libre'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Disponible
      </div>

      <!-- Phase dots -->
      <div class="phases">
        <div class="phase-item" [class.done]="phaseIndex > 0" [class.active]="phaseIndex === 0">
          <div class="ph-dot"></div>
          <span>Carga</span>
        </div>
        <div class="ph-line"></div>
        <div class="phase-item" [class.done]="phaseIndex > 1" [class.active]="phaseIndex === 1">
          <div class="ph-dot"></div>
          <span>Viaje</span>
        </div>
        <div class="ph-line"></div>
        <div class="phase-item" [class.done]="phaseIndex > 2" [class.active]="phaseIndex === 2">
          <div class="ph-dot"></div>
          <span>Desc.</span>
        </div>
        <div class="ph-line"></div>
        <div class="phase-item" [class.done]="phaseIndex > 3" [class.active]="phaseIndex === 3">
          <div class="ph-dot"></div>
          <span>Regreso</span>
        </div>
      </div>

      <!-- Meta -->
      <div class="card-meta" *ngIf="statusKey !== 'libre'">
        <span class="meta-item">
          <span class="meta-label">Ida</span>
          <span class="meta-val">{{ truck.travelMinutos }}m</span>
        </span>
        <span class="meta-sep">·</span>
        <span class="meta-item">
          <span class="meta-label">Desc.</span>
          <span class="meta-val">{{ truck.descargaMinutos }}m</span>
        </span>
        <span class="meta-sep">·</span>
        <span class="meta-item">
          <span class="meta-label">Libre</span>
          <span class="meta-val">{{ freeTimeStr }}</span>
        </span>
      </div>

      <!-- Glow effect -->
      <div class="card-glow" [style.background]="statusColor"></div>
    </div>
  `,
  styles: [`
    .truck-card {
      position: relative;
      padding: 16px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;
    }

    .truck-card:hover {
      border-color: rgba(255,255,255,0.14);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .card-glow {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      opacity: 0.6;
    }

    /* Top row */
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .truck-id {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .truck-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .truck-name {
      font-size: 13px;
      font-weight: 600;
      color: #f0f1f3;
      letter-spacing: -0.01em;
    }

    /* Status Badge */
    .status-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .badge-libre       { background: rgba(34,197,94,0.1);  color: #22c55e; }
    .badge-cargando    { background: rgba(249,115,22,0.1); color: #f97316; }
    .badge-en_ruta     { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .badge-descargando { background: rgba(239,68,68,0.1);  color: #ef4444; }
    .badge-regresando  { background: rgba(168,85,247,0.1); color: #a855f7; }

    /* Destination */
    .truck-dest {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #5a5e6a;
      margin-bottom: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Countdown */
    .countdown-area { margin-bottom: 12px; }

    .countdown-num {
      font-family: 'DM Mono', monospace;
      font-size: 26px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-align: center;
      margin-bottom: 8px;
      line-height: 1;
    }

    .progress-track {
      height: 3px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.8s linear;
      opacity: 0.8;
    }

    /* Available */
    .available-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: rgba(34,197,94,0.06);
      border: 1px dashed rgba(34,197,94,0.2);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #22c55e;
      margin-bottom: 12px;
    }

    /* Phases */
    .phases {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 10px;
    }

    .phase-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }

    .phase-item span {
      font-size: 9px;
      color: #3a3e48;
      letter-spacing: 0.03em;
      transition: color 0.2s;
    }

    .phase-item.done span { color: #22c55e; }
    .phase-item.active span { color: #f97316; }

    .ph-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      transition: background 0.2s, box-shadow 0.2s;
    }

    .phase-item.done .ph-dot {
      background: #22c55e;
    }

    .phase-item.active .ph-dot {
      background: #f97316;
      box-shadow: 0 0 6px rgba(249,115,22,0.5);
    }

    .ph-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 0 4px;
      margin-bottom: 10px;
    }

    /* Meta */
    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }

    .meta-item { display: flex; gap: 4px; align-items: center; }
    .meta-label { color: #3a3e48; }
    .meta-val { color: #8b8f9a; font-family: 'DM Mono', monospace; }
    .meta-sep { color: #3a3e48; }
  `]
})
export class TruckCardComponent implements OnInit, OnDestroy {
  @Input() truck!: Truck;
  countdownMs = 0;
  private timerSub?: Subscription;

  constructor(private truckService: TruckService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.timerSub = interval(1000).subscribe(() => {
      this.updateCountdown();
      this.cdr.markForCheck();
    });
    this.updateCountdown();
  }

  ngOnDestroy() { this.timerSub?.unsubscribe(); }

  get statusKey(): string {
    const s = this.truck?.status;
    if (s === null || s === undefined) return 'libre';
    const numMap: Record<number, string> = { 0:'libre', 1:'cargando', 2:'en_ruta', 3:'descargando', 4:'regresando', 5:'mantenimiento' };
    if (typeof s === 'number') return numMap[s] || 'libre';
    return s.toString().toLowerCase();
  }

  private getMs(dateStr: any): number {
    if (!dateStr) return 0;
    const str = dateStr.toString();
    return (str.endsWith('Z') ? new Date(str) : new Date(str + 'Z')).getTime() - Date.now();
  }

  private updateCountdown() {
    const s = this.statusKey;
    if (s === 'cargando')    this.countdownMs = this.getMs(this.truck.cargaFin);
    else if (s === 'en_ruta')     this.countdownMs = this.getMs(this.truck.llegadaEstimada);
    else if (s === 'descargando') this.countdownMs = this.getMs(this.truck.descargaFin);
    else if (s === 'regresando')  this.countdownMs = this.getMs(this.truck.regresoFin);
    else this.countdownMs = 0;
  }

  get countdownStr(): string {
    const ms = Math.max(0, this.countdownMs);
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  }

  get progressPct(): number {
    const ms = Math.max(0, this.countdownMs);
    const s = this.statusKey;
    const m = 60000;
    if (s === 'cargando')    return Math.min(100, Math.max(0, (1 - ms / (10 * m)) * 100));
    if (s === 'en_ruta')     return Math.min(100, Math.max(0, (1 - ms / (this.truck.travelMinutos * m)) * 100));
    if (s === 'descargando') return Math.min(100, Math.max(0, (1 - ms / (this.truck.descargaMinutos * m)) * 100));
    if (s === 'regresando')  return Math.min(100, Math.max(0, (1 - ms / (this.truck.travelMinutos * m)) * 100));
    return 0;
  }

  get statusColor(): string {
    const c: Record<string, string> = { libre:'#22c55e', cargando:'#f97316', en_ruta:'#3b82f6', descargando:'#ef4444', regresando:'#a855f7' };
    return c[this.statusKey] || '#5a5e6a';
  }

  get statusLabel(): string {
    const l: Record<string, string> = { libre:'Libre', cargando:'Cargando', en_ruta:'En ruta', descargando:'Descargando', regresando:'Regresando' };
    return l[this.statusKey] || this.truck.status?.toString() || '';
  }

  get phaseIndex(): number {
    const i: Record<string, number> = { libre:-1, cargando:0, en_ruta:1, descargando:2, regresando:3 };
    return i[this.statusKey] ?? -1;
  }

  get freeTimeStr(): string {
    const t = this.truckService.getTiempoLibre(this.truck);
    return t ? t.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) : '--:--';
  }
}

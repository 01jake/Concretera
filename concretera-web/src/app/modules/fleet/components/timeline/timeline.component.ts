import { Component, Input, OnInit, OnDestroy, OnChanges, ChangeDetectorRef, NgZone } from '@angular/core';import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { interval, Subscription } from 'rxjs';
import { Truck } from '../../../../core/models/truck';
import { TruckService } from '../../../../core/services/truck.service';

interface TimelineSegment {
  label: string;
  color: string;
  left: number;
  width: number;
}

interface TruckTimeline {
  truck: Truck;
  segments: TimelineSegment[];
  freeTime: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="timeline-card">
      <div class="tl-header">
        Línea de tiempo — próximos 90 min
        <span class="tl-legend">
          <span class="leg" style="background:#f0a030">C</span> Carga
          <span class="leg" style="background:#4b9ef5">V</span> Viaje
          <span class="leg" style="background:#e05555">D</span> Descarga
          <span class="leg" style="background:#9b72f5">R</span> Regreso
        </span>
      </div>
      <div class="tl-rows">
        <div class="tl-row" *ngFor="let item of timelines">
          <div class="tl-label">{{ item.truck.nombre }}</div>
          <div class="tl-bar">
            <div
              *ngFor="let seg of item.segments"
              class="tl-seg"
              [style.left.%]="seg.left"
              [style.width.%]="seg.width"
              [style.background]="seg.color"
              [title]="seg.label">
              {{ seg.width > 8 ? seg.label : '' }}
            </div>
            <span *ngIf="item.truck.status === 'LIBRE'" class="tl-libre">LIBRE</span>
          </div>
          <div class="tl-eta">{{ item.freeTime }}</div>
        </div>
      </div>
      <div class="tl-axis">
        <span>Ahora</span><span>+30 min</span><span>+60 min</span><span>+90 min</span>
      </div>
    </mat-card>
  `,
  styles: [`
    .timeline-card { padding: 12px 16px; margin-top: 12px; }
    .tl-header {
      font-size: 11px; color: #888; letter-spacing: 0.05em;
      margin-bottom: 10px; display: flex; align-items: center; gap: 12px;
    }
    .tl-legend { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 10px; }
    .leg {
      display: inline-block; width: 18px; height: 14px; border-radius: 3px;
      color: white; font-size: 9px; text-align: center; line-height: 14px;
    }
    .tl-rows { display: flex; flex-direction: column; gap: 4px; }
    .tl-row { display: flex; align-items: center; gap: 8px; }
    .tl-label { font-size: 10px; color: #888; width: 60px; text-align: right; flex-shrink: 0; }
    .tl-bar {
      flex: 1; height: 18px; background: #f5f5f5; border-radius: 4px;
      position: relative; overflow: hidden;
    }
    .tl-seg {
      position: absolute; height: 100%; display: flex; align-items: center;
      justify-content: center; font-size: 9px; color: white; font-weight: 600;
      transition: width 1s linear;
    }
    .tl-libre {
      position: absolute; inset: 0; display: flex; align-items: center;
      padding: 0 8px; font-size: 9px; color: #aaa;
    }
    .tl-eta { font-size: 10px; color: #888; width: 40px; flex-shrink: 0; }
    .tl-axis {
      display: flex; justify-content: space-between;
      font-size: 9px; color: #bbb; margin-top: 4px; padding: 0 68px 0 68px;
    }
  `]
})
export class TimelineComponent implements OnInit, OnDestroy, OnChanges {
  @Input() trucks: Truck[] = [];
  timelines: TruckTimeline[] = [];
  private timerSub?: Subscription;

constructor(
  private truckService: TruckService,
  private cdr: ChangeDetectorRef,
  private ngZone: NgZone
) {}

 ngOnInit() {
  this.buildTimelines();
  this.ngZone.runOutsideAngular(() => {
    this.timerSub = interval(1000).subscribe(() => {
      this.buildTimelines();
      this.ngZone.run(() => this.cdr.detectChanges());
    });
  });
}

  ngOnChanges() {
    this.buildTimelines();
    this.cdr.markForCheck();
  }

  ngOnDestroy() { this.timerSub?.unsubscribe(); }

  private getMs(dateStr: any): number | null {
    if (!dateStr) return null;
    const str = dateStr.toString();
    return str.endsWith('Z')
      ? new Date(str).getTime()
      : new Date(str + 'Z').getTime();
  }

  private buildTimelines() {
    const now = Date.now();
    const horizon = 90 * 60000;

    this.timelines = this.trucks.map(t => {
      const segments: TimelineSegment[] = [];
      const sk = (t.status || 'LIBRE').toString().toLowerCase();
      const freeT = this.truckService.getTiempoLibre(t);
      const freeTime = sk === 'libre' ? 'Ahora'
        : (freeT ? freeT.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--');

      if (sk !== 'libre') {
        const cargaFin  = this.getMs(t.cargaFin);
        const llegada   = this.getMs(t.llegadaEstimada);
        const descargaFin = this.getMs(t.descargaFin);
        const regresoFin  = this.getMs(t.regresoFin);

        // Definir todas las fases con su color y tiempo de fin
        const phases = [
          { label: 'C', color: '#f0a030', active: sk === 'cargando',   e: cargaFin },
          { label: 'V', color: '#4b9ef5', active: sk === 'en_ruta',    e: llegada },
          { label: 'D', color: '#e05555', active: sk === 'descargando', e: descargaFin },
          { label: 'R', color: '#9b72f5', active: sk === 'regresando',  e: regresoFin },
        ];

        // Solo mostrar la fase activa — empieza en 0% y se consume hasta su fin
        const activePhase = phases.find(ph => ph.active);
        if (activePhase && activePhase.e && activePhase.e > now) {
          const width = Math.min(100, (activePhase.e - now) / horizon * 100);
          if (width > 0) {
            segments.push({
              label: activePhase.label,
              color: activePhase.color,
              left: 0,
              width
            });
          }
        }
      }

      return { truck: t, segments, freeTime };
    });
  }
}
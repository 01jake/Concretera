import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { interval, Subscription } from 'rxjs';
import { SignalrService } from '../../../../core/services/signalr.service';
import { TruckService } from '../../../../core/services/truck.service';
import { Truck } from '../../../../core/models/truck';
import { Order } from '../../../../core/models/order';
import { TruckCardComponent } from '../truck-card/truck-card.component';
import { TimelineComponent } from '../timeline/timeline.component';

@Component({
  selector: 'app-fleet-dashboard',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, TruckCardComponent, TimelineComponent],
  template: `
    <div class="fleet-page page-enter">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Flota en tiempo real</h1>
          <p class="page-sub">{{ trucks.length }} camiones · actualización automática</p>
        </div>
        <div class="header-time">{{ horaActual }}</div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-green">
          <div class="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-num">{{ libres }}</div>
            <div class="kpi-label">Libres</div>
          </div>
          <div class="kpi-bar" [style.width.%]="(libres/trucks.length)*100" style="background:var(--green)"></div>
        </div>

        <div class="kpi-card kpi-blue">
          <div class="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-num">{{ enRuta }}</div>
            <div class="kpi-label">En ruta</div>
          </div>
          <div class="kpi-bar" [style.width.%]="(enRuta/trucks.length)*100" style="background:var(--blue)"></div>
        </div>

        <div class="kpi-card kpi-purple">
          <div class="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-num">{{ regresando }}</div>
            <div class="kpi-label">Regresando</div>
          </div>
          <div class="kpi-bar" [style.width.%]="(regresando/trucks.length)*100" style="background:var(--purple)"></div>
        </div>

        <div class="kpi-card kpi-orange">
          <div class="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-num">{{ cola.length }}</div>
            <div class="kpi-label">En cola</div>
          </div>
          <div class="kpi-bar" [style.width.%]="Math.min((cola.length/6)*100,100)" style="background:var(--orange)"></div>
        </div>
      </div>

      <!-- Mapa de conductores en tiempo real -->
      <div class="mapa-section" *ngIf="camionesConUbicacion.length > 0">
        <div class="mapa-header">
          <div class="section-label" style="margin-bottom:0">
            📍 Conductores en tiempo real
          </div>
          <div class="mapa-badges">
            <span *ngFor="let c of camionesConUbicacion" class="mapa-badge" [class]="'mb-' + statusClass(c.status)">
              {{ c.nombre }} · {{ statusLabel(c.status) }}
            </span>
          </div>
        </div>
        <div class="mapa-flota">
          <google-map
            height="380px"
            width="100%"
            [center]="mapCenter"
            [zoom]="12"
            [options]="mapOptions">

            <!-- Planta -->
            <map-marker
              [position]="plantaPos"
              [options]="plantaMarker"
              title="Planta">
            </map-marker>

            <!-- Camiones con GPS activo -->
            <map-marker
              *ngFor="let c of camionesConUbicacion"
              [position]="{ lat: +c.lat, lng: +c.lng }"
              [options]="getCamionMarker(c)"
              [title]="c.nombre + ' — ' + statusLabel(c.status)">
            </map-marker>

          </google-map>
        </div>
        <div class="mapa-footer">
          <span class="mf-item" *ngFor="let c of camionesConUbicacion">
            <span class="mf-dot" [style.background]="getCamionColor(c.status)"></span>
            {{ c.nombre }}
            <span class="mf-eta" *ngIf="c.travelMinutos > 0">· ETA {{ c.travelMinutos }}min</span>
          </span>
          <span class="mf-update">Actualizado hace {{ segundosDesdeUpdate }}s</span>
        </div>
      </div>

      <!-- Sin GPS activo -->
      <div class="no-gps" *ngIf="camionesConUbicacion.length === 0 && enRuta > 0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Hay {{ enRuta }} camión(es) en ruta sin GPS activo
      </div>

      <!-- Trucks Grid -->
      <div class="section-label" style="margin-top: 8px;">Camiones</div>
      <div class="trucks-grid">
        <app-truck-card
          *ngFor="let truck of trucks; trackBy: trackById"
          [truck]="truck">
        </app-truck-card>
      </div>

      <!-- Timeline -->
      <app-timeline [trucks]="trucks"></app-timeline>

    </div>
  `,
  styles: [`
    .fleet-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .page-sub { font-size: 13px; color: #5a5e6a; }

    .header-time {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #5a5e6a;
      padding: 6px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 6px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }

    .kpi-card:hover { transform: translateY(-2px); }
    .kpi-green { border-left: 2px solid var(--green); }
    .kpi-blue  { border-left: 2px solid var(--blue); }
    .kpi-purple{ border-left: 2px solid var(--purple); }
    .kpi-orange{ border-left: 2px solid var(--orange); }

    .kpi-icon {
      width: 36px; height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-green .kpi-icon  { background: rgba(34,197,94,0.1);  color: var(--green); }
    .kpi-blue .kpi-icon   { background: rgba(59,130,246,0.1); color: var(--blue); }
    .kpi-purple .kpi-icon { background: rgba(168,85,247,0.1); color: var(--purple); }
    .kpi-orange .kpi-icon { background: rgba(249,115,22,0.1); color: var(--orange); }

    .kpi-body { flex: 1; }

    .kpi-num {
      font-size: 28px;
      font-weight: 700;
      color: #f0f1f3;
      line-height: 1;
      letter-spacing: -0.02em;
      font-family: 'DM Mono', monospace;
    }

    .kpi-label {
      font-size: 11px;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 4px;
    }

    .kpi-bar {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      opacity: 0.5;
      transition: width 0.6s ease;
    }

    /* Mapa */
    .mapa-section {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .mapa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-wrap: wrap;
      gap: 8px;
    }

    .mapa-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .mapa-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .mb-libre         { background: rgba(34,197,94,0.1);  color: #22c55e; }
    .mb-cargando      { background: rgba(249,115,22,0.1); color: #f97316; }
    .mb-en_ruta       { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .mb-descargando   { background: rgba(168,85,247,0.1); color: #a855f7; }
    .mb-regresando    { background: rgba(234,179,8,0.1);  color: #eab308; }
    .mb-mantenimiento { background: rgba(239,68,68,0.1);  color: #ef4444; }

    .mapa-flota { display: block; }

    .mapa-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      border-top: 1px solid rgba(255,255,255,0.05);
      flex-wrap: wrap;
    }

    .mf-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #8b8f9a;
    }

    .mf-dot { width: 8px; height: 8px; border-radius: 50%; }
    .mf-eta { color: #5a5e6a; font-size: 11px; }

    .mf-update {
      margin-left: auto;
      font-size: 11px;
      color: #3a3e48;
      font-family: 'DM Mono', monospace;
    }

    /* Sin GPS */
    .no-gps {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(234,179,8,0.06);
      border: 1px solid rgba(234,179,8,0.15);
      border-radius: 8px;
      font-size: 12px;
      color: #eab308;
      margin-bottom: 16px;
    }

    /* Section Label */
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }

    /* Trucks Grid */
    .trucks-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    @media (max-width: 1100px) {
      .trucks-grid { grid-template-columns: repeat(2, 1fr); }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .fleet-page { padding: 16px; }
      .trucks-grid { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; gap: 8px; }
      .header-time { display: none; }
    }
  `]
})
export class FleetDashboardComponent implements OnInit, OnDestroy {
  trucks: Truck[] = [];
  cola: Order[] = [];
  horaActual = '';
  Math = Math;
  segundosDesdeUpdate = 0;

  private subs = new Subscription();
  private refreshSub?: Subscription;
  private clockSub?: Subscription;
  private updateCounterSub?: Subscription;
  private ultimaUbicacion = Date.now();

  // Mapa
  plantaPos = { lat: 29.0729, lng: -110.9559 };
  mapCenter = { lat: 29.0729, lng: -110.9559 };

  mapOptions: any = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1d24' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d24' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#5a5e6a' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22262f' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#13151a' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b8f9a' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2f3a' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0d0f' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f0f1f3' }] },
    ]
  };

  plantaMarker: any = {
    icon: {
      path: 0,
      scale: 12,
      fillColor: '#f97316',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    },
    title: 'Planta'
  };

  get libres()     { return this.trucks.filter(t => t.status?.toString().toUpperCase() === 'LIBRE').length; }
  get enRuta()     { return this.trucks.filter(t => ['EN_RUTA','CARGANDO'].includes(t.status?.toString().toUpperCase())).length; }
  get regresando() { return this.trucks.filter(t => ['REGRESANDO','DESCARGANDO'].includes(t.status?.toString().toUpperCase())).length; }

  get camionesConUbicacion(): any[] {
    return this.trucks.filter((t: any) => t.lat && t.lng && t.lat !== 0 && t.lng !== 0);
  }

  trackById(_: number, truck: Truck) { return truck.id; }

  constructor(
    private signalr: SignalrService,
    private truckService: TruckService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadTrucks();

    // Trucks por SignalR
    this.subs.add(this.signalr.trucks$.subscribe(trucks => {
      if (trucks.length) {
        this.ngZone.run(() => {
          this.trucks = trucks.map(t => ({...t}));
          this.cdr.detectChanges();
        });
      }
    }));

    // Cola
    this.subs.add(this.signalr.cola$.subscribe(cola => {
      this.ngZone.run(() => { this.cola = cola; });
    }));

    // Ubicaciones GPS en tiempo real
    this.subs.add(this.signalr.ubicaciones$.subscribe((ub: any) => {
      if (!ub) return;
      this.ngZone.run(() => {
        const idx = this.trucks.findIndex((t: any) => t.id === ub.camionId);
        if (idx >= 0) {
          (this.trucks[idx] as any).lat = ub.lat;
          (this.trucks[idx] as any).lng = ub.lng;
          if (ub.travelMinutosRestantes) {
            (this.trucks[idx] as any).travelMinutos = ub.travelMinutosRestantes;
          }
          this.trucks = [...this.trucks];
          this.ultimaUbicacion = Date.now();
          this.segundosDesdeUpdate = 0;

          // Centrar mapa en los camiones con GPS
          if (this.camionesConUbicacion.length > 0) {
            const lats = this.camionesConUbicacion.map((c: any) => +c.lat);
            const lngs = this.camionesConUbicacion.map((c: any) => +c.lng);
            const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
            this.mapCenter = { lat: avgLat, lng: avgLng };
          }
        }
        this.cdr.detectChanges();
      });
    }));

    // Refresh periódico
    this.refreshSub = interval(10000).subscribe(() => this.loadTrucks());

    // Reloj
    this.clockSub = interval(1000).subscribe(() => {
      this.ngZone.run(() => {
        this.horaActual = new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this.segundosDesdeUpdate = Math.floor((Date.now() - this.ultimaUbicacion) / 1000);
        this.cdr.detectChanges();
      });
    });

    this.horaActual = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  private loadTrucks() {
    this.truckService.getAll().subscribe({
      next: trucks => {
        this.ngZone.run(() => {
          this.trucks = trucks.map(t => ({...t}));
          this.cdr.detectChanges();
        });
      },
      error: err => console.error(err)
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.clockSub?.unsubscribe();
    this.updateCounterSub?.unsubscribe();
  }

  getCamionColor(status: any): string {
    const s = status?.toString().toUpperCase();
    const colores: Record<string, string> = {
      EN_RUTA: '#3b82f6', CARGANDO: '#f97316', DESCARGANDO: '#a855f7',
      REGRESANDO: '#eab308', LIBRE: '#22c55e', MANTENIMIENTO: '#ef4444'
    };
    return colores[s] || '#5a5e6a';
  }

  getCamionMarker(c: any) {
    const color = this.getCamionColor(c.status);
    const nombre = (c.nombre || '').replace('Camión ', 'C').replace('Camion ', 'C');
    return {
      icon: {
        path: 0,
        scale: 11,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      label: {
        text: nombre.length > 4 ? nombre.substring(0, 4) : nombre,
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: '700'
      },
      zIndex: 10
    };
  }

  statusClass(status: any): string {
    const m: Record<string, string> = {
      '0':'libre','1':'cargando','2':'en_ruta','3':'descargando','4':'regresando','5':'mantenimiento',
      'LIBRE':'libre','CARGANDO':'cargando','EN_RUTA':'en_ruta','DESCARGANDO':'descargando',
      'REGRESANDO':'regresando','MANTENIMIENTO':'mantenimiento'
    };
    return m[status?.toString()] || 'libre';
  }

  statusLabel(status: any): string {
    const l: Record<string, string> = {
      '0':'Libre','1':'Cargando','2':'En ruta','3':'Descargando','4':'Regresando','5':'Mantenimiento',
      'LIBRE':'Libre','CARGANDO':'Cargando','EN_RUTA':'En ruta','DESCARGANDO':'Descargando',
      'REGRESANDO':'Regresando','MANTENIMIENTO':'Mantenimiento'
    };
    return l[status?.toString()] || status || '—';
  }
}

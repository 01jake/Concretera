import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { interval, Subscription } from 'rxjs';
import { SignalrService } from '../../../../core/services/signalr.service';
import { TruckService } from '../../../../core/services/truck.service';

@Component({
  selector: 'app-mapa-conductores',
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleMapsModule],
  template: `
    <div class="mapa-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div class="ph-left">
          <a routerLink="/fleet" class="btn-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver a Fleet
          </a>
          <div>
            <h1 class="page-title">Mapa en tiempo real</h1>
            <p class="page-sub">
              {{ camionesConUbicacion.length }} conductor{{ camionesConUbicacion.length !== 1 ? 'es' : '' }} con GPS activo
              <span class="update-time">· actualizado hace {{ segundosDesdeUpdate }}s</span>
            </p>
          </div>
        </div>

        <!-- Leyenda -->
        <div class="leyenda">
          <div class="ley-item" *ngFor="let l of leyenda">
            <div class="ley-dot" [style.background]="l.color"></div>
            <span>{{ l.label }}</span>
          </div>
        </div>
      </div>

      <!-- Stats rápidas -->
      <div class="stats-row">
        <div class="stat-chip stat-blue">
          <span class="sc-num">{{ enRuta }}</span>
          <span class="sc-label">En ruta</span>
        </div>
        <div class="stat-chip stat-orange">
          <span class="sc-num">{{ cargando }}</span>
          <span class="sc-label">Cargando</span>
        </div>
        <div class="stat-chip stat-purple">
          <span class="sc-num">{{ descargando }}</span>
          <span class="sc-label">Descargando</span>
        </div>
        <div class="stat-chip stat-yellow">
          <span class="sc-num">{{ regresando }}</span>
          <span class="sc-label">Regresando</span>
        </div>
      </div>

      <!-- Contenido principal: mapa + sidebar -->
      <div class="main-layout">

        <!-- Sidebar con lista de camiones -->
        <div class="sidebar">
          <div class="sidebar-title">Camiones activos</div>

          <div class="camion-item"
            *ngFor="let c of trucks"
            [class.selected]="camionSeleccionado?.id === c.id"
            [class.con-gps]="tieneGps(c)"
            (click)="seleccionarCamion(c)">
            <div class="ci-left">
              <div class="ci-icon" [style.background]="getCamionColor(c.status) + '20'"
                [style.border-color]="getCamionColor(c.status) + '40'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  [attr.stroke]="getCamionColor(c.status)" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 5v3h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <div class="ci-nombre">{{ c.nombre }}</div>
                <div class="ci-placas">{{ c.placas }}</div>
              </div>
            </div>
            <div class="ci-right">
              <div class="ci-status" [style.color]="getCamionColor(c.status)">
                {{ statusLabel(c.status) }}
              </div>
              <div class="ci-gps" [class.on]="tieneGps(c)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {{ tieneGps(c) ? 'GPS activo' : 'Sin GPS' }}
              </div>
              <div class="ci-eta" *ngIf="tieneGps(c) && getEta(c)">
                ETA {{ getEta(c) }}min
              </div>
            </div>
          </div>

          <div class="sidebar-empty" *ngIf="trucks.length === 0">
            <div class="spinner-sm"></div>
            Cargando camiones...
          </div>
        </div>

        <!-- Mapa principal -->
        <div class="mapa-container">

          <!-- Info del camión seleccionado -->
          <div class="camion-info-overlay" *ngIf="camionSeleccionado && tieneGps(camionSeleccionado)">
            <div class="cio-header">
              <div class="cio-nombre">{{ camionSeleccionado.nombre }}</div>
              <button class="cio-close" (click)="camionSeleccionado = null">✕</button>
            </div>
            <div class="cio-body">
              <div class="cio-row">
                <span class="cio-label">Estado</span>
                <span class="cio-val" [style.color]="getCamionColor(camionSeleccionado.status)">
                  {{ statusLabel(camionSeleccionado.status) }}
                </span>
              </div>
              <div class="cio-row" *ngIf="getDestino(camionSeleccionado)">
                <span class="cio-label">Destino</span>
                <span class="cio-val">{{ getDestino(camionSeleccionado) }}</span>
              </div>
              <div class="cio-row" *ngIf="getEta(camionSeleccionado)">
                <span class="cio-label">ETA</span>
                <span class="cio-val eta-val">{{ getEta(camionSeleccionado) }} min</span>
              </div>
              <div class="cio-row">
                <span class="cio-label">Coords</span>
                <span class="cio-val mono">
                  {{ getLat(camionSeleccionado) | number:'1.4-4' }},
                  {{ getLng(camionSeleccionado) | number:'1.4-4' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Sin GPS warning -->
          <div class="no-gps-overlay" *ngIf="camionesConUbicacion.length === 0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Ningún conductor tiene GPS activo</p>
            <span>Los conductores deben activar GPS desde su vista de conductor</span>
          </div>

          <google-map
            height="100%"
            width="100%"
            [center]="mapCenter"
            [zoom]="mapZoom"
            [options]="mapOptions">

            <!-- Planta -->
            <map-marker
              [position]="plantaPos"
              [options]="plantaMarker"
              title="Planta Hermosillo">
            </map-marker>

            <!-- Todos los camiones con GPS -->
            <map-marker
              *ngFor="let c of camionesConUbicacion"
              [position]="{ lat: +getLat(c), lng: +getLng(c) }"
              [options]="getCamionMarker(c)"
              [title]="c.nombre + ' — ' + statusLabel(c.status)">
            </map-marker>

          </google-map>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .mapa-page {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
      height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      flex-shrink: 0;
    }

    .ph-left { display: flex; align-items: flex-start; gap: 16px; }

    .btn-back {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #8b8f9a; font-size: 12px; font-weight: 600;
      text-decoration: none; white-space: nowrap;
      transition: all 0.15s;
    }
    .btn-back:hover { color: #f0f1f3; background: rgba(255,255,255,0.09); }

    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }
    .update-time { font-family: 'DM Mono', monospace; font-size: 11px; }

    /* Leyenda */
    .leyenda { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .ley-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #8b8f9a; }
    .ley-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Stats */
    .stats-row { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
    .stat-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 8px;
      border: 1px solid;
    }
    .stat-blue   { background: rgba(59,130,246,0.08);  border-color: rgba(59,130,246,0.2);  }
    .stat-orange { background: rgba(249,115,22,0.08);  border-color: rgba(249,115,22,0.2);  }
    .stat-purple { background: rgba(168,85,247,0.08);  border-color: rgba(168,85,247,0.2);  }
    .stat-yellow { background: rgba(234,179,8,0.08);   border-color: rgba(234,179,8,0.2);   }
    .sc-num { font-size: 20px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .sc-label { font-size: 11px; color: #5a5e6a; }

    /* Main layout */
    .main-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    /* Sidebar */
    .sidebar {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-title {
      padding: 12px 16px;
      font-size: 10px; font-weight: 700; color: #3a3e48;
      text-transform: uppercase; letter-spacing: 0.09em;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }

    .camion-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
      gap: 8px;
    }
    .camion-item:hover { background: rgba(255,255,255,0.03); }
    .camion-item.selected { background: rgba(59,130,246,0.06); border-left: 2px solid #3b82f6; }
    .camion-item.con-gps { border-left: 2px solid #22c55e; }
    .camion-item.con-gps.selected { border-left: 2px solid #3b82f6; }

    .ci-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .ci-icon {
      width: 30px; height: 30px; border-radius: 7px; border: 1px solid;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ci-nombre { font-size: 12px; font-weight: 600; color: #f0f1f3; }
    .ci-placas { font-size: 10px; color: #5a5e6a; font-family: 'DM Mono', monospace; }

    .ci-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
    .ci-status { font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .ci-gps {
      display: flex; align-items: center; gap: 3px;
      font-size: 9px; color: #3a3e48;
    }
    .ci-gps.on { color: #22c55e; }
    .ci-eta { font-size: 10px; color: #f97316; font-family: 'DM Mono', monospace; }

    .sidebar-empty {
      display: flex; align-items: center; gap: 10px;
      padding: 24px 16px; color: #5a5e6a; font-size: 12px;
    }

    /* Mapa */
    .mapa-container {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.07);
      min-height: 0;
    }

    .mapa-container google-map { display: block; height: 100%; }

    /* Info overlay */
    .camion-info-overlay {
      position: absolute;
      top: 12px; left: 12px;
      background: rgba(19,21,26,0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 12px;
      min-width: 200px;
      z-index: 10;
      animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cio-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .cio-nombre { font-size: 13px; font-weight: 700; color: #f0f1f3; }
    .cio-close { background: none; border: none; color: #5a5e6a; font-size: 14px; cursor: pointer; padding: 2px; }
    .cio-close:hover { color: #f0f1f3; }

    .cio-body { display: flex; flex-direction: column; gap: 6px; }
    .cio-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .cio-label { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; }
    .cio-val { font-size: 11px; color: #f0f1f3; font-weight: 600; text-align: right; }
    .cio-val.mono { font-family: 'DM Mono', monospace; font-size: 10px; }
    .cio-val.eta-val { color: #f97316; }

    /* No GPS overlay */
    .no-gps-overlay {
      position: absolute;
      inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px; z-index: 5;
      background: rgba(12,13,15,0.7);
      backdrop-filter: blur(4px);
      text-align: center; padding: 24px;
    }
    .no-gps-overlay p { font-size: 14px; font-weight: 600; color: #f0f1f3; margin: 0; }
    .no-gps-overlay span { font-size: 12px; color: #5a5e6a; }

    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .main-layout { grid-template-columns: 1fr; }
      .sidebar { max-height: 200px; }
      .mapa-page { height: auto; }
    }
  `]
})
export class MapaConductoresComponent implements OnInit, OnDestroy {
  trucks: any[] = [];
  camionSeleccionado: any = null;
  segundosDesdeUpdate = 0;
  mapZoom = 12;

  private subs = new Subscription();
  private refreshSub?: Subscription;
  private clockSub?: Subscription;
  private ultimaUbicacion = Date.now();

  plantaPos = { lat: 29.0729, lng: -110.9559 };
  mapCenter = { lat: 29.0729, lng: -110.9559 };

  leyenda = [
    { label: 'En ruta',     color: '#3b82f6' },
    { label: 'Cargando',    color: '#f97316' },
    { label: 'Descargando', color: '#a855f7' },
    { label: 'Regresando',  color: '#eab308' },
    { label: 'Libre',       color: '#22c55e' },
    { label: 'Planta',      color: '#f97316' },
  ];

  mapOptions: any = {
    mapTypeControl: false, streetViewControl: false,
    fullscreenControl: true, zoomControl: true,
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
    icon: { path: 0, scale: 14, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
  };

  get camionesConUbicacion(): any[] {
    return this.trucks.filter(t => this.tieneGps(t));
  }

  get enRuta()      { return this.trucks.filter(t => t.status?.toString().toUpperCase() === 'EN_RUTA').length; }
  get cargando()    { return this.trucks.filter(t => t.status?.toString().toUpperCase() === 'CARGANDO').length; }
  get descargando() { return this.trucks.filter(t => t.status?.toString().toUpperCase() === 'DESCARGANDO').length; }
  get regresando()  { return this.trucks.filter(t => t.status?.toString().toUpperCase() === 'REGRESANDO').length; }

  constructor(
    private signalr: SignalrService,
    private truckService: TruckService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.cargarCamiones();

    this.subs.add(this.signalr.trucks$.subscribe(trucks => {
      if (trucks.length) {
        this.ngZone.run(() => {
          this.trucks = trucks.map(t => ({...t}));
          this.cdr.detectChanges();
        });
      }
    }));

    this.subs.add(this.signalr.ubicaciones$.subscribe((ub: any) => {
      if (!ub) return;
      this.ngZone.run(() => {
        const idx = this.trucks.findIndex(t => t.id === ub.camionId);
        if (idx >= 0) {
          this.trucks[idx] = {
            ...this.trucks[idx],
            lat: ub.lat, lng: ub.lng,
            travelMinutos: ub.travelMinutosRestantes || this.trucks[idx].travelMinutos
          };
          this.trucks = [...this.trucks];
          this.ultimaUbicacion = Date.now();
          this.segundosDesdeUpdate = 0;
          this.centrarMapa();

          // Actualizar camión seleccionado si es el mismo
          if (this.camionSeleccionado?.id === ub.camionId) {
            this.camionSeleccionado = { ...this.trucks[idx] };
          }
        }
        this.cdr.detectChanges();
      });
    }));

    this.refreshSub = interval(15000).subscribe(() => this.cargarCamiones());

    this.clockSub = interval(1000).subscribe(() => {
      this.ngZone.run(() => {
        this.segundosDesdeUpdate = Math.floor((Date.now() - this.ultimaUbicacion) / 1000);
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.clockSub?.unsubscribe();
  }

  private cargarCamiones() {
    this.truckService.getAll().subscribe({
      next: trucks => {
        this.ngZone.run(() => {
          this.trucks = trucks.map(t => ({...t}));
          this.centrarMapa();
          this.cdr.detectChanges();
        });
      }
    });
  }

  private centrarMapa() {
    if (this.camionesConUbicacion.length === 0) return;
    const lats = this.camionesConUbicacion.map(c => +this.getLat(c));
    const lngs = this.camionesConUbicacion.map(c => +this.getLng(c));
    this.mapCenter = {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length
    };
  }

  seleccionarCamion(c: any) {
    this.camionSeleccionado = this.camionSeleccionado?.id === c.id ? null : c;
    if (this.camionSeleccionado && this.tieneGps(c)) {
      this.mapCenter = { lat: +this.getLat(c), lng: +this.getLng(c) };
      this.mapZoom = 15;
    }
  }

  tieneGps(c: any): boolean {
    return !!(c.lat && c.lng && c.lat !== 0 && c.lng !== 0);
  }

  getLat(c: any): number { return +(c.lat || 0); }
  getLng(c: any): number { return +(c.lng || 0); }
  getEta(c: any): number | null { return c.travelMinutos > 0 ? c.travelMinutos : null; }
  getDestino(c: any): string | null { return c.destinoDireccion || c.destinoNombre || null; }

  getCamionColor(status: any): string {
    const s = status?.toString().toUpperCase();
    const m: Record<string, string> = {
      EN_RUTA: '#3b82f6', CARGANDO: '#f97316', DESCARGANDO: '#a855f7',
      REGRESANDO: '#eab308', LIBRE: '#22c55e', MANTENIMIENTO: '#ef4444'
    };
    return m[s] || '#5a5e6a';
  }

  getCamionMarker(c: any) {
    const color = this.getCamionColor(c.status);
    const esSeleccionado = this.camionSeleccionado?.id === c.id;
    const label = (c.nombre || '').replace('Camión ', 'C').replace('Camion ', 'C');
    return {
      icon: {
        path: 0,
        scale: esSeleccionado ? 14 : 11,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: esSeleccionado ? '#ffffff' : 'rgba(255,255,255,0.7)',
        strokeWeight: esSeleccionado ? 3 : 2
      },
      label: {
        text: label.length > 4 ? label.substring(0, 4) : label,
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: '700'
      },
      zIndex: esSeleccionado ? 20 : 10,
      animation: esSeleccionado ? 1 : null
    };
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
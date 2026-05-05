import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClient } from '@angular/common/http';
import { Truck } from '../../../../core/models/truck';
import { DispatchService } from '../../../../core/services/dispatch.service';
import { TruckService } from '../../../../core/services/truck.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dispatch-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, GoogleMapsModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dispatch-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Nuevo despacho</h1>
          <p class="page-sub">Haz clic en el mapa para seleccionar el destino</p>
        </div>
        <span class="stat-pill green" *ngIf="trucksLibres.length > 0">
          {{ trucksLibres.length }} camiones libres
        </span>
        <span class="stat-pill orange" *ngIf="trucksLibres.length === 0">
          Sin camiones libres — modo cola
        </span>
      </div>

      <!-- Main Layout -->
      <div class="dispatch-layout">

        <!-- MAP -->
        <div class="map-side">
          <div class="map-header">
            <span class="map-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Mapa de despacho
            </span>
            <button class="btn-clear-map" *ngIf="destinoPos" (click)="limpiarMapa()">
              ✕ Limpiar destino
            </button>
          </div>

          <div class="map-container">
            <google-map
              height="100%"
              width="100%"
              [center]="center"
              [zoom]="zoom"
              [options]="mapOptions"
              (mapClick)="onMapClick($event)">

              <map-marker [position]="plantaPos" [options]="plantaMarkerOptions" title="Planta">
              </map-marker>

              <map-marker *ngIf="destinoPos" [position]="destinoPos"
                [options]="destinoMarkerOptions" [title]="destinoNombre">
              </map-marker>

              <map-directions-renderer *ngIf="directionsResult"
                [directions]="directionsResult" [options]="directionsOptions">
              </map-directions-renderer>

            </google-map>

            <div class="map-loading" *ngIf="calculando">
              <div class="map-spinner"></div>
              <span>Calculando ruta...</span>
            </div>
          </div>

          <!-- Route info -->
          <div class="route-info" *ngIf="routeInfo">
            <div class="rs">
              <div class="rs-val">{{ routeInfo.travelMinutos }}<span class="rs-u">min</span></div>
              <div class="rs-lbl">Ida</div>
            </div>
            <div class="rs-sep"></div>
            <div class="rs">
              <div class="rs-val">{{ routeInfo.travelMinutos }}<span class="rs-u">min</span></div>
              <div class="rs-lbl">Regreso</div>
            </div>
            <div class="rs-sep"></div>
            <div class="rs">
              <div class="rs-val">{{ routeInfo.distanciaKm }}<span class="rs-u">km</span></div>
              <div class="rs-lbl">Distancia</div>
            </div>
            <div class="rs-sep"></div>
            <div class="rs">
              <div class="rs-val rs-orange">{{ cicloTotal }}<span class="rs-u">min</span></div>
              <div class="rs-lbl">Ciclo total</div>
            </div>
            <div class="rs-addr">{{ routeInfo.direccion }}</div>
          </div>

          <div class="map-hint" *ngIf="!routeInfo && !calculando">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Haz clic en el mapa para calcular la ruta automáticamente
          </div>
        </div>

        <!-- FORM -->
        <div class="form-side">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <div class="form-block">
              <div class="block-title">Destino</div>
              <div class="field-group">
                <label class="field-lbl">Dirección</label>
                <div class="field-box" [class.has-val]="form.get('direccion')?.value">
                  <svg class="fi" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <input class="fi-input" formControlName="direccion" placeholder="Haz clic en el mapa">
                </div>
              </div>
            </div>

            <div class="form-block">
              <div class="block-title">Tiempos</div>
              <div class="field-row">
                <div class="field-group">
                  <label class="field-lbl">Tiempo de viaje (min)</label>
                  <div class="field-box">
                    <svg class="fi" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <input class="fi-input" type="number" formControlName="travelMinutos" placeholder="Auto">
                  </div>
                </div>
                <div class="field-group">
                  <label class="field-lbl">Descarga (min)</label>
                  <div class="field-box">
                    <input class="fi-input" type="number" formControlName="descargaMinutos">
                  </div>
                </div>
              </div>
            </div>

            <div class="form-block">
              <div class="block-title">Carga</div>
              <div class="field-row">
                <div class="field-group">
                  <label class="field-lbl">m³ solicitados</label>
                  <div class="field-box">
                    <input class="fi-input" type="number" formControlName="m3Solicitados">
                  </div>
                </div>
                <div class="field-group">
                  <label class="field-lbl">Camión</label>
                  <div class="field-box">
                    <svg class="fi" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="3" width="15" height="13" rx="2"/>
                      <path d="M16 8h4l3 5v3h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    <select class="fi-select" formControlName="camionId">
                      <option value="">Automático</option>
                      <option *ngFor="let t of trucksLibres" [value]="t.id">{{ t.nombre }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-block">
              <div class="field-group">
                <label class="field-lbl">Notas (opcional)</label>
                <div class="field-box field-box-area">
                  <textarea class="fi-input fi-area" formControlName="notas"
                    rows="2" placeholder="Instrucciones especiales..."></textarea>
                </div>
              </div>
            </div>

            <!-- Cycle summary -->
            <div class="cycle-bar">
              <div class="cb-phase">
                <div class="cb-dot" style="background:#f97316"></div>
                <span>Carga 10m</span>
              </div>
              <div class="cb-arrow">→</div>
              <div class="cb-phase">
                <div class="cb-dot" style="background:#3b82f6"></div>
                <span>Ida {{ form.get('travelMinutos')?.value || '?' }}m</span>
              </div>
              <div class="cb-arrow">→</div>
              <div class="cb-phase">
                <div class="cb-dot" style="background:#ef4444"></div>
                <span>Desc {{ form.get('descargaMinutos')?.value || 15 }}m</span>
              </div>
              <div class="cb-arrow">→</div>
              <div class="cb-phase">
                <div class="cb-dot" style="background:#a855f7"></div>
                <span>Regreso</span>
              </div>
            </div>

            <!-- Buttons -->
            <div class="btn-group">
              <button type="submit" class="btn-primary"
                [class.is-loading]="loading" [disabled]="form.invalid || loading">
                <svg *ngIf="!loading" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <div class="btn-spin" *ngIf="loading"></div>
                {{ loading ? 'Despachando...' : 'Despachar ahora' }}
              </button>
              <button type="button" class="btn-secondary"
                (click)="agregarCola()" [disabled]="form.invalid || loading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                </svg>
                Agregar a cola
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dispatch-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-shrink: 0;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #f0f1f3;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .page-sub { font-size: 13px; color: #5a5e6a; }

    .stat-pill {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .stat-pill.green { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
    .stat-pill.orange { background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.2); }

    /* Layout */
    .dispatch-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 16px;
      flex: 1;
      min-height: 0;
    }

    /* Map */
    .map-side {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }

    .map-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .map-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #5a5e6a;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .btn-clear-map {
      padding: 4px 10px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 5px;
      color: #ef4444;
      font-size: 11px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-clear-map:hover { background: rgba(239,68,68,0.18); }

    .map-container {
      flex: 1;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.07);
      position: relative;
      min-height: 300px;
    }

    .map-loading {
      position: absolute;
      inset: 0;
      background: rgba(12,13,15,0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 13px;
      color: #8b8f9a;
      backdrop-filter: blur(4px);
      z-index: 10;
    }

    .map-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Route info */
    .route-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #13151a;
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 8px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .rs { text-align: center; flex-shrink: 0; }

    .rs-val {
      font-size: 20px;
      font-weight: 700;
      color: #f0f1f3;
      font-family: 'DM Mono', monospace;
      line-height: 1;
    }

    .rs-val.rs-orange { color: #f97316; }
    .rs-u { font-size: 11px; color: #5a5e6a; font-weight: 400; margin-left: 2px; font-family: 'DM Sans', sans-serif; }
    .rs-lbl { font-size: 10px; color: #5a5e6a; margin-top: 3px; }

    .rs-sep { width: 1px; height: 28px; background: rgba(255,255,255,0.07); flex-shrink: 0; margin: 0 8px; }

    .rs-addr {
      flex: 1;
      font-size: 11px;
      color: #5a5e6a;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .map-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed rgba(255,255,255,0.07);
      border-radius: 8px;
      font-size: 12px;
      color: #3a3e48;
      flex-shrink: 0;
    }

    /* Form */
    .form-side {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .form-side form {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .form-block { margin-bottom: 18px; }

    .block-title {
      font-size: 10px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }

    .field-lbl {
      font-size: 11px;
      font-weight: 600;
      color: #5a5e6a;
    }

    .field-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      transition: border-color 0.15s;
    }

    .field-box:focus-within { border-color: #f97316; }
    .field-box.has-val { border-color: rgba(34,197,94,0.3); }
    .field-box-area { padding: 10px; align-items: flex-start; }

    .fi { color: #3a3e48; flex-shrink: 0; }

    .fi-input {
      flex: 1;
      padding: 9px 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      width: 100%;
    }

    .fi-input::placeholder { color: #3a3e48; }
    .fi-area { padding: 0; resize: none; line-height: 1.5; }

    .fi-select {
      flex: 1;
      padding: 9px 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
    }

    .fi-select option { background: #1a1d24; }

    /* Cycle bar */
    .cycle-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 7px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .cb-phase {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #5a5e6a;
    }

    .cb-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .cb-arrow { font-size: 10px; color: #3a3e48; }

    /* Buttons */
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 4px 16px rgba(249,115,22,0.2);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(249,115,22,0.3);
    }

    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 11px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #8b8f9a;
      font-size: 13px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      border-color: rgba(255,255,255,0.2);
      color: #f0f1f3;
      background: rgba(255,255,255,0.04);
    }

    .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-spin {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .dispatch-page { height: auto; }
      .dispatch-layout { grid-template-columns: 1fr; }
      .map-container { min-height: 400px; }
    }

    @media (max-width: 640px) {
      .dispatch-page { padding: 16px; }
      .field-row { grid-template-columns: 1fr; }
      .rs-sep { display: none; }
    }
  `]
})
export class DispatchFormComponent implements OnInit, OnDestroy {
  plantaPos = { lat: 29.0729, lng: -110.9559 };
  center = { lat: 29.0729, lng: -110.9559 };
  form: FormGroup;
  trucksLibres: Truck[] = [];
  loading = false;
  calculando = false;
  routeInfo: any = null;
  directionsResult: any = null;
  destinoPos: any = null;
  destinoNombre = '';
  zoom = 12;

  mapOptions: any = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1d24' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d24' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#5a5e6a' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22262f' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#13151a' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b8f9a' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2f3a' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f0a030' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0d0f' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#22262f' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f0f1f3' }] },
    ]
  };

  plantaMarkerOptions: any = {};
  destinoMarkerOptions: any = {};
  directionsOptions: any = {
    suppressMarkers: true,
    polylineOptions: { strokeColor: '#f97316', strokeWeight: 4, strokeOpacity: 0.8 }
  };

  private directionsService: any;
  private geocoder: any;

  constructor(
    private fb: FormBuilder,
    private dispatchService: DispatchService,
    private truckService: TruckService,
    private snack: MatSnackBar,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      clienteId: [1],
      direccion: ['', Validators.required],
      lat: [29.0729], lng: [-110.9559],
      travelMinutos: [null, [Validators.required, Validators.min(1)]],
      descargaMinutos: [15, [Validators.required, Validators.min(1)]],
      m3Solicitados: [6, [Validators.required, Validators.min(1)]],
      camionId: [''], notas: ['']
    });
  }

  ngOnInit() {
    this.truckService.getTrucksLibres().subscribe(t => this.trucksLibres = t);
    this.plantaMarkerOptions = {
      icon: { path: 0, scale: 14, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      title: 'Planta', zIndex: 10
    };
    this.destinoMarkerOptions = {
      icon: { path: 3, scale: 8, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      zIndex: 9
    };
    this.waitForGoogleMaps();
  }

  ngOnDestroy() {}

  private waitForGoogleMaps(intentos = 0) {
    if (typeof google !== 'undefined' && google.maps?.DirectionsService) {
      this.directionsService = new google.maps.DirectionsService();
      this.geocoder = new google.maps.Geocoder();
    } else if (intentos < 20) {
      setTimeout(() => this.waitForGoogleMaps(intentos + 1), 500);
    }
  }

  get cicloTotal(): number {
    const travel = this.form.get('travelMinutos')?.value || 0;
    const descarga = this.form.get('descargaMinutos')?.value || 15;
    return 10 + travel + descarga + travel;
  }

  onMapClick(event: any) {
    const lat = event.latLng.lat(), lng = event.latLng.lng();
    this.destinoPos = { lat, lng };
    this.calcularRuta(lat, lng);
  }

  private calcularRuta(lat: number, lng: number) {
    if (!this.directionsService && typeof google !== 'undefined') {
      this.directionsService = new google.maps.DirectionsService();
      this.geocoder = new google.maps.Geocoder();
    }
    if (!this.directionsService) return;

    this.calculando = true;
    this.routeInfo = null;
    this.directionsResult = null;

    this.geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      const direccion = (status === 'OK' && results?.[0])
        ? results[0].formatted_address
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.destinoNombre = direccion;
      this.form.patchValue({ direccion, lat, lng });

      this.directionsService.route({
        origin: this.plantaPos, destination: { lat, lng }, travelMode: 'DRIVING'
      }, (result: any, status: any) => {
        this.calculando = false;
        if (status === 'OK' && result) {
          this.directionsResult = result;
          const leg = result.routes[0].legs[0];
          const minutos = Math.round((leg.duration?.value || 0) / 60);
          const km = Math.round((leg.distance?.value || 0) / 100) / 10;
          this.routeInfo = { travelMinutos: minutos, distanciaKm: km, direccion };
          this.form.patchValue({ travelMinutos: minutos });
        }
      });
    });
  }

  limpiarMapa() {
    this.destinoPos = null; this.directionsResult = null; this.routeInfo = null;
    this.form.patchValue({ direccion: '', lat: 29.0729, lng: -110.9559, travelMinutos: null });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    const dto = this.getDto();
    this.dispatchService.despachar(dto).subscribe({
      next: () => { this.snack.open('✓ Camión despachado', 'OK', { duration: 3000 }); this.resetForm(); },
      error: () => {
        this.dispatchService.agregarCola(dto).subscribe({
          next: () => { this.snack.open('Sin camiones libres — en cola', 'OK', { duration: 3000 }); this.resetForm(); },
          error: () => { this.snack.open('Error al despachar', 'OK', { duration: 3000 }); this.loading = false; }
        });
      }
    });
  }

  agregarCola() {
    if (this.form.invalid) return;
    this.loading = true;
    this.dispatchService.agregarCola(this.getDto()).subscribe({
      next: () => { this.snack.open('✓ Pedido en cola', 'OK', { duration: 3000 }); this.resetForm(); },
      error: () => { this.snack.open('Error', 'OK', { duration: 3000 }); this.loading = false; }
    });
  }

  private getDto() {
    const v = this.form.value;
    return { ...v, camionId: v.camionId ? parseInt(v.camionId) : null, lat: v.lat || 29.0729, lng: v.lng || -110.9559, clienteId: v.clienteId || 1 };
  }

  private resetForm() {
    this.form.reset({ clienteId: 1, descargaMinutos: 15, m3Solicitados: 6, lat: 29.0729, lng: -110.9559 });
    this.limpiarMapa(); this.loading = false;
    this.truckService.getTrucksLibres().subscribe(t => this.trucksLibres = t);
  }
}
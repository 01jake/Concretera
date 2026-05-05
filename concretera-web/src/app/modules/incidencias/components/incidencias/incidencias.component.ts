import { Component, OnInit,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

interface Incidencia {
  id?: number;
  tipo: string;
  severidad: string;
  estado: string;
  descripcion: string;
  fotoUrl?: string;
  resolucion?: string;
  fechaReporte: string;
  fechaResolucion?: string;
  lat?: number;
  lng?: number;
  camion?: { id: number; nombre: string; placas: string };
  reportadoPor?: { id: number; nombre: string };
}

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="inc-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Bitácora de incidencias</h1>
          <p class="page-sub">{{ incidenciasFiltradas.length }} registros · {{ abiertas }} abiertas</p>
        </div>
        <div class="header-actions">
          <!-- Filtros rápidos -->
          <select class="filter-sel" [(ngModel)]="filtroEstado" (ngModelChange)="filtrar()">
            <option value="">Todos los estados</option>
            <option value="ABIERTA">Abiertas</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="RESUELTA">Resueltas</option>
          </select>
          <select class="filter-sel" [(ngModel)]="filtroSeveridad" (ngModelChange)="filtrar()">
            <option value="">Toda severidad</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
          <button class="btn-new" (click)="abrirModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Reportar incidencia
          </button>
        </div>
      </div>

      <!-- KPI strip -->
      <div class="kpi-strip">
        <div class="kpi-item">
          <div class="kpi-val red">{{ criticas }}</div>
          <div class="kpi-lbl">Críticas</div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-item">
          <div class="kpi-val orange">{{ abiertas }}</div>
          <div class="kpi-lbl">Abiertas</div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-item">
          <div class="kpi-val yellow">{{ enProceso }}</div>
          <div class="kpi-lbl">En proceso</div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-item">
          <div class="kpi-val green">{{ resueltas }}</div>
          <div class="kpi-lbl">Resueltas</div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-item">
          <div class="kpi-val">{{ incidencias.length }}</div>
          <div class="kpi-lbl">Total</div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando bitácora...</span>
      </div>

      <!-- Lista -->
      <div class="inc-list" *ngIf="!cargando">

        <!-- Alerta crítica -->
        <div class="alerta-critica" *ngIf="criticas > 0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Hay {{ criticas }} incidencia{{ criticas > 1 ? 's' : '' }} crítica{{ criticas > 1 ? 's' : '' }} activa{{ criticas > 1 ? 's' : '' }} — atención inmediata requerida
        </div>

        <div class="inc-card" *ngFor="let i of incidenciasFiltradas"
          [class.critica]="i.severidad === 'CRITICA'"
          [class.resuelta]="i.estado === 'RESUELTA'">

          <!-- Card header -->
          <div class="inc-head">
            <div class="inc-tipo-wrap">
             <div class="tipo-icon" [class]="'tipo-' + (i.tipo + '').toLowerCase()">
                {{ tipoEmoji(i.tipo) }}
              </div>
              <div>
                <div class="inc-tipo">{{ tipoLabel(i.tipo) }}</div>
                <div class="inc-camion" *ngIf="i.camion">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13" rx="2"/>
                    <path d="M16 8h4l3 5v3h-7V8z"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  {{ i.camion.nombre }}
                </div>
              </div>
            </div>

            <div class="inc-badges">
              <span [class]="'sev-badge sev-' + (i.severidad + '').toLowerCase()">
                {{ severidadLabel(i.severidad) }}
              </span>
            <span [class]="'est-badge est-' + (i.estado + '').toLowerCase()">
                {{ estadoLabel(i.estado) }}
              </span>
            </div>

            <div class="inc-actions">
              <button class="icon-btn" *ngIf="i.estado !== 'RESUELTA'"
                (click)="abrirResolver(i)" title="Resolver">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button class="icon-btn" *ngIf="i.estado === 'ABIERTA'"
                (click)="cambiarEstado(i, 'EN_PROCESO')" title="Marcar en proceso">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <button class="icon-btn icon-btn-danger" (click)="confirmarEliminar(i)" title="Eliminar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Descripción -->
          <div class="inc-desc">{{ i.descripcion }}</div>

          <!-- Foto -->
          <div class="inc-foto" *ngIf="i.fotoUrl">
            <img [src]="i.fotoUrl" alt="Foto incidencia" class="foto-img"
              (error)="$any($event.target).style.display='none'">
          </div>

          <!-- Resolución -->
          <div class="inc-resolucion" *ngIf="i.resolucion">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span><strong>Resolución:</strong> {{ i.resolucion }}</span>
          </div>

          <!-- Footer -->
          <div class="inc-footer">
            <span class="inc-reporter" *ngIf="i.reportadoPor">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {{ i.reportadoPor.nombre }}
            </span>
            <span class="inc-fecha">
              {{ i.fechaReporte | date:'dd/MM/yyyy HH:mm' }}
            </span>
            <span class="inc-resuelta-fecha" *ngIf="i.fechaResolucion">
              · Resuelta {{ i.fechaResolucion | date:'dd/MM HH:mm' }}
            </span>
          </div>

        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="incidenciasFiltradas.length === 0">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p>Sin incidencias para los filtros seleccionados</p>
        </div>

      </div>
    </div>

    <!-- ══════ MODAL CREAR ══════ -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h3 class="modal-title">Reportar incidencia</h3>
          <button class="modal-close" (click)="cerrarModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="modal-form">

          <div class="modal-section">
            <div class="ms-title">Detalles de la incidencia</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Camión *</label>
                <select class="fi" formControlName="camionId">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let c of camiones" [value]="c.id">{{ c.nombre }} — {{ c.placas }}</option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">Tipo *</label>
                <select class="fi" formControlName="tipo">
                  <option value="LLANTA_PONCHADA">🔧 Llanta ponchada</option>
                  <option value="ACCIDENTE">🚨 Accidente</option>
                  <option value="DEMORA_EN_OBRA">⏱ Demora en obra</option>
                  <option value="FALLA_MECANICA">⚙️ Falla mecánica</option>
                  <option value="PROBLEMA_CLIENTE">👤 Problema con cliente</option>
                  <option value="OTRO">📋 Otro</option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">Severidad *</label>
                <select class="fi" formControlName="severidad">
                  <option value="BAJA">🟢 Baja</option>
                  <option value="MEDIA">🟡 Media</option>
                  <option value="ALTA">🟠 Alta</option>
                  <option value="CRITICA">🔴 Crítica</option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">Reportado por</label>
                <select class="fi" formControlName="reportadoPorId">
                  <option [ngValue]="null">Admin / Sistema</option>
                  <option *ngFor="let c of conductores" [value]="c.id">{{ c.nombre }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="fg full">
              <label class="fl">Descripción *</label>
              <textarea class="fi fi-area" formControlName="descripcion" rows="3"
                placeholder="Describe detalladamente lo que ocurrió..."></textarea>
            </div>
          </div>

          <div class="modal-section">
            <div class="ms-title">Evidencia (opcional)</div>
            <div class="fg full">
              <label class="fl">URL de foto</label>
              <input class="fi" formControlName="fotoUrl" placeholder="https://...">
            </div>
          </div>

          <!-- Aviso crítica -->
          <div class="aviso-critica" *ngIf="form.get('severidad')?.value === 'CRITICA' || form.get('tipo')?.value === 'ACCIDENTE' || form.get('tipo')?.value === 'FALLA_MECANICA'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            El camión será puesto en <strong>Mantenimiento</strong> automáticamente
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="form.invalid || guardando">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : 'Reportar incidencia' }}
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ══════ MODAL RESOLVER ══════ -->
    <div class="modal-overlay" *ngIf="incidenciaAResolver" (click)="incidenciaAResolver = null">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h3 class="modal-title">Resolver incidencia</h3>
          <button class="modal-close" (click)="incidenciaAResolver = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-form">
          <div class="modal-section">
            <div class="inc-resume">
              <span [class]="'sev-badge sev-' + (incidenciaAResolver.severidad + '').toLowerCase()">
                {{ severidadLabel(incidenciaAResolver.severidad) }}
              </span>
              <span class="inc-tipo-text">{{ tipoLabel(incidenciaAResolver.tipo) }}</span>
              <span class="inc-camion-text" *ngIf="incidenciaAResolver.camion">
                — {{ incidenciaAResolver.camion.nombre }}
              </span>
            </div>
            <p class="inc-desc-small">{{ incidenciaAResolver.descripcion }}</p>
          </div>

          <div class="modal-section">
            <div class="fg full">
              <label class="fl">Descripción de la resolución *</label>
              <textarea class="fi fi-area" [(ngModel)]="resolucionTexto" rows="3"
                placeholder="Describe cómo se resolvió el problema..."></textarea>
            </div>
            <div class="fg full mt-8">
              <label class="check-label">
                <input type="checkbox" [(ngModel)]="liberarCamion" class="check-input">
                <span>Liberar camión de Mantenimiento al resolver</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="incidenciaAResolver = null">Cancelar</button>
            <button class="btn-save" [disabled]="!resolucionTexto || guardando" (click)="resolver()">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : 'Marcar como resuelta' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Confirm eliminar -->
    <div class="modal-overlay" *ngIf="incidenciaAEliminar" (click)="incidenciaAEliminar = null">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="confirm-title">¿Eliminar incidencia?</h3>
        <p class="confirm-text">Esta acción no se puede deshacer.</p>
        <div class="confirm-btns">
          <button class="btn-cancel" (click)="incidenciaAEliminar = null">Cancelar</button>
          <button class="btn-danger" (click)="eliminar()">Eliminar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inc-page {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }

    .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .filter-sel {
      padding: 8px 12px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      cursor: pointer;
    }

    .filter-sel:focus { border-color: #f97316; }
    .filter-sel option { background: #13151a; }

    .btn-new {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(239,68,68,0.2);
    }

    .btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.3); }

    /* KPI strip */
    .kpi-strip {
      display: flex;
      align-items: center;
      padding: 14px 20px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .kpi-item { flex: 1; text-align: center; }
    .kpi-val { font-size: 22px; font-weight: 700; color: #f0f1f3; font-family: 'DM Mono', monospace; }
    .kpi-val.red { color: #ef4444; }
    .kpi-val.orange { color: #f97316; }
    .kpi-val.yellow { color: #eab308; }
    .kpi-val.green { color: #22c55e; }
    .kpi-lbl { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }
    .kpi-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.07); flex-shrink: 0; }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Alerta crítica */
    .alerta-critica {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px;
      color: #ef4444;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: rgba(239,68,68,0.3); }
      50% { border-color: rgba(239,68,68,0.7); }
    }

    /* List */
    .inc-list { display: flex; flex-direction: column; gap: 10px; }

    /* Card */
    .inc-card {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.2s, transform 0.2s;
    }

    .inc-card:hover { border-color: rgba(255,255,255,0.12); transform: translateX(2px); }
    .inc-card.critica { border-left: 3px solid #ef4444; }
    .inc-card.resuelta { opacity: 0.6; }

    /* Card head */
    .inc-head {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .inc-tipo-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .tipo-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      background: rgba(255,255,255,0.05);
    }

    .inc-tipo { font-size: 13px; font-weight: 600; color: #f0f1f3; }

    .inc-camion {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #5a5e6a;
      margin-top: 2px;
    }

    .inc-badges { display: flex; gap: 6px; flex-shrink: 0; }

    /* Severidad badges */
    .sev-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sev-badge.sev-critica  { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .sev-badge.sev-alta     { background: rgba(249,115,22,0.15); color: #f97316; }
    .sev-badge.sev-media    { background: rgba(234,179,8,0.15);  color: #eab308; }
    .sev-badge.sev-baja     { background: rgba(34,197,94,0.15);  color: #22c55e; }

    /* Estado badges */
    .est-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .est-badge.est-abierta    { background: rgba(239,68,68,0.1);  color: #ef4444; }
    .est-badge.est-en_proceso { background: rgba(234,179,8,0.1);  color: #eab308; }
    .est-badge.est-resuelta   { background: rgba(34,197,94,0.1);  color: #22c55e; }

    /* Actions */
    .inc-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .icon-btn {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      color: #5a5e6a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .icon-btn:hover { background: rgba(255,255,255,0.09); color: #f0f1f3; }
    .icon-btn-danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444; }

    /* Desc */
    .inc-desc { font-size: 13px; color: #8b8f9a; line-height: 1.5; }

    /* Foto */
    .inc-foto { border-radius: 8px; overflow: hidden; max-height: 200px; }
    .foto-img { width: 100%; object-fit: cover; border-radius: 8px; }

    /* Resolución */
    .inc-resolucion {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(34,197,94,0.06);
      border: 1px solid rgba(34,197,94,0.15);
      border-radius: 6px;
      font-size: 12px;
      color: #8b8f9a;
    }

    .inc-resolucion svg { color: #22c55e; flex-shrink: 0; margin-top: 1px; }

    /* Footer */
    .inc-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #3a3e48;
    }

    .inc-reporter { display: flex; align-items: center; gap: 4px; color: #5a5e6a; }
    .inc-fecha { margin-left: auto; font-family: 'DM Mono', monospace; }
    .inc-resuelta-fecha { color: #22c55e; }

    /* Empty */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px;
      color: #3a3e48;
    }

    .empty-icon {
      width: 56px; height: 56px;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state p { font-size: 13px; color: #5a5e6a; }

    /* ══ MODAL ══ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 24px;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .modal-title { font-size: 16px; font-weight: 700; color: #f0f1f3; }

    .modal-close {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #5a5e6a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .modal-close:hover { background: rgba(255,255,255,0.1); color: #f0f1f3; }

    .modal-form { display: flex; flex-direction: column; }

    .modal-section {
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .ms-title {
      font-size: 10px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 12px;
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .mt-8 { margin-top: 8px; }
    .fl { font-size: 11px; font-weight: 600; color: #5a5e6a; }

    .fi {
      padding: 9px 12px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      color: #f0f1f3;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.15s;
      width: 100%;
    }

    .fi:focus { border-color: #f97316; }
    .fi::placeholder { color: #3a3e48; }
    .fi-area { resize: vertical; min-height: 80px; }
    .fi option { background: #1a1d24; }

    .aviso-critica {
      margin: 0 24px 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 7px;
      font-size: 12px;
      color: #ef4444;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
    }

    .btn-cancel {
      padding: 9px 18px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 7px;
      color: #8b8f9a;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: #f0f1f3; }

    .btn-save {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border: none;
      border-radius: 7px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-save:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-spin {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Resolver modal */
    .inc-resume {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .inc-tipo-text { font-size: 14px; font-weight: 600; color: #f0f1f3; }
    .inc-camion-text { font-size: 13px; color: #5a5e6a; }
    .inc-desc-small { font-size: 13px; color: #8b8f9a; line-height: 1.5; }

    .check-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #8b8f9a;
      cursor: pointer;
    }

    .check-input { width: 14px; height: 14px; accent-color: #22c55e; cursor: pointer; }

    /* Confirm */
    .confirm-modal {
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 32px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      animation: slideUp 0.2s ease;
    }

    .confirm-icon {
      width: 52px; height: 52px;
      border-radius: 12px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .confirm-title { font-size: 17px; font-weight: 700; color: #f0f1f3; margin-bottom: 8px; }
    .confirm-text { font-size: 13px; color: #5a5e6a; margin-bottom: 24px; }
    .confirm-btns { display: flex; gap: 10px; justify-content: center; }

    .btn-danger {
      padding: 9px 20px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 7px;
      color: #ef4444;
      font-size: 13px;
      font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-danger:hover { background: rgba(239,68,68,0.2); }

    @media (max-width: 768px) {
      .inc-page { padding: 16px; }
      .header-actions { width: 100%; flex-wrap: wrap; }
      .form-grid { grid-template-columns: 1fr; }
      .kpi-strip { overflow-x: auto; gap: 0; }
      .kpi-sep { display: none; }
    }
  `]
})
export class IncidenciasComponent implements OnInit {
  incidencias: Incidencia[] = [];
  incidenciasFiltradas: Incidencia[] = [];
  camiones: any[] = [];
  conductores: any[] = [];
  cargando = false;
  filtroEstado = '';
  filtroSeveridad = '';
  modalAbierto = false;
  guardando = false;
  incidenciaAResolver: Incidencia | null = null;
  incidenciaAEliminar: Incidencia | null = null;
  resolucionTexto = '';
  liberarCamion = false;
  form: FormGroup;

  get criticas()  { return this.incidencias.filter(i => i.severidad?.toString() === 'CRITICA' || i.severidad === 3 as any).length; }
  get abiertas()  { return this.incidencias.filter(i => i.estado?.toString() === 'ABIERTA' || i.estado === 0 as any).length; }
  get enProceso() { return this.incidencias.filter(i => i.estado?.toString() === 'EN_PROCESO' || i.estado === 1 as any).length; }
  get resueltas() { return this.incidencias.filter(i => i.estado?.toString() === 'RESUELTA' || i.estado === 2 as any).length; }

  constructor( private http: HttpClient,
  private fb: FormBuilder,
  private snack: MatSnackBar,
  private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      camionId:       ['', Validators.required],
      tipo:           ['LLANTA_PONCHADA', Validators.required],
      severidad:      ['MEDIA', Validators.required],
      descripcion:    ['', Validators.required],
      reportadoPorId: [null],
      fotoUrl:        [''],
      lat:            [null],
      lng:            [null]
    });
  }

  ngOnInit() {
    this.cargar();
    this.cargarCamiones();
    this.cargarConductores();
  }

  cargar() {
    this.cargando = true;
    const params: any = {};
    const q = new URLSearchParams(params).toString();
    this.http.get<Incidencia[]>(`${environment.apiUrl}/incidencias${q ? '?' + q : ''}`).subscribe({
      next: i => { this.incidencias = i; this.filtrar(); this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  filtrar() {
    let base = this.incidencias;
    if (this.filtroEstado)    base = base.filter(i => i.estado?.toString() === this.filtroEstado);
    if (this.filtroSeveridad) base = base.filter(i => i.severidad?.toString() === this.filtroSeveridad);
    this.incidenciasFiltradas = base;
  }

  cargarCamiones() {
    this.http.get<any[]>(`${environment.apiUrl}/camiones`).subscribe({ next: c => this.camiones = c, error: () => {} });
  }

  cargarConductores() {
    this.http.get<any[]>(`${environment.apiUrl}/conductores`).subscribe({ next: c => this.conductores = c, error: () => {} });
  }

abrirModal() {
  this.form.reset({ tipo: 'LLANTA_PONCHADA', severidad: 'MEDIA', reportadoPorId: null });
  this.modalAbierto = true;
  this.cdr.detectChanges();
}
  cerrarModal() { this.modalAbierto = false; }

  guardar() {
  if (this.form.invalid) return;
  this.guardando = true;
  const v = this.form.value;
  const dto = {
    ...v,
    camionId: parseInt(v.camionId),
    reportadoPorId: v.reportadoPorId ? parseInt(v.reportadoPorId) : null
  };
  this.http.post(`${environment.apiUrl}/incidencias`, dto).subscribe({
    next: () => {
      this.modalAbierto = false;
      this.guardando = false;
      this.snack.open('✓ Incidencia reportada', 'OK', { duration: 3000 });
      this.cdr.detectChanges();
      this.cargar();
    },
    error: () => {
      this.snack.open('Error al reportar', 'OK', { duration: 3000 });
      this.guardando = false;
    }
  });
}

  abrirResolver(i: Incidencia) {
    this.incidenciaAResolver = i;
    this.resolucionTexto = '';
    this.liberarCamion = i.severidad?.toString() === 'CRITICA';
  }

  resolver() {
  if (!this.incidenciaAResolver?.id || !this.resolucionTexto) return;
  this.guardando = true;
  this.http.put(`${environment.apiUrl}/incidencias/${this.incidenciaAResolver.id}/resolver`, {
    resolucion: this.resolucionTexto,
    liberarCamion: this.liberarCamion
  }).subscribe({
    next: () => {
      this.incidenciaAResolver = null;
      this.guardando = false;
      this.snack.open('✓ Incidencia resuelta', 'OK', { duration: 3000 });
      this.cdr.detectChanges();
      this.cargar();
    },
    error: () => {
      this.snack.open('Error al resolver', 'OK', { duration: 3000 });
      this.guardando = false;
    }
  });
}

cambiarEstado(i: Incidencia, estado: string) {
  this.http.put(`${environment.apiUrl}/incidencias/${i.id}/estado`, { estado }).subscribe({
    next: () => {
      this.snack.open('Estado actualizado', 'OK', { duration: 2000 });
      setTimeout(() => this.cargar(), 0);
    },
    error: () => {}
  });
}

  confirmarEliminar(i: Incidencia) { this.incidenciaAEliminar = i; }

  eliminar() {
    if (!this.incidenciaAEliminar?.id) return;
    this.http.delete(`${environment.apiUrl}/incidencias/${this.incidenciaAEliminar.id}`).subscribe({
      next: () => {
        this.snack.open('Incidencia eliminada', 'OK', { duration: 3000 });
        this.incidenciaAEliminar = null;
        this.cargar();
      },
      error: () => {}
    });
  }

  tipoLabel(tipo: any): string {
    const l: Record<string, string> = {
      '0':'Llanta ponchada','1':'Accidente','2':'Demora en obra',
      '3':'Falla mecánica','4':'Problema con cliente','5':'Otro',
      'LLANTA_PONCHADA':'Llanta ponchada','ACCIDENTE':'Accidente',
      'DEMORA_EN_OBRA':'Demora en obra','FALLA_MECANICA':'Falla mecánica',
      'PROBLEMA_CLIENTE':'Problema con cliente','OTRO':'Otro'
    };
    return l[tipo?.toString()] || tipo || '—';
  }

  tipoEmoji(tipo: any): string {
    const e: Record<string, string> = {
      '0':'🔧','1':'🚨','2':'⏱','3':'⚙️','4':'👤','5':'📋',
      'LLANTA_PONCHADA':'🔧','ACCIDENTE':'🚨','DEMORA_EN_OBRA':'⏱',
      'FALLA_MECANICA':'⚙️','PROBLEMA_CLIENTE':'👤','OTRO':'📋'
    };
    return e[tipo?.toString()] || '❗';
  }

  severidadLabel(s: any): string {
    const l: Record<string, string> = {
      '0':'🟢 Baja','1':'🟡 Media','2':'🟠 Alta','3':'🔴 Crítica',
      'BAJA':'🟢 Baja','MEDIA':'🟡 Media','ALTA':'🟠 Alta','CRITICA':'🔴 Crítica'
    };
    return l[s?.toString()] || s || '—';
  }

  estadoLabel(e: any): string {
    const l: Record<string, string> = {
      '0':'Abierta','1':'En proceso','2':'Resuelta',
      'ABIERTA':'Abierta','EN_PROCESO':'En proceso','RESUELTA':'Resuelta'
    };
    return l[e?.toString()] || e || '—';
  }
}
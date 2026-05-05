import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

interface Mantenimiento {
  id: number;
  tipo: string;
  estado: string;
  descripcion: string;
  fechaProgramada?: string;
  fechaRealizada?: string;
  intervaloDias?: number;
  kmActual?: number;
  kmProximo?: number;
  kmIntervalo?: number;
  costo?: number;
  notas?: string;
  tallerNombre?: string;
  diasRestantes?: number;
  camion?: { id: number; nombre: string; placas: string };
}

interface DiaCalendario {
  fecha: Date;
  esHoy: boolean;
  esMesActual: boolean;
  mantenimientos: Mantenimiento[];
}

@Component({
  selector: 'app-mantenimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="mant-page page-enter">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mantenimientos</h1>
          <p class="page-sub">{{ mantenimientos.length }} registros · {{ proximos }} próximos 7 días</p>
        </div>
        <div class="header-actions">
          <div class="view-tabs">
            <button class="vtab" [class.active]="vista === 'lista'" (click)="vista = 'lista'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              </svg>
              Lista
            </button>
            <button class="vtab" [class.active]="vista === 'calendario'" (click)="vista = 'calendario'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendario
            </button>
          </div>
          <button class="btn-new" (click)="abrirModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Programar mantenimiento
          </button>
        </div>
      </div>

      <!-- Alertas strip -->
      <div class="alertas-strip" *ngIf="alertas.length > 0">
        <div class="alerta-item" *ngFor="let a of alertas" [class.urgente]="a.diasRestantes <= 0" [class.pronto]="a.diasRestantes > 0 && a.diasRestantes <= 3">
          <div class="al-icon">{{ tipoEmoji(a.tipo) }}</div>
          <div class="al-info">
            <div class="al-nombre">{{ a.camion?.nombre }}</div>
            <div class="al-desc">{{ tipoLabel(a.tipo) }}</div>
          </div>
          <div class="al-dias" [class.red]="a.diasRestantes <= 0" [class.orange]="a.diasRestantes > 0 && a.diasRestantes <= 3" [class.yellow]="a.diasRestantes > 3">
            {{ a.diasRestantes <= 0 ? 'VENCIDO' : 'En ' + a.diasRestantes + 'd' }}
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-bar">
        <select class="filter-sel" [(ngModel)]="filtroCamion" (ngModelChange)="filtrar()">
          <option value="">Todos los camiones</option>
          <option *ngFor="let c of camiones" [value]="c.id">{{ c.nombre }}</option>
        </select>
        <select class="filter-sel" [(ngModel)]="filtroEstado" (ngModelChange)="filtrar()">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADO">Programados</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="COMPLETADO">Completados</option>
          <option value="VENCIDO">Vencidos</option>
        </select>
        <select class="filter-sel" [(ngModel)]="filtroTipo" (ngModelChange)="filtrar()">
          <option value="">Todos los tipos</option>
          <option value="CAMBIO_ACEITE">Cambio de aceite</option>
          <option value="REVISION_FRENOS">Revisión de frenos</option>
          <option value="CAMBIO_LLANTAS">Cambio de llantas</option>
          <option value="REVISION_GENERAL">Revisión general</option>
          <option value="SERVICIO_MAYOR">Servicio mayor</option>
          <option value="OTRO">Otro</option>
        </select>
        <button class="btn-clear" (click)="limpiarFiltros()">Limpiar</button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando mantenimientos...</span>
      </div>

      <!-- ══ VISTA LISTA ══ -->
      <div class="lista-view" *ngIf="!cargando && vista === 'lista'">

        <div class="mant-card" *ngFor="let m of mantenimientosFiltrados"
          [class.urgente]="m.diasRestantes !== undefined && m.diasRestantes <= 0 && m.estado !== 'COMPLETADO'"
          [class.pronto]="m.diasRestantes !== undefined && m.diasRestantes > 0 && m.diasRestantes <= 3 && m.estado !== 'COMPLETADO'"
          [class.completado]="m.estado === 'COMPLETADO'">

          <div class="mc-head">
            <div class="mc-tipo">
              <div class="tipo-icon-big">{{ tipoEmoji(m.tipo) }}</div>
              <div>
                <div class="mc-nombre">{{ tipoLabel(m.tipo) }}</div>
                <div class="mc-camion" *ngIf="m.camion">
                  🚛 {{ m.camion.nombre }} · {{ m.camion.placas }}
                </div>
              </div>
            </div>
            <div class="mc-badges">
              <span [class]="'estado-badge eb-' + estadoClass(m.estado)">
                {{ estadoLabel(m.estado) }}
              </span>
              <div class="dias-badge" *ngIf="m.fechaProgramada && m.estado !== 'COMPLETADO'"
                [class.db-red]="(m.diasRestantes ?? 0) <= 0"
                [class.db-orange]="(m.diasRestantes ?? 99) > 0 && (m.diasRestantes ?? 99) <= 3"
                [class.db-yellow]="(m.diasRestantes ?? 99) > 3 && (m.diasRestantes ?? 99) <= 7"
                [class.db-green]="(m.diasRestantes ?? 99) > 7">
                {{ (m.diasRestantes ?? 0) <= 0 ? 'Vencido' : 'En ' + m.diasRestantes + ' días' }}
              </div>
            </div>
            <div class="mc-actions">
              <button class="icon-btn btn-completar"
                *ngIf="m.estado !== 'COMPLETADO'"
                (click)="abrirCompletar(m)" title="Marcar completado">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button class="icon-btn" (click)="abrirModal(m)" title="Editar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn icon-btn-danger" (click)="confirmarEliminar(m)" title="Eliminar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="mc-desc">{{ m.descripcion }}</div>

          <div class="mc-details">
            <div class="mc-det-item" *ngIf="m.fechaProgramada">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Programado: {{ m.fechaProgramada | date:'dd/MM/yyyy' }}
            </div>
            <div class="mc-det-item" *ngIf="m.fechaRealizada">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Realizado: {{ m.fechaRealizada | date:'dd/MM/yyyy' }}
            </div>
            <div class="mc-det-item" *ngIf="m.intervaloDias">
              🔄 Cada {{ m.intervaloDias }} días
            </div>
            <div class="mc-det-item" *ngIf="m.kmProximo">
              📍 Próximo a {{ m.kmProximo | number:'1.0-0' }} km
            </div>
            <div class="mc-det-item" *ngIf="m.tallerNombre">
              🔧 {{ m.tallerNombre }}
            </div>
            <div class="mc-det-item" *ngIf="m.costo">
              💰 {{ m.costo | number:'1.0-0' }}
            </div>
          </div>

          <div class="mc-notas" *ngIf="m.notas">
            📋 {{ m.notas }}
          </div>

        </div>

        <div class="empty-state" *ngIf="mantenimientosFiltrados.length === 0">
          <div class="empty-icon">🔧</div>
          <p>No hay mantenimientos para los filtros seleccionados</p>
          <button class="btn-new" (click)="abrirModal()">Programar primero</button>
        </div>

      </div>

      <!-- ══ VISTA CALENDARIO ══ -->
      <div class="calendario-view" *ngIf="!cargando && vista === 'calendario'">

        <div class="cal-header">
          <button class="cal-nav" (click)="mesAnterior()">‹</button>
          <div class="cal-titulo">
            {{ mesActual | date:'MMMM yyyy':'':'es' | titlecase }}
          </div>
          <button class="cal-nav" (click)="mesSiguiente()">›</button>
        </div>

        <div class="cal-grid-header">
          <div class="cal-dow" *ngFor="let d of ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']">{{ d }}</div>
        </div>

        <div class="cal-grid">
          <div class="cal-dia" *ngFor="let dia of diasCalendario"
            [class.otro-mes]="!dia.esMesActual"
            [class.hoy]="dia.esHoy"
            [class.tiene-eventos]="dia.mantenimientos.length > 0">
            <div class="cal-num">{{ dia.fecha.getDate() }}</div>
            <div class="cal-eventos">
              <div class="cal-evento" *ngFor="let m of dia.mantenimientos.slice(0, 2)"
                [class]="'ce-' + estadoClass(m.estado)"
                [title]="m.camion?.nombre + ' — ' + tipoLabel(m.tipo)">
                {{ tipoEmoji(m.tipo) }} {{ m.camion?.nombre }}
              </div>
              <div class="cal-mas" *ngIf="dia.mantenimientos.length > 2">
                +{{ dia.mantenimientos.length - 2 }} más
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ══ MODAL CREAR/EDITAR ══ -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ editando ? 'Editar mantenimiento' : 'Programar mantenimiento' }}</h3>
          <button class="modal-close" (click)="cerrarModal()">✕</button>
        </div>

        <div class="modal-form">
          <div class="modal-section">
            <div class="ms-title">Información principal</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Camión *</label>
                <select class="fi" [(ngModel)]="form.camionId">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let c of camiones" [value]="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="fg">
                <label class="fl">Tipo *</label>
                <select class="fi" [(ngModel)]="form.tipo">
                  <option value="CAMBIO_ACEITE">🛢 Cambio de aceite</option>
                  <option value="REVISION_FRENOS">🔴 Revisión de frenos</option>
                  <option value="CAMBIO_LLANTAS">⚫ Cambio de llantas</option>
                  <option value="REVISION_GENERAL">🔧 Revisión general</option>
                  <option value="SERVICIO_MAYOR">⚙️ Servicio mayor</option>
                  <option value="OTRO">📋 Otro</option>
                </select>
              </div>
            </div>
            <div class="fg full mt-8">
              <label class="fl">Descripción *</label>
              <input class="fi" [(ngModel)]="form.descripcion" placeholder="Detalle del mantenimiento...">
            </div>
          </div>

          <div class="modal-section">
            <div class="ms-title">Programación por fecha</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Fecha programada</label>
                <input class="fi" type="date" [(ngModel)]="form.fechaProgramada">
              </div>
              <div class="fg">
                <label class="fl">Repetir cada (días)</label>
                <input class="fi" type="number" [(ngModel)]="form.intervaloDias" placeholder="30">
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="ms-title">Programación por kilómetros</div>
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Km actual</label>
                <input class="fi" type="number" [(ngModel)]="form.kmActual" placeholder="50000">
              </div>
              <div class="fg">
                <label class="fl">Km próximo servicio</label>
                <input class="fi" type="number" [(ngModel)]="form.kmProximo" placeholder="55000">
              </div>
              <div class="fg">
                <label class="fl">Intervalo km</label>
                <input class="fi" type="number" [(ngModel)]="form.kmIntervalo" placeholder="5000">
              </div>
              <div class="fg">
                <label class="fl">Taller</label>
                <input class="fi" [(ngModel)]="form.tallerNombre" placeholder="Taller García">
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="form-grid">
              <div class="fg">
                <label class="fl">Costo estimado ($)</label>
                <input class="fi" type="number" [(ngModel)]="form.costo" placeholder="0">
              </div>
            </div>
            <div class="fg full mt-8">
              <label class="fl">Notas</label>
              <textarea class="fi fi-area" [(ngModel)]="form.notas" rows="2" placeholder="Observaciones..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-save" [disabled]="!form.camionId || !form.tipo || !form.descripcion || guardando"
              (click)="guardar()">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Programar') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ MODAL COMPLETAR ══ -->
    <div class="modal-overlay" *ngIf="mantACompletar" (click)="mantACompletar = null">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">✅ Marcar como completado</h3>
          <button class="modal-close" (click)="mantACompletar = null">✕</button>
        </div>
        <div class="modal-form">
          <div class="modal-section">
            <div class="mant-resume">
              {{ tipoEmoji(mantACompletar.tipo) }} {{ tipoLabel(mantACompletar.tipo) }}
              <span *ngIf="mantACompletar.camion"> — {{ mantACompletar.camion.nombre }}</span>
            </div>
            <div class="fg full mt-8">
              <label class="fl">Costo real ($)</label>
              <input class="fi" type="number" [(ngModel)]="completarCosto" placeholder="0">
            </div>
            <div class="fg full mt-8">
              <label class="fl">Notas de la realización</label>
              <textarea class="fi fi-area" [(ngModel)]="completarNotas" rows="2" placeholder="Todo bien, se cambió..."></textarea>
            </div>
            <div class="intervalo-info" *ngIf="mantACompletar.intervaloDias">
              🔄 Se programará automáticamente el próximo en {{ mantACompletar.intervaloDias }} días
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="mantACompletar = null">Cancelar</button>
            <button class="btn-save btn-green" [disabled]="guardando" (click)="completar()">
              <div class="btn-spin" *ngIf="guardando"></div>
              {{ guardando ? 'Guardando...' : 'Confirmar completado' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm eliminar -->
    <div class="modal-overlay" *ngIf="mantAEliminar" (click)="mantAEliminar = null">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="confirm-title">¿Eliminar mantenimiento?</h3>
        <p class="confirm-text">Esta acción no se puede deshacer.</p>
        <div class="confirm-btns">
          <button class="btn-cancel" (click)="mantAEliminar = null">Cancelar</button>
          <button class="btn-danger" (click)="eliminar()">Eliminar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mant-page { padding: 24px; max-width: 1200px; margin: 0 auto; }

    /* Header */
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 700; color: #f0f1f3; letter-spacing: -0.02em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #5a5e6a; }
    .header-actions { display: flex; align-items: center; gap: 10px; }

    .view-tabs { display: flex; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 3px; }
    .vtab { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 5px; border: none; background: transparent; color: #5a5e6a; font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .vtab:hover { color: #8b8f9a; }
    .vtab.active { background: #f97316; color: white; font-weight: 700; }

    .btn-new { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 12px rgba(249,115,22,0.2); white-space: nowrap; }
    .btn-new:hover { transform: translateY(-1px); }

    /* Alertas */
    .alertas-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px; scrollbar-width: none; }
    .alertas-strip::-webkit-scrollbar { display: none; }

    .alerta-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #13151a; border: 1px solid rgba(234,179,8,0.2); border-radius: 8px; flex-shrink: 0; }
    .alerta-item.urgente { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
    .alerta-item.pronto { border-color: rgba(249,115,22,0.3); }

    .al-icon { font-size: 20px; }
    .al-info { min-width: 0; }
    .al-nombre { font-size: 12px; font-weight: 600; color: #f0f1f3; }
    .al-desc { font-size: 10px; color: #5a5e6a; }

    .al-dias { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
    .al-dias.red { background: rgba(239,68,68,0.1); color: #ef4444; }
    .al-dias.orange { background: rgba(249,115,22,0.1); color: #f97316; }
    .al-dias.yellow { background: rgba(234,179,8,0.1); color: #eab308; }

    /* Filtros */
    .filters-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px; background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; margin-bottom: 16px; }

    .filter-sel { padding: 7px 10px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: #f0f1f3; font-size: 13px; font-family: 'DM Sans', sans-serif; min-width: 160px; outline: none; cursor: pointer; }
    .filter-sel option { background: #1a1d24; }

    .btn-clear { padding: 7px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: #8b8f9a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-clear:hover { border-color: rgba(255,255,255,0.2); color: #f0f1f3; }

    /* Loading */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 32px; color: #5a5e6a; font-size: 13px; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Lista */
    .lista-view { display: flex; flex-direction: column; gap: 10px; }

    .mant-card { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, border-color 0.2s; border-left: 3px solid transparent; }
    .mant-card:hover { transform: translateX(2px); }
    .mant-card.urgente { border-left-color: #ef4444; background: rgba(239,68,68,0.03); }
    .mant-card.pronto { border-left-color: #f97316; }
    .mant-card.completado { opacity: 0.6; }

    .mc-head { display: flex; align-items: center; gap: 12px; }
    .mc-tipo { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .tipo-icon-big { font-size: 28px; flex-shrink: 0; }
    .mc-nombre { font-size: 14px; font-weight: 600; color: #f0f1f3; }
    .mc-camion { font-size: 11px; color: #5a5e6a; margin-top: 2px; }

    .mc-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

    .estado-badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .eb-programado { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .eb-en_proceso { background: rgba(234,179,8,0.1); color: #eab308; }
    .eb-completado { background: rgba(34,197,94,0.1); color: #22c55e; }
    .eb-vencido { background: rgba(239,68,68,0.1); color: #ef4444; }

    .dias-badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
    .db-red { background: rgba(239,68,68,0.1); color: #ef4444; }
    .db-orange { background: rgba(249,115,22,0.1); color: #f97316; }
    .db-yellow { background: rgba(234,179,8,0.1); color: #eab308; }
    .db-green { background: rgba(34,197,94,0.1); color: #22c55e; }

    .mc-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .icon-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #5a5e6a; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
    .icon-btn:hover { background: rgba(255,255,255,0.09); color: #f0f1f3; }
    .btn-completar:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #22c55e; }
    .icon-btn-danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444; }

    .mc-desc { font-size: 13px; color: #8b8f9a; }
    .mc-details { display: flex; gap: 12px; flex-wrap: wrap; }
    .mc-det-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #5a5e6a; }
    .mc-notas { font-size: 11px; color: #5a5e6a; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 2px solid rgba(249,115,22,0.3); }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; color: #3a3e48; text-align: center; }
    .empty-icon { font-size: 48px; }
    .empty-state p { font-size: 13px; color: #5a5e6a; }

    /* Calendario */
    .calendario-view { background: #13151a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; }

    .cal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .cal-titulo { font-size: 15px; font-weight: 700; color: #f0f1f3; }
    .cal-nav { background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; width: 30px; height: 30px; color: #8b8f9a; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .cal-nav:hover { border-color: #f97316; color: #f97316; }

    .cal-grid-header { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .cal-dow { padding: 8px; text-align: center; font-size: 10px; font-weight: 700; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }

    .cal-dia { min-height: 80px; padding: 6px; border-right: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
    .cal-dia:hover { background: rgba(255,255,255,0.02); }
    .cal-dia.otro-mes { opacity: 0.3; }
    .cal-dia.hoy .cal-num { background: #f97316; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .cal-dia.tiene-eventos { background: rgba(255,255,255,0.01); }

    .cal-num { font-size: 12px; color: #8b8f9a; margin-bottom: 4px; font-family: 'DM Mono', monospace; }

    .cal-eventos { display: flex; flex-direction: column; gap: 2px; }
    .cal-evento { font-size: 9px; padding: 2px 4px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
    .ce-programado { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .ce-en_proceso { background: rgba(234,179,8,0.2); color: #eab308; }
    .ce-completado { background: rgba(34,197,94,0.2); color: #22c55e; }
    .ce-vencido { background: rgba(239,68,68,0.2); color: #ef4444; }
    .cal-mas { font-size: 9px; color: #5a5e6a; padding: 1px 4px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; animation: fadeIn 0.15s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal { background: #13151a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s ease; }
    .modal.modal-sm { max-width: 400px; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .modal-title { font-size: 15px; font-weight: 700; color: #f0f1f3; }
    .modal-close { background: none; border: none; color: #5a5e6a; font-size: 16px; cursor: pointer; padding: 4px; transition: color 0.15s; }
    .modal-close:hover { color: #f0f1f3; }

    .modal-form { display: flex; flex-direction: column; }
    .modal-section { padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .ms-title { font-size: 10px; font-weight: 700; color: #3a3e48; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .mt-8 { margin-top: 8px; }
    .fl { font-size: 11px; font-weight: 600; color: #5a5e6a; }

    .fi { padding: 9px 12px; background: #1a1d24; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: #f0f1f3; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; width: 100%; }
    .fi:focus { border-color: #f97316; }
    .fi::placeholder { color: #3a3e48; }
    .fi-area { resize: vertical; min-height: 60px; }
    .fi option { background: #1a1d24; }

    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 14px 24px; }

    .btn-cancel { padding: 8px 16px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: #8b8f9a; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: #f0f1f3; }

    .btn-save { display: flex; align-items: center; gap: 7px; padding: 9px 18px; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 7px; color: white; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-save.btn-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

    .mant-resume { font-size: 14px; font-weight: 600; color: #f0f1f3; }
    .intervalo-info { margin-top: 10px; padding: 8px 12px; background: rgba(34,197,94,0.08); border-radius: 6px; font-size: 12px; color: #22c55e; }

    /* Confirm */
    .confirm-modal { background: #13151a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 32px; max-width: 360px; width: 100%; text-align: center; animation: slideUp 0.2s ease; }
    .confirm-icon { width: 52px; height: 52px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .confirm-title { font-size: 17px; font-weight: 700; color: #f0f1f3; margin-bottom: 8px; }
    .confirm-text { font-size: 13px; color: #5a5e6a; margin-bottom: 24px; }
    .confirm-btns { display: flex; gap: 10px; justify-content: center; }
    .btn-danger { padding: 9px 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 7px; color: #ef4444; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
    .btn-danger:hover { background: rgba(239,68,68,0.2); }

    @media (max-width: 768px) {
      .mant-page { padding: 16px; }
      .form-grid { grid-template-columns: 1fr; }
      .filters-bar { gap: 8px; }
    }
  `]
})
export class MantenimientosComponent implements OnInit {
  mantenimientos: Mantenimiento[] = [];
  mantenimientosFiltrados: Mantenimiento[] = [];
  alertas: any[] = [];
  camiones: any[] = [];
  cargando = false;
  guardando = false;
  vista: 'lista' | 'calendario' = 'lista';

  filtroCamion = '';
  filtroEstado = '';
  filtroTipo = '';

  modalAbierto = false;
  editando = false;
  private _editandoId: number | null = null;
  mantACompletar: Mantenimiento | null = null;
  mantAEliminar: Mantenimiento | null = null;

  completarCosto: number | null = null;
  completarNotas = '';

  form = {
    camionId: '', tipo: 'CAMBIO_ACEITE', descripcion: '',
    fechaProgramada: '', intervaloDias: null as number | null,
    kmActual: null as number | null, kmProximo: null as number | null,
    kmIntervalo: null as number | null, costo: null as number | null,
    notas: '', tallerNombre: ''
  };

  // Calendario
  mesActual = new Date();
  diasCalendario: DiaCalendario[] = [];

  get proximos() { return this.alertas.length; }

  constructor(private http: HttpClient, private snack: MatSnackBar, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.cargarCamiones();
    this.cargarAlertas();
    this.generarCalendario();
  }

  cargar() {
    this.cargando = true;
    this.http.get<Mantenimiento[]>(`${environment.apiUrl}/mantenimientos`).subscribe({
      next: m => { this.mantenimientos = m; this.filtrar(); this.generarCalendario(); this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  cargarCamiones() {
    this.http.get<any[]>(`${environment.apiUrl}/camiones`).subscribe({ next: c => this.camiones = c, error: () => {} });
  }

  cargarAlertas() {
    this.http.get<any[]>(`${environment.apiUrl}/mantenimientos/alertas`).subscribe({ next: a => this.alertas = a, error: () => {} });
  }

  filtrar() {
    let base = this.mantenimientos;
    if (this.filtroCamion) base = base.filter(m => m.camion?.id?.toString() === this.filtroCamion);
    if (this.filtroEstado) base = base.filter(m => m.estado?.toString() === this.filtroEstado);
    if (this.filtroTipo) base = base.filter(m => m.tipo?.toString() === this.filtroTipo);
    this.mantenimientosFiltrados = base;
  }

  limpiarFiltros() { this.filtroCamion = ''; this.filtroEstado = ''; this.filtroTipo = ''; this.filtrar(); }

  abrirModal(m?: Mantenimiento) {
    this.editando = !!m;
    this._editandoId = m?.id || null;
    if (m) {
      this.form = {
        camionId: m.camion?.id?.toString() || '',
        tipo: m.tipo?.toString() || 'CAMBIO_ACEITE',
        descripcion: m.descripcion,
        fechaProgramada: m.fechaProgramada ? new Date(m.fechaProgramada).toISOString().split('T')[0] : '',
        intervaloDias: m.intervaloDias || null,
        kmActual: m.kmActual || null, kmProximo: m.kmProximo || null,
        kmIntervalo: m.kmIntervalo || null, costo: m.costo || null,
        notas: m.notas || '', tallerNombre: m.tallerNombre || ''
      };
    } else {
      this.form = { camionId: '', tipo: 'CAMBIO_ACEITE', descripcion: '', fechaProgramada: '', intervaloDias: null, kmActual: null, kmProximo: null, kmIntervalo: null, costo: null, notas: '', tallerNombre: '' };
    }
    this.modalAbierto = true;
  }

  cerrarModal() { this.modalAbierto = false; this._editandoId = null; }

  guardar() {
    if (!this.form.camionId || !this.form.tipo || !this.form.descripcion) return;
    this.guardando = true;
    const dto = {
      ...this.form,
      camionId: parseInt(this.form.camionId),
      fechaProgramada: this.form.fechaProgramada ? new Date(this.form.fechaProgramada).toISOString() : null
    };
    const req = this.editando && this._editandoId
      ? this.http.put(`${environment.apiUrl}/mantenimientos/${this._editandoId}`, dto)
      : this.http.post(`${environment.apiUrl}/mantenimientos`, dto);
    req.subscribe({
      next: () => {
        this.snack.open(this.editando ? '✓ Mantenimiento actualizado' : '✓ Mantenimiento programado', 'OK', { duration: 3000 });
        this.cerrarModal();
        this.cargar();
        this.cargarAlertas();
        this.guardando = false;
      },
      error: () => { this.snack.open('Error al guardar', 'OK', { duration: 3000 }); this.guardando = false; }
    });
  }

  abrirCompletar(m: Mantenimiento) { this.mantACompletar = m; this.completarCosto = null; this.completarNotas = ''; }

  completar() {
    if (!this.mantACompletar?.id) return;
    this.guardando = true;
    this.http.put(`${environment.apiUrl}/mantenimientos/${this.mantACompletar.id}/completar`, {
      costo: this.completarCosto, notas: this.completarNotas || null
    }).subscribe({
      next: () => {
        this.snack.open('✅ Mantenimiento completado', 'OK', { duration: 3000 });
        this.mantACompletar = null;
        this.cargar();
        this.cargarAlertas();
        this.guardando = false;
      },
      error: () => { this.snack.open('Error', 'OK', { duration: 3000 }); this.guardando = false; }
    });
  }

  confirmarEliminar(m: Mantenimiento) { this.mantAEliminar = m; }

  eliminar() {
    if (!this.mantAEliminar?.id) return;
    this.http.delete(`${environment.apiUrl}/mantenimientos/${this.mantAEliminar.id}`).subscribe({
      next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.mantAEliminar = null; this.cargar(); },
      error: () => {}
    });
  }

  // Calendario
  generarCalendario() {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const hoy = new Date(); hoy.setHours(0,0,0,0);

    const dias: DiaCalendario[] = [];
    const inicioGrid = new Date(primerDia);
    inicioGrid.setDate(primerDia.getDate() - primerDia.getDay());
    this.cdr.detectChanges();

    for (let i = 0; i < 42; i++) {
      const fecha = new Date(inicioGrid);
      fecha.setDate(inicioGrid.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const mants = this.mantenimientos.filter(m => {
        if (!m.fechaProgramada) return false;
        return new Date(m.fechaProgramada).toISOString().split('T')[0] === fechaStr;
      });

      dias.push({
        fecha,
        esHoy: fecha.getTime() === hoy.getTime(),
        esMesActual: fecha.getMonth() === mes,
        mantenimientos: mants
      });
    }

    this.diasCalendario = dias;
  }

  mesAnterior() { this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1); this.generarCalendario(); }
  mesSiguiente() { this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1); this.generarCalendario(); }

  tipoLabel(tipo: any): string {
    const l: Record<string, string> = {
      '0':'Cambio de aceite','1':'Revisión de frenos','2':'Cambio de llantas',
      '3':'Revisión general','4':'Servicio mayor','5':'Otro',
      'CAMBIO_ACEITE':'Cambio de aceite','REVISION_FRENOS':'Revisión de frenos',
      'CAMBIO_LLANTAS':'Cambio de llantas','REVISION_GENERAL':'Revisión general',
      'SERVICIO_MAYOR':'Servicio mayor','OTRO':'Otro'
    };
    return l[tipo?.toString()] || tipo || '—';
  }

  tipoEmoji(tipo: any): string {
    const e: Record<string, string> = {
      '0':'🛢','1':'🔴','2':'⚫','3':'🔧','4':'⚙️','5':'📋',
      'CAMBIO_ACEITE':'🛢','REVISION_FRENOS':'🔴','CAMBIO_LLANTAS':'⚫',
      'REVISION_GENERAL':'🔧','SERVICIO_MAYOR':'⚙️','OTRO':'📋'
    };
    return e[tipo?.toString()] || '🔧';
  }

  estadoClass(estado: any): string {
    const m: Record<string, string> = {
      '0':'programado','1':'en_proceso','2':'completado','3':'vencido',
      'PROGRAMADO':'programado','EN_PROCESO':'en_proceso','COMPLETADO':'completado','VENCIDO':'vencido'
    };
    return m[estado?.toString()] || 'programado';
  }

  estadoLabel(estado: any): string {
    const l: Record<string, string> = {
      '0':'Programado','1':'En proceso','2':'Completado','3':'Vencido',
      'PROGRAMADO':'Programado','EN_PROCESO':'En proceso','COMPLETADO':'Completado','VENCIDO':'Vencido'
    };
    return l[estado?.toString()] || estado || '—';
  }
}

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface Conversacion {
  id: number;
  nombre: string;
  email: string;
  fotoUrl?: string;
  noLeidos: number;
  ultimoMensaje?: {
    texto: string;
    fechaEnvio: string;
    leido: boolean;
    remitenteId: number;
  };
}

interface Mensaje {
  id: number;
  texto: string;
  fotoUrl?: string;
  fechaEnvio: string;
  remitenteId: number;
  destinatarioId: number;
  remitente: { nombre: string; fotoUrl?: string };
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Botón flotante -->
    <div class="chat-fab" (click)="toggleChat()" [class.has-unread]="totalNoLeidos > 0">
      <svg *ngIf="!abierto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg *ngIf="abierto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <span class="fab-badge" *ngIf="totalNoLeidos > 0 && !abierto">
        {{ totalNoLeidos > 9 ? '9+' : totalNoLeidos }}
      </span>
    </div>

    <!-- Panel de chat -->
    <div class="chat-panel" *ngIf="abierto">

      <!-- Header -->
      <div class="chat-header">
        <div class="ch-left">
          <button class="ch-back"
            *ngIf="conductorSeleccionado && auth.isAdminOrDespachador"
            (click)="volver()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div class="ch-avatar" *ngIf="conductorSeleccionado">
            <img *ngIf="conductorSeleccionado.fotoUrl" [src]="conductorSeleccionado.fotoUrl" class="av-img">
            <span *ngIf="!conductorSeleccionado.fotoUrl">{{ conductorSeleccionado.nombre.charAt(0) }}</span>
          </div>
          <div>
            <div class="ch-titulo">
              {{ auth.isConductor
                  ? 'Administrador'
                  : conductorSeleccionado
                    ? conductorSeleccionado.nombre
                    : 'Mensajes' }}
            </div>
            <div class="ch-sub" *ngIf="!conductorSeleccionado && auth.isAdminOrDespachador">
              {{ conversaciones.length }} conductor{{ conversaciones.length !== 1 ? 'es' : '' }}
            </div>
            <div class="ch-sub online" *ngIf="conductorSeleccionado">En línea</div>
          </div>
        </div>
        <button class="ch-close" (click)="toggleChat()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Lista de conversaciones (solo admin/despachador sin conversación abierta) -->
      <div class="conv-list" *ngIf="!conductorSeleccionado && auth.isAdminOrDespachador">

        <div class="loading-chat" *ngIf="cargando">
          <div class="spinner-sm"></div>
        </div>

        <div class="conv-item" *ngFor="let c of conversaciones"
          (click)="abrirConversacion(c)"
          [class.has-unread]="c.noLeidos > 0">
          <div class="ci-avatar">
            <img *ngIf="c.fotoUrl" [src]="c.fotoUrl" class="av-img">
            <span *ngIf="!c.fotoUrl">{{ c.nombre.charAt(0) }}</span>
            <div class="ci-online"></div>
          </div>
          <div class="ci-info">
            <div class="ci-nombre">{{ c.nombre }}</div>
            <div class="ci-ultimo" *ngIf="c.ultimoMensaje">
              <span *ngIf="c.ultimoMensaje.remitenteId !== c.id" class="ci-yo">Tú: </span>
              {{ c.ultimoMensaje.texto | slice:0:30 }}{{ c.ultimoMensaje.texto.length > 30 ? '...' : '' }}
            </div>
            <div class="ci-ultimo muted" *ngIf="!c.ultimoMensaje">Sin mensajes</div>
          </div>
          <div class="ci-meta">
            <div class="ci-hora" *ngIf="c.ultimoMensaje">
              {{ c.ultimoMensaje.fechaEnvio | date:'HH:mm' }}
            </div>
            <div class="ci-badge" *ngIf="c.noLeidos > 0">{{ c.noLeidos }}</div>
          </div>
        </div>

        <div class="conv-empty" *ngIf="!cargando && conversaciones.length === 0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <p>Sin conductores activos</p>
        </div>

      </div>

      <!-- Mensajes: visible cuando hay conversación seleccionada O cuando es conductor -->
      <div class="mensajes-wrap" *ngIf="conductorSeleccionado || auth.isConductor">

        <div class="mensajes-list" #mensajesList>

          <div class="loading-chat" *ngIf="cargandoMsgs">
            <div class="spinner-sm"></div>
          </div>

          <!-- Fila de mensaje con alineación izquierda/derecha -->
          <div *ngFor="let m of mensajes"
            class="msg-row"
            [class.row-yo]="m.remitenteId === miId"
            [class.row-otro]="m.remitenteId !== miId">

            <!-- Avatar del otro (izquierda) -->
            <div class="msg-av" *ngIf="m.remitenteId !== miId">
              {{ m.remitente?.nombre?.charAt(0) || '?' }}
            </div>

            <!-- Burbuja -->
            <div class="msg-burbuja"
              [class.msg-yo]="m.remitenteId === miId"
              [class.msg-otro]="m.remitenteId !== miId">
              <div class="msg-foto-preview" *ngIf="m.fotoUrl">
                <img [src]="m.fotoUrl" class="msg-img" (error)="$any($event.target).style.display='none'">
              </div>
              <div class="msg-texto" *ngIf="m.texto">{{ m.texto }}</div>
              <div class="msg-hora">{{ m.fechaEnvio | date:'HH:mm' }}</div>
            </div>

          </div>

          <div class="msgs-empty" *ngIf="!cargandoMsgs && mensajes.length === 0">
            <p>Empieza la conversación 👋</p>
          </div>

        </div>

        <!-- Input -->
        <div class="msg-input-area">
          <div class="foto-preview-bar" *ngIf="fotoPreview">
            <img [src]="fotoPreview" class="fp-img">
            <button class="fp-remove" (click)="quitarFoto()">✕</button>
          </div>
          <div class="msg-input-row">
            <button class="btn-foto" (click)="fotoInput.click()" title="Enviar foto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input #fotoInput type="file" accept="image/*" style="display:none" (change)="onFotoSelected($event)">
            <input class="msg-input"
              [(ngModel)]="textoNuevo"
              placeholder="Escribe un mensaje..."
              (keydown.enter)="enviar()"
              [disabled]="enviando">
            <button class="btn-send"
              (click)="enviar()"
              [disabled]="(!textoNuevo.trim() && !fotoBase64) || enviando">
              <svg *ngIf="!enviando" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <div class="spinner-sm" *ngIf="enviando"></div>
            </button>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .chat-fab {
      position: fixed; bottom: 24px; right: 24px;
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none; color: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.4);
      z-index: 400; transition: all 0.2s ease;
    }
    .chat-fab:hover { transform: scale(1.08); }
    .chat-fab.has-unread { animation: pulse-fab 2s infinite; }
    @keyframes pulse-fab {
      0%,100% { box-shadow: 0 4px 16px rgba(59,130,246,0.4); }
      50% { box-shadow: 0 4px 24px rgba(59,130,246,0.7); }
    }
    .fab-badge {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: #ef4444; color: white; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px; border: 2px solid #0c0d0f;
    }

    .chat-panel {
      position: fixed; bottom: 88px; right: 24px;
      width: 320px; height: 480px;
      background: #13151a; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      z-index: 399; display: flex; flex-direction: column;
      overflow: hidden; animation: slideUpChat 0.2s ease;
    }
    @keyframes slideUpChat {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
      background: #1a1d24; flex-shrink: 0;
    }
    .ch-left { display: flex; align-items: center; gap: 8px; }
    .ch-back { background: none; border: none; color: #8b8f9a; cursor: pointer; padding: 4px; display: flex; align-items: center; }
    .ch-back:hover { color: #f0f1f3; }
    .ch-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: white; overflow: hidden; flex-shrink: 0;
    }
    .av-img { width: 100%; height: 100%; object-fit: cover; }
    .ch-titulo { font-size: 14px; font-weight: 700; color: #f0f1f3; }
    .ch-sub { font-size: 11px; color: #5a5e6a; margin-top: 1px; }
    .ch-sub.online { color: #22c55e; }
    .ch-close { background: none; border: none; color: #5a5e6a; cursor: pointer; padding: 4px; display: flex; align-items: center; }
    .ch-close:hover { color: #f0f1f3; }

    .conv-list { flex: 1; overflow-y: auto; }
    .conv-item {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    }
    .conv-item:hover { background: rgba(255,255,255,0.04); }
    .conv-item.has-unread { background: rgba(59,130,246,0.04); }
    .ci-avatar {
      position: relative; width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; color: white; overflow: hidden; flex-shrink: 0;
    }
    .ci-online {
      position: absolute; bottom: 1px; right: 1px;
      width: 9px; height: 9px; border-radius: 50%;
      background: #22c55e; border: 2px solid #13151a;
    }
    .ci-info { flex: 1; min-width: 0; }
    .ci-nombre { font-size: 13px; font-weight: 600; color: #f0f1f3; }
    .ci-ultimo { font-size: 11px; color: #5a5e6a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .ci-ultimo.muted { color: #3a3e48; }
    .ci-yo { color: #8b8f9a; }
    .ci-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .ci-hora { font-size: 10px; color: #5a5e6a; font-family: 'DM Mono', monospace; }
    .ci-badge { min-width: 18px; height: 18px; border-radius: 9px; background: #3b82f6; color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
    .conv-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 24px; color: #3a3e48; text-align: center; }
    .conv-empty p { font-size: 12px; color: #5a5e6a; }

    .mensajes-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .mensajes-list {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 4px;
    }

    /* ── Clave para alineación izquierda/derecha ── */
    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
    }
    /* Mis mensajes: fila al revés → burbuja a la derecha */
    .row-yo {
      flex-direction: row-reverse;
    }
    /* Mensajes del otro: fila normal → burbuja a la izquierda */
    .row-otro {
      flex-direction: row;
    }

    .msg-av {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #a855f7, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white;
    }

    .msg-burbuja {
      max-width: 75%;
      padding: 8px 12px;
      display: flex; flex-direction: column; gap: 3px;
    }

    /* Azul a la derecha */
    .msg-yo {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 16px 16px 4px 16px;
    }

    /* Gris a la izquierda */
    .msg-otro {
      background: #22262f;
      border-radius: 16px 16px 16px 4px;
    }

    .msg-texto { font-size: 13px; color: #f0f1f3; line-height: 1.4; word-break: break-word; }
    .msg-hora { font-size: 9px; color: rgba(255,255,255,0.45); font-family: 'DM Mono', monospace; }
    /* Hora alineada a la derecha en mis mensajes */
    .msg-yo .msg-hora { text-align: right; }
    .msg-otro .msg-hora { text-align: left; }

    .msg-foto-preview { border-radius: 8px; overflow: hidden; }
    .msg-img { width: 100%; max-width: 200px; border-radius: 8px; display: block; }

    .msgs-empty { flex: 1; display: flex; align-items: center; justify-content: center; }
    .msgs-empty p { font-size: 12px; color: #5a5e6a; }

    .msg-input-area {
      border-top: 1px solid rgba(255,255,255,0.07);
      padding: 10px 12px; flex-shrink: 0; background: #1a1d24;
    }
    .foto-preview-bar {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 8px; padding: 6px;
      background: rgba(255,255,255,0.04); border-radius: 8px;
    }
    .fp-img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
    .fp-remove {
      background: rgba(239,68,68,0.1); border: none; color: #ef4444;
      border-radius: 50%; width: 20px; height: 20px; font-size: 11px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .msg-input-row { display: flex; align-items: center; gap: 8px; }
    .btn-foto {
      width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      color: #8b8f9a; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-foto:hover { background: rgba(255,255,255,0.1); color: #f0f1f3; }
    .msg-input {
      flex: 1; padding: 8px 12px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; color: #f0f1f3; font-size: 13px;
      font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s;
    }
    .msg-input:focus { border-color: #3b82f6; }
    .msg-input::placeholder { color: #3a3e48; }
    .btn-send {
      width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none; color: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    .btn-send:hover:not(:disabled) { transform: scale(1.08); }
    .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .loading-chat { display: flex; align-items: center; justify-content: center; padding: 24px; }
    .spinner-sm { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .chat-panel { right: 0; bottom: 0; width: 100%; height: 100%; border-radius: 0; }
      .chat-fab { bottom: 80px; right: 16px; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('mensajesList') mensajesListRef!: ElementRef;

  abierto = false;
  cargando = false;
  cargandoMsgs = false;
  enviando = false;

  conversaciones: Conversacion[] = [];
  conductorSeleccionado: Conversacion | null = null;
  mensajes: Mensaje[] = [];

  textoNuevo = '';
  fotoBase64 = '';
  fotoPreview = '';

  miId = 0;
  private subs = new Subscription();
  private shouldScroll = false;

  get totalNoLeidos(): number {
    return this.conversaciones.reduce((s, c) => s + c.noLeidos, 0);
  }

  constructor(
    private http: HttpClient,
    private signalr: SignalrService,
    public auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
  this.subs.add(this.auth.user$.subscribe(user => {
    if (user) {
      this.miId = user.id;
      this.cdr.detectChanges();
    }
  }));

  this.subs.add(this.signalr.mensajes$.subscribe((msg: any) => {
    if (!msg) return;
    this.ngZone.run(() => {
      const otroId = this.conductorSeleccionado?.id;
      const esRelevante = otroId && (
        (msg.remitenteId === this.miId && msg.destinatarioId === otroId) ||
        (msg.remitenteId === otroId && msg.destinatarioId === this.miId)
      );
      if (esRelevante) {
        const yaExiste = this.mensajes.some(m => m.id === msg.id);
        if (!yaExiste) {
          this.mensajes = [...this.mensajes, msg];
          this.shouldScroll = true;
        }
      }
      this.actualizarConversacion(msg);
      this.cdr.detectChanges();
    });
  }));

  if (this.auth.isAdminOrDespachador) {
    this.cargarConversaciones();
  }
}

  ngOnDestroy() { this.subs.unsubscribe(); }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollAbajo();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    this.abierto = !this.abierto;
    if (this.abierto) {
      if (this.auth.isAdminOrDespachador) {
        this.cargarConversaciones();
      } else if (this.auth.isConductor) {
        this.abrirChatConductor();
      }
    }
  }

  cargarConversaciones() {
    this.cargando = true;
    this.http.get<Conversacion[]>(`${environment.apiUrl}/chat/conversaciones`).subscribe({
      next: c => { this.conversaciones = c; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; }
    });
  }

 abrirConversacion(c: Conversacion) {
  c.noLeidos = 0;
  this.conductorSeleccionado = { ...c };
  this.cargarMensajes(c.id);
}
  abrirChatConductor() {
    this.http.get<any>(`${environment.apiUrl}/chat/admin`).subscribe({
      next: admin => {
        this.conductorSeleccionado = {
          id: admin.id,
          nombre: admin.nombre || 'Administrador',
          email: '',
          fotoUrl: admin.fotoUrl,
          noLeidos: 0
        };
        this.cargarMensajes(admin.id);
        this.cdr.detectChanges();
      }
    });
  }

 cargarMensajes(otroId: number) {
  this.cargandoMsgs = true;
  this.mensajes = [];
  this.http.get<Mensaje[]>(`${environment.apiUrl}/chat/mensajes/${otroId}`).subscribe({
    next: m => {
      this.ngZone.run(() => {
        this.mensajes = m;
        this.cargandoMsgs = false;
        this.shouldScroll = true;
        // Marcar como leídos en backend
        this.http.put(`${environment.apiUrl}/chat/leer/${otroId}`, {}).subscribe();
        // Limpiar badge en frontend inmediatamente
        const idx = this.conversaciones.findIndex(c => c.id === otroId);
        if (idx >= 0) {
          this.conversaciones[idx] = { ...this.conversaciones[idx], noLeidos: 0 };
          this.conversaciones = [...this.conversaciones];
        }
        this.cdr.detectChanges();
      });
    },
    error: () => { this.cargandoMsgs = false; }
  });
}

  volver() {
    this.conductorSeleccionado = null;
    this.mensajes = [];
    this.cargarConversaciones();
  }

  enviar() {
    if ((!this.textoNuevo.trim() && !this.fotoBase64) || !this.conductorSeleccionado) return;
    this.enviando = true;

    const dto = {
      destinatarioId: this.conductorSeleccionado.id,
      texto: this.textoNuevo.trim(),
      fotoUrl: this.fotoBase64 || null
    };

    this.http.post<Mensaje>(`${environment.apiUrl}/chat/enviar`, dto).subscribe({
      next: (m) => {
        const yaExiste = this.mensajes.some(x => x.id === m.id);
        if (!yaExiste) {
          this.mensajes = [...this.mensajes, m];
          this.shouldScroll = true;
        }
        this.textoNuevo = '';
        this.fotoBase64 = '';
        this.fotoPreview = '';
        this.enviando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.enviando = false; }
    });
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.ngZone.run(() => {
        this.fotoBase64 = e.target.result;
        this.fotoPreview = e.target.result;
        this.cdr.detectChanges();
      });
    };
    reader.readAsDataURL(file);
  }

  quitarFoto() { this.fotoBase64 = ''; this.fotoPreview = ''; }

  private scrollAbajo() {
    if (this.mensajesListRef) {
      const el = this.mensajesListRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private actualizarConversacion(msg: any) {
  if (this.auth.isConductor) return;
  const otroId = msg.remitenteId === this.miId ? msg.destinatarioId : msg.remitenteId;
  const idx = this.conversaciones.findIndex(c => c.id === otroId);
  if (idx >= 0) {
    const c = { ...this.conversaciones[idx] };
    c.ultimoMensaje = {
      texto: msg.texto,
      fechaEnvio: msg.fechaEnvio,
      leido: false,
      remitenteId: msg.remitenteId
    };
    
    const estoyEnEsaConv = this.conductorSeleccionado?.id === otroId;
    if (msg.remitenteId !== this.miId && !estoyEnEsaConv) {
      c.noLeidos = (c.noLeidos || 0) + 1;
    } else {
      c.noLeidos = 0;
      this.http.put(`${environment.apiUrl}/chat/leer/${otroId}`, {}).subscribe();
    }
    this.conversaciones = [c, ...this.conversaciones.filter((_, i) => i !== idx)];
  }
}
}

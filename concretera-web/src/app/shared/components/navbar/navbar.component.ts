import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService, Notificacion } from '../../../core/services/signalr.service';
import { Observable } from 'rxjs';
import { PerfilModalComponent } from '../perfil-modal/perfil-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatButtonModule, PerfilModalComponent],
  template: `
    <nav class="navbar">
      <div class="nav-inner">

        <!-- Brand -->
        <a routerLink="/fleet" class="nav-brand">
          <div class="brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 14L10 2L18 14H2Z" fill="currentColor" opacity="0.9"/>
              <rect x="6" y="14" width="8" height="4" rx="1" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <span class="brand-name">Concretera</span>
        </a>

        <!-- Right -->
        <div class="nav-right">

          <!-- Connection -->
          <div class="conn-pill" [class.online]="connected$ | async">
            <div class="conn-dot"></div>
            <span>{{ (connected$ | async) ? 'En línea' : 'Desconectado' }}</span>
          </div>

          <!-- Campana solo para admin y despachador -->
          <div class="notif-wrap" *ngIf="auth.isAdminOrDespachador">
            <button class="notif-btn" (click)="toggleNotif()" [class.has-unread]="noLeidas > 0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notif-badge" *ngIf="noLeidas > 0">
                {{ noLeidas > 9 ? '9+' : noLeidas }}
              </span>
            </button>

            <!-- Panel de notificaciones -->
            <div class="notif-panel" *ngIf="notifAbierto">
              <div class="notif-header">
                <span class="notif-title">Notificaciones</span>
                <div class="notif-actions">
                  <button class="notif-action" (click)="marcarTodas()" *ngIf="noLeidas > 0">Marcar leídas</button>
                  <button class="notif-action" (click)="limpiar()">Limpiar</button>
                </div>
              </div>
              <div class="notif-list">
                <div class="notif-item" *ngFor="let n of notificaciones$ | async"
                  [class.unread]="!n.leida"
                  [class]="'notif-item notif-' + n.tipo + (!n.leida ? ' unread' : '')"
                  (click)="marcarLeida(n.id)">
                  <div class="notif-dot" [class]="'dot-' + n.tipo"></div>
                  <div class="notif-content">
                    <div class="notif-tit">{{ n.titulo }}</div>
                    <div class="notif-msg">{{ n.mensaje }}</div>
                    <div class="notif-time">{{ n.fecha | date:"HH:mm" }}</div>
                  </div>
                </div>
                <div class="notif-empty" *ngIf="((notificaciones$ | async)?.length || 0) === 0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p>Sin notificaciones</p>
                </div>
              </div>
            </div>
          </div>

          <!-- User menu -->
          <button class="user-btn" (click)="openPerfil.emit()">
            <div class="user-avatar">
              {{ (auth.user$ | async)?.nombre?.charAt(0) | uppercase }}
            </div>
            <span class="user-name">{{ (auth.user$ | async)?.nombre }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <!-- Cerrar sesión -->
          <button class="btn-logout" (click)="auth.logout()" title="Cerrar sesión">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>

          <!-- Botón hamburger -->
          <button class="menu-btn" (click)="toggleSidebar()" [class.active]="sidebarAbierto" title="Menú">
            <span></span><span></span><span></span>
          </button>
        </div>

      </div>
    </nav>

    <!-- Overlay -->
    <div class="sidebar-overlay" *ngIf="sidebarAbierto" (click)="cerrarSidebar()"></div>

    <!-- Sidebar derecho -->
    <aside class="sidebar" [class.open]="sidebarAbierto">
      <div class="sidebar-header">
        <span class="sidebar-title">Navegación</span>
        <button class="sidebar-close" (click)="cerrarSidebar()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="sidebar-links">

        <!-- Sección Admin -->
        <div class="sidebar-section" *ngIf="auth.isAdmin">
          <div class="sidebar-section-label">Administración</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/inventario" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <span>Inventario</span>
          </a>
          <a routerLink="/facturas" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Facturas</span>
          </a>
          <a routerLink="/conductor" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()" style="opacity:0.6">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Vista conductor</span>
          </a>
        </div>

        <!-- Sección Operaciones -->
        <div class="sidebar-section" *ngIf="auth.isAdminOrDespachador">
          <div class="sidebar-section-label">Operaciones</div>
          <a routerLink="/fleet" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Fleet</span>
          </a>
          <a routerLink="/mapa" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <span>Mapa</span>
          </a>
          <a routerLink="/dispatch" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Despacho</span>
          </a>
          <a routerLink="/entregas" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <path d="M12 22V7"/>
            </svg>
            <span>Entregas</span>
          </a>
          <a routerLink="/incidencias" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Incidencias</span>
          </a>
          <a routerLink="/mantenimientos" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 1.41 14.14M4.93 4.93A10 10 0 0 0 3.52 19.07"/>
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
            </svg>
            <span>Mantenimientos</span>
          </a>
        </div>

        <!-- Sección Personas -->
        <div class="sidebar-section" *ngIf="auth.isAdminOrDespachador">
          <div class="sidebar-section-label">Personas</div>
          <a routerLink="/clients" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Clientes</span>
          </a>
          <a routerLink="/drivers" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Conductores</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Reportes</span>
          </a>
        </div>

        <!-- Sección Conductor -->
        <div class="sidebar-section" *ngIf="auth.isConductor">
          <div class="sidebar-section-label">Mi trabajo</div>
          <a routerLink="/conductor" routerLinkActive="active" class="sidebar-link" (click)="cerrarSidebar()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Mi camión</span>
          </a>
        </div>

      </div>

      <!-- Footer sidebar -->
      <div class="sidebar-footer">
        <div class="sf-user">
          <div class="sf-avatar">
            {{ (auth.user$ | async)?.nombre?.charAt(0) | uppercase }}
          </div>
          <div class="sf-info">
            <div class="sf-name">{{ (auth.user$ | async)?.nombre }}</div>
            <div class="sf-role">{{ (auth.user$ | async)?.rol }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Modal perfil -->
    <app-perfil-modal *ngIf="perfilAbierto" (closed)="perfilAbierto = false"></app-perfil-modal>
  `,
  styles: [`
    /* ── Navbar ── */
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 56px;
      background: rgba(12,13,15,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      z-index: 100;
    }

    .nav-inner {
      max-width: 1600px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #f0f1f3;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
    }

    .brand-mark {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #f97316, #fb923c);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 0 12px rgba(249,115,22,0.3);
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      flex-shrink: 0;
    }

    /* Connection pill */
    .conn-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      font-size: 11px;
      color: #ef4444;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .conn-pill.online { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #22c55e; }

    .conn-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #ef4444;
      transition: background 0.3s ease;
    }

    .conn-pill.online .conn-dot {
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34,197,94,0.5);
      animation: pulse 2s infinite;
    }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* Notificaciones */
    .notif-wrap { position: relative; }

    .notif-btn {
      position: relative;
      width: 34px; height: 34px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #8b8f9a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .notif-btn:hover { background: rgba(255,255,255,0.09); color: #f0f1f3; }

    .notif-btn.has-unread {
      color: #f97316;
      border-color: rgba(249,115,22,0.3);
      background: rgba(249,115,22,0.08);
      animation: ring 3s ease infinite;
    }

    @keyframes ring {
      0%, 100% { transform: rotate(0); }
      5%, 15% { transform: rotate(10deg); }
      10%, 20% { transform: rotate(-10deg); }
      25% { transform: rotate(0); }
    }

    .notif-badge {
      position: absolute;
      top: -4px; right: -4px;
      min-width: 16px; height: 16px;
      border-radius: 8px;
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 2px solid #0c0d0f;
    }

    /* Panel notificaciones */
    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      background: #13151a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      overflow: hidden;
      z-index: 300;
      animation: slideDown 0.15s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .notif-title { font-size: 13px; font-weight: 700; color: #f0f1f3; }
    .notif-actions { display: flex; gap: 8px; }

    .notif-action {
      font-size: 11px;
      color: #5a5e6a;
      background: none;
      border: none;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      transition: color 0.15s;
      padding: 2px 4px;
    }

    .notif-action:hover { color: #f97316; }

    .notif-list { max-height: 380px; overflow-y: auto; }

    .notif-item {
      display: flex;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 0.15s;
    }

    .notif-item:hover { background: rgba(255,255,255,0.03); }
    .notif-item.unread { background: rgba(249,115,22,0.04); }
    .notif-item:last-child { border-bottom: none; }

    .notif-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .dot-critica { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
    .dot-stock   { background: #eab308; }
    .dot-entrega { background: #22c55e; }
    .dot-info    { background: #3b82f6; }

    .notif-content { flex: 1; min-width: 0; }
    .notif-tit { font-size: 12px; font-weight: 600; color: #f0f1f3; margin-bottom: 2px; }
    .notif-msg { font-size: 11px; color: #8b8f9a; line-height: 1.4; }
    .notif-time { font-size: 10px; color: #3a3e48; margin-top: 4px; font-family: 'DM Mono', monospace; }

    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: #3a3e48;
      font-size: 12px;
    }

    /* User */
    .user-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px 4px 4px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #f0f1f3;
      cursor: pointer;
      transition: all 0.15s;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
    }

    .user-btn:hover { background: rgba(255,255,255,0.09); }

    .user-avatar {
      width: 26px; height: 26px;
      border-radius: 6px;
      background: linear-gradient(135deg, #f97316, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }

    .user-name { font-weight: 500; font-size: 13px; }

    /* Logout */
    .btn-logout {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.15);
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-logout:hover { background: rgba(239,68,68,0.15); }

    /* ── Hamburger ── */
    .menu-btn {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.15s;
      padding: 0;
    }

    .menu-btn:hover { background: rgba(255,255,255,0.1); }

    .menu-btn span {
      display: block;
      width: 16px; height: 1.5px;
      background: #8b8f9a;
      border-radius: 2px;
      transition: all 0.25s ease;
    }

    .menu-btn.active span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); background: #f97316; }
    .menu-btn.active span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .menu-btn.active span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); background: #f97316; }

    /* ── Overlay ── */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 149;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ── Sidebar ── */
    .sidebar {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 260px;
      background: #0f1014;
      border-left: 1px solid rgba(255,255,255,0.07);
      z-index: 150;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -16px 0 48px rgba(0,0,0,0.4);
    }

    .sidebar.open { transform: translateX(0); }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 56px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .sidebar-title {
      font-size: 11px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .sidebar-close {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #5a5e6a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sidebar-close:hover { color: #f0f1f3; background: rgba(255,255,255,0.09); }

    .sidebar-links {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }

    .sidebar-section { padding: 12px 0 4px; }

    .sidebar-section-label {
      font-size: 9px;
      font-weight: 700;
      color: #3a3e48;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0 20px 6px;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 20px;
      text-decoration: none;
      color: #8b8f9a;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s;
      border-left: 2px solid transparent;
    }

    .sidebar-link:hover {
      color: #f0f1f3;
      background: rgba(255,255,255,0.04);
      border-left-color: rgba(255,255,255,0.1);
    }

    .sidebar-link.active {
      color: #f97316;
      background: rgba(249,115,22,0.08);
      border-left-color: #f97316;
    }

    /* Sidebar footer */
    .sidebar-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .sf-user { display: flex; align-items: center; gap: 10px; }

    .sf-avatar {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f97316, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .sf-name { font-size: 13px; font-weight: 600; color: #f0f1f3; }
    .sf-role { font-size: 10px; color: #5a5e6a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px; }

    /* Mobile */
    @media (max-width: 768px) {
      .conn-pill span { display: none; }
      .user-name { display: none; }
      .sidebar { width: 100%; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  connected$: Observable<boolean>;
  @Output() openPerfil = new EventEmitter<void>();

  notificaciones$: Observable<Notificacion[]>;
  noLeidas = 0;
  notifAbierto = false;
  sidebarAbierto = false;
  perfilAbierto = false;

  constructor(public auth: AuthService, private signalr: SignalrService) {
    this.connected$ = this.signalr.connected$;
    this.notificaciones$ = this.signalr.notificaciones$;
  }

  ngOnInit() {
    this.signalr.notificaciones$.subscribe(n => {
      this.noLeidas = n.filter(x => !x.leida).length;
    });
  }

  toggleNotif() { this.notifAbierto = !this.notifAbierto; }
  cerrarNotif() { this.notifAbierto = false; }
  toggleSidebar() { this.sidebarAbierto = !this.sidebarAbierto; }
  cerrarSidebar() { this.sidebarAbierto = false; }
  marcarLeida(id: string) { this.signalr.marcarLeida(id); }
  marcarTodas() { this.signalr.marcarTodasLeidas(); }
  limpiar() { this.signalr.limpiarNotificaciones(); this.notifAbierto = false; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrap')) {
      this.notifAbierto = false;
    }
  }
}
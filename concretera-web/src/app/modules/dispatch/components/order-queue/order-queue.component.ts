import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../../core/models/order';
import { Truck } from '../../../../core/models/truck';
import { DispatchService } from '../../../../core/services/dispatch.service';
import { TruckService } from '../../../../core/services/truck.service';
import { SignalrService } from '../../../../core/services/signalr.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-order-queue',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatSelectModule, MatChipsModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <mat-card>
      <h2 class="queue-title">
        Cola de pedidos
        <mat-chip style="background:#fff3e0;color:#e65100;margin-left:8px">
          {{ orders.length }}
        </mat-chip>
      </h2>

      <div *ngIf="orders.length === 0" class="empty">
        Sin pedidos en cola. Agrega desde Despacho.
      </div>

      <div class="q-item" *ngFor="let order of orders">
        <div class="q-info">
          <div class="q-name">{{ order.clienteNombre }}</div>
          <div class="q-addr">{{ order.direccion }}</div>
          <div class="q-meta">
            Ida: {{ order.travelMinutos }}min ·
            Desc: {{ order.descargaMinutos }}min ·
            {{ order.m3Solicitados }} m³
          </div>
        </div>

        <mat-select
          [(ngModel)]="selectedTruck[order.id]"
          placeholder="Camión..."
          class="truck-select">
          <mat-option *ngFor="let t of trucksLibres" [value]="t.id">
            {{ t.nombre }}
          </mat-option>
        </mat-select>

        <button mat-raised-button color="primary" class="btn-assign"
          (click)="asignar(order)"
          [disabled]="!selectedTruck[order.id]">
          ▶
        </button>

        <button mat-icon-button color="warn" (click)="cancelar(order)">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .queue-title {
      font-size: 16px; font-weight: 500; margin-bottom: 16px;
      display: flex; align-items: center;
    }
    .empty { text-align: center; padding: 24px; color: #aaa; font-size: 13px; }
    .q-item {
      display: flex; align-items: center; gap: 10px; padding: 10px;
      border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;
    }
    .q-info { flex: 1; }
    .q-name { font-weight: 600; font-size: 13px; }
    .q-addr { font-size: 11px; color: #888; margin: 2px 0; }
    .q-meta { font-size: 10px; color: #aaa; }
    .truck-select { width: 140px; }
    .btn-assign { min-width: 40px !important; padding: 0 8px !important; }
  `]
})
export class OrderQueueComponent implements OnInit {
  orders: Order[] = [];
  trucksLibres: Truck[] = [];
  selectedTruck: Record<number, number> = {};

  constructor(
    private dispatchService: DispatchService,
    private truckService: TruckService,
    private signalr: SignalrService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.dispatchService.getCola().subscribe(o => this.orders = o);
    this.truckService.getTrucksLibres().subscribe(t => this.trucksLibres = t);

    this.signalr.cola$.subscribe(cola => {
      if (cola.length) this.orders = cola;
      this.cdr.detectChanges();
    });
  }

  asignar(order: Order) {
    const camionId = this.selectedTruck[order.id];
    if (!camionId) return;
    this.dispatchService.asignarDeCola(order.id, camionId).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o.id !== order.id);
        this.snack.open('Camión asignado', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('Error al asignar', 'OK', { duration: 2000 })
    });
  }

  cancelar(order: Order) {
    this.dispatchService.cancelar(order.id).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o.id !== order.id);
        this.snack.open('Pedido cancelado', 'OK', { duration: 2000 });
      }
    });
  }
}

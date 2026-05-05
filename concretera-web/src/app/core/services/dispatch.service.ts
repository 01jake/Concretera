import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderDto, OrderStatus } from '../models/order';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private api = `${environment.apiUrl}/despacho`;

  constructor(private http: HttpClient) {}

  // Crear y despachar pedido inmediatamente
  despachar(dto: CreateOrderDto & { camionId?: number }): Observable<Order> {
    return this.http.post<Order>(`${this.api}/despachar`, dto);
  }

  // Agregar pedido a la cola
  agregarCola(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(`${this.api}/cola`, dto);
  }

  // Obtener cola de pedidos pendientes
  getCola(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/cola`);
  }

  // Asignar pedido de la cola a un camión
  asignarDeCola(orderId: number, camionId: number): Observable<Order> {
    return this.http.post<Order>(`${this.api}/cola/${orderId}/asignar`, { camionId });
  }

  // Cancelar pedido
  cancelar(orderId: number): Observable<Order> {
    return this.http.patch<Order>(`${this.api}/${orderId}/cancelar`, {});
  }

  // Historial de pedidos
  getHistorial(desde?: Date, hasta?: Date): Observable<Order[]> {
    let params: any = {};
    if (desde) params['desde'] = desde.toISOString();
    if (hasta) params['hasta'] = hasta.toISOString();
    return this.http.get<Order[]>(`${this.api}/historial`, { params });
  }

  // Obtener pedido por id
  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.api}/${id}`);
  }
}

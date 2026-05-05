import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Truck, TruckStatus } from '../models/truck';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private api = `${environment.apiUrl}/camiones`;

  constructor(private http: HttpClient) {}
private normalizeStatus(status: any): TruckStatus {
  const numMap: Record<number, TruckStatus> = {
    0: TruckStatus.LIBRE,
    1: TruckStatus.CARGANDO,
    2: TruckStatus.EN_RUTA,
    3: TruckStatus.DESCARGANDO,
    4: TruckStatus.REGRESANDO,
    5: TruckStatus.MANTENIMIENTO
  };
  if (typeof status === 'number') return numMap[status] || TruckStatus.LIBRE;
  return status as TruckStatus;
}

getAll(): Observable<Truck[]> {
  return this.http.get<Truck[]>(this.api).pipe(
    map(trucks => trucks.map(t => ({
      ...t,
      status: this.normalizeStatus(t.status as any)
    })))
  );
}
  getById(id: number): Observable<Truck> {
    return this.http.get<Truck>(`${this.api}/${id}`);
  }

  updateStatus(id: number, status: TruckStatus): Observable<Truck> {
    return this.http.patch<Truck>(`${this.api}/${id}/status`, { status });
  }

  asignarViaje(camionId: number, orderId: number): Observable<Truck> {
    return this.http.post<Truck>(`${this.api}/${camionId}/asignar`, { orderId });
  }

  liberarCamion(id: number): Observable<Truck> {
    return this.http.post<Truck>(`${this.api}/${id}/liberar`, {});
  }

  getTrucksLibres(): Observable<Truck[]> {
    return this.http.get<Truck[]>(`${this.api}/libres`);
  }

  // Calcular tiempo libre estimado
  getTiempoLibre(truck: Truck): Date | null {
    const now = new Date();
    const msMin = 60000;

    switch (truck.status) {
      case TruckStatus.LIBRE:
        return now;
      case TruckStatus.CARGANDO:
        if (!truck.cargaFin) return null;
        return new Date(
          new Date(truck.cargaFin).getTime() +
          truck.travelMinutos * msMin +
          truck.descargaMinutos * msMin +
          truck.travelMinutos * msMin
        );
      case TruckStatus.EN_RUTA:
        if (!truck.llegadaEstimada) return null;
        return new Date(
          new Date(truck.llegadaEstimada).getTime() +
          truck.descargaMinutos * msMin +
          truck.travelMinutos * msMin
        );
      case TruckStatus.DESCARGANDO:
        if (!truck.descargaFin) return null;
        return new Date(
          new Date(truck.descargaFin).getTime() +
          truck.travelMinutos * msMin
        );
      case TruckStatus.REGRESANDO:
        return truck.regresoFin ? new Date(truck.regresoFin) : null;
      default:
        return null;
    }
  }
}

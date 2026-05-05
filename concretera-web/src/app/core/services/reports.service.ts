import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, TripSummary } from '../models/trip';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  getViajes(desde: Date, hasta: Date, camionId?: number): Observable<Trip[]> {
    let params: any = {
      desde: desde.toISOString(),
      hasta: hasta.toISOString()
    };
    if (camionId) params['camionId'] = camionId;
    return this.http.get<Trip[]>(`${this.api}/viajes`, { params });
  }

  getResumen(desde: Date, hasta: Date): Observable<TripSummary> {
    return this.http.get<TripSummary>(`${this.api}/resumen`, {
      params: { desde: desde.toISOString(), hasta: hasta.toISOString() }
    });
  }

  getKpiPorCamion(desde: Date, hasta: Date): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/kpi-camiones`, {
      params: { desde: desde.toISOString(), hasta: hasta.toISOString() }
    });
  }

  exportarPdf(desde: Date, hasta: Date): Observable<Blob> {
    return this.http.get(`${this.api}/exportar-pdf`, {
      params: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      responseType: 'blob'
    });
  }
}

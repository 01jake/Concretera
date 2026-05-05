import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RouteInfo {
  travelMinutos: number;
  distanciaKm: number;
  polyline: string;
  direccion: string;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class MapsService {
  private api = `${environment.apiUrl}/maps`;

  constructor(private http: HttpClient) {}

  // Calcular ruta entre planta y destino (el backend llama a Google Maps)
  calcularRuta(destinoLat: number, destinoLng: number): Observable<RouteInfo> {
    return this.http.get<RouteInfo>(`${this.api}/ruta`, {
      params: {
        lat: destinoLat.toString(),
        lng: destinoLng.toString()
      }
    });
  }

  // Geocodificar dirección
  geocodificar(direccion: string): Observable<{ lat: number; lng: number; direccionFormateada: string }> {
    return this.http.get<any>(`${this.api}/geocode`, {
      params: { direccion }
    });
  }

  // Geocodificación inversa (coordenadas → dirección)
  reverseGeocode(lat: number, lng: number): Observable<{ direccion: string }> {
    return this.http.get<any>(`${this.api}/reverse-geocode`, {
      params: { lat: lat.toString(), lng: lng.toString() }
    });
  }
}

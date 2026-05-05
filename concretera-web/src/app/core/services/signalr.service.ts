import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { Truck } from '../models/truck';
import { Order } from '../models/order';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
export interface Notificacion {
  id: string;
  tipo: 'critica' | 'stock' | 'entrega' | 'info';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
}

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private trucksSubject = new BehaviorSubject<Truck[]>([]);
  private colaSubject = new BehaviorSubject<Order[]>([]);
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
private nuevaRutaSubject = new BehaviorSubject<any>(null);
private ubicacionesSubject = new BehaviorSubject<any>(null);
private mensajesSubject = new Subject<any>();
mensajes$: Observable<any> = this.mensajesSubject.asObservable();
nuevaRuta$: Observable<any> = this.nuevaRutaSubject.asObservable();
ubicaciones$: Observable<any> = this.ubicacionesSubject.asObservable();
  trucks$: Observable<Truck[]> = this.trucksSubject.asObservable();
  cola$: Observable<Order[]> = this.colaSubject.asObservable();
  connected$: Observable<boolean> = this.connectedSubject.asObservable();
  notificaciones$: Observable<Notificacion[]> = this.notificacionesSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  private normalizeStatus(status: any): string {
    const numMap: Record<number, string> = {
      0:'LIBRE', 1:'CARGANDO', 2:'EN_RUTA', 3:'DESCARGANDO', 4:'REGRESANDO', 5:'MANTENIMIENTO'
    };
    if (typeof status === 'number') return numMap[status] || 'LIBRE';
    return status;
  }

  private normalizeTruck(t: Truck): Truck {
    return { ...t, status: this.normalizeStatus(t.status as any) as any };
  }
private getMiId(): number {
  try {
    
const token = sessionStorage.getItem('token');     if (!token) return 0;
    const payload = JSON.parse(atob(token.split('.')[1]));
    // El claim NameIdentifier puede venir con diferentes keys
    return parseInt(
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      || payload['sub']
      || payload['nameid']
      || '0'
    );
  } catch { return 0; }
}
  private agregarNotificacion(n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) {
    const nueva: Notificacion = {
      ...n,
      id: Date.now().toString(),
      fecha: new Date(),
      leida: false
    };
    const current = this.notificacionesSubject.value;
    this.notificacionesSubject.next([nueva, ...current].slice(0, 50));
  }
private tipoMantLabel(tipo: any): string {
  const l: Record<string, string> = {
    '0':'Cambio de aceite','1':'Revisión de frenos','2':'Cambio de llantas',
    '3':'Revisión general','4':'Servicio mayor','5':'Otro',
    'CAMBIO_ACEITE':'Cambio de aceite','REVISION_FRENOS':'Revisión de frenos',
    'CAMBIO_LLANTAS':'Cambio de llantas','REVISION_GENERAL':'Revisión general',
    'SERVICIO_MAYOR':'Servicio mayor','OTRO':'Otro'
  };
  return l[tipo?.toString()] || tipo || 'Mantenimiento';
}
  marcarLeida(id: string) {
    const updated = this.notificacionesSubject.value.map(n =>
      n.id === id ? { ...n, leida: true } : n
    );
    this.notificacionesSubject.next(updated);
  }

  marcarTodasLeidas() {
    const updated = this.notificacionesSubject.value.map(n => ({ ...n, leida: true }));
    this.notificacionesSubject.next(updated);
  }

  limpiarNotificaciones() {
    this.notificacionesSubject.next([]);
  }
enviarUbicacion(camionId: number, lat: number, lng: number): void {
  if (this.isConnected) {
    this.hubConnection.invoke('EnviarUbicacion', camionId, lat, lng)
      .catch(err => console.error('Error enviando ubicación:', err));
  }
}
  get noLeidas(): number {
    return this.notificacionesSubject.value.filter(n => !n.leida).length;
  }

  startConnection(): Promise<void> {
    if (this.hubConnection &&
        this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      return Promise.resolve();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/despacho-hub`, {
accessTokenFactory: () => sessionStorage.getItem('token') || ''

      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Todos los eventos corren dentro de NgZone para detectar cambios automáticamente
    this.hubConnection.on('ActualizarCamiones', (trucks: Truck[]) => {
      this.ngZone.run(() => {
        this.trucksSubject.next(trucks.map(t => this.normalizeTruck(t)));
      });
    });
// Después de EntregaConfirmada, agrega:

this.hubConnection.on('NuevaRutaAsignada', (data: any) => {
  this.ngZone.run(() => {
    this.nuevaRutaSubject.next(data);
    this.agregarNotificacion({
      tipo: 'info',
      titulo: '🚛 Nueva ruta asignada',
      mensaje: `Destino: ${data.direccion} — ${data.cliente || ''}`
    });
  });
});
this.hubConnection.on('NuevoMantenimiento', (data: any) => {
  this.ngZone.run(() => {
    this.agregarNotificacion({
      tipo: 'info',
      titulo: '🔧 Mantenimiento programado',
      mensaje: `${data.camion || 'Camión'} — ${this.tipoMantLabel(data.tipo)}: ${data.descripcion}`
    });
  });
});

this.hubConnection.on('MantenimientoCompletado', (data: any) => {
  this.ngZone.run(() => {
    this.agregarNotificacion({
      tipo: 'entrega',
      titulo: '✅ Mantenimiento completado',
      mensaje: `${data.camion || 'Camión'} — ${this.tipoMantLabel(data.tipo)}`
    });
  });
});

this.hubConnection.on('AlertaMantenimiento', (data: any) => {
  this.ngZone.run(() => {
    const msg = data.diasRestantes <= 0
      ? `VENCIDO — ${data.camion}: ${data.descripcion}`
      : `En ${data.diasRestantes} días — ${data.camion}: ${data.descripcion}`;
    this.agregarNotificacion({
      tipo: data.diasRestantes <= 0 ? 'critica' : 'stock',
      titulo: '⚙️ Mantenimiento próximo',
      mensaje: msg
    });
  });
});
this.hubConnection.on('UbicacionConductor', (data: any) => {
  this.ngZone.run(() => {
    this.ubicacionesSubject.next(data);
  });
});
    this.hubConnection.on('ActualizarCamion', (truck: Truck) => {
      this.ngZone.run(() => {
        const normalized = this.normalizeTruck(truck);
        const current = this.trucksSubject.value;
        const updated = current.map(t => t.id === normalized.id ? normalized : t);
        this.trucksSubject.next([...updated]);
      });
    });

    this.hubConnection.on('ActualizarCola', (cola: Order[]) => {
      this.ngZone.run(() => this.colaSubject.next(cola));
    });

    this.hubConnection.on('NuevoPedido', (order: Order) => {
      this.ngZone.run(() => {
        const current = this.colaSubject.value;
        this.colaSubject.next([...current, order]);
        this.agregarNotificacion({
          tipo: 'info',
          titulo: 'Nuevo pedido en cola',
          mensaje: 'Pedido agregado a la cola de despacho'
        });
      });
    });

    this.hubConnection.on('IncidenciaCritica', (data: any) => {
  this.ngZone.run(() => {
    const tipos: Record<string, string> = {
      '0':'Llanta ponchada','1':'Accidente','2':'Demora en obra',
      '3':'Falla mecánica','4':'Problema con cliente','5':'Otro',
      'LLANTA_PONCHADA':'Llanta ponchada','ACCIDENTE':'Accidente',
      'DEMORA_EN_OBRA':'Demora en obra','FALLA_MECANICA':'Falla mecánica',
      'PROBLEMA_CLIENTE':'Problema con cliente','OTRO':'Otro'
    };
    const sevs: Record<string, string> = {
      '0':'Baja','1':'Media','2':'Alta','3':'Crítica',
      'BAJA':'Baja','MEDIA':'Media','ALTA':'Alta','CRITICA':'Crítica'
    };
    const tipo = tipos[data.tipo?.toString()] || 'Incidencia';
    const sev  = sevs[data.severidad?.toString()] || '';
    const esCritica = data.severidad?.toString() === 'CRITICA' || data.severidad === 3;

    this.agregarNotificacion({
      tipo: esCritica ? 'critica' : 'info',
      titulo: `${esCritica ? '🚨' : '⚠️'} ${tipo}`,
      mensaje: `${sev} — ${data.descripcion || ''} (Camión #${data.camionId})`
    });
  });
});

    this.hubConnection.on('AlertaStockBajo', (data: any) => {
      this.ngZone.run(() => {
        this.agregarNotificacion({
          tipo: 'stock',
          titulo: '⚠️ Stock bajo',
          mensaje: `Quedan ${data.m3Disponibles} m³ en planta (mínimo: ${data.alertaMinima} m³)`
        });
      });
    });

    this.hubConnection.on('EntregaConfirmada', (data: any) => {
      this.ngZone.run(() => {
        this.agregarNotificacion({
          tipo: 'entrega',
          titulo: '✅ Entrega confirmada',
          mensaje: `${data.cliente || 'Cliente'} — ${data.camion || ''}`
        });
      });
    });

    this.hubConnection.onreconnected(() => {
      this.ngZone.run(() => {
        this.connectedSubject.next(true);
        this.agregarNotificacion({
          tipo: 'info',
          titulo: 'Conexión restaurada',
          mensaje: 'SignalR reconectado exitosamente'
        });
      });
    });
this.hubConnection.on('NuevoMensaje', (data: any) => {
  this.ngZone.run(() => {
    this.mensajesSubject.next(data);

    const miId = this.getMiId();
    if (data.destinatarioId !== miId) return;

    this.agregarNotificacion({
      tipo: 'info',
      titulo: `💬 ${data.remitente?.nombre || 'Mensaje nuevo'}`,
      mensaje: data.texto || '📷 Foto'
    });
  });
});

    this.hubConnection.onclose(() => {
      this.ngZone.run(() => this.connectedSubject.next(false));
    });

    return this.hubConnection
      .start()
      .then(() => {
        this.ngZone.run(() => this.connectedSubject.next(true));
        console.log('SignalR conectado');
      })
      .catch(err => {
        this.ngZone.run(() => this.connectedSubject.next(false));
        console.error('SignalR error:', err);
      });
      

  }

  despacharCamion(camionId: number, orderId: number): Promise<void> {
    return this.hubConnection.invoke('DespacharCamion', camionId, orderId);
  }

  liberarCamion(camionId: number): Promise<void> {
    return this.hubConnection.invoke('LiberarCamion', camionId);
  }

  stopConnection(): Promise<void> {
    return this.hubConnection?.stop();
  }

  get isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
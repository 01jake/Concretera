export enum TruckStatus {
  LIBRE = 'LIBRE',
  CARGANDO = 'CARGANDO',
  EN_RUTA = 'EN_RUTA',
  DESCARGANDO = 'DESCARGANDO',
  REGRESANDO = 'REGRESANDO',
  MANTENIMIENTO = 'MANTENIMIENTO'
}

export interface Truck {
  id: number;
  nombre: string;
  placas: string;
  status: TruckStatus;
  conductorId?: number;
  conductorNombre?: string;
  destinoNombre?: string;
  destinoDireccion?: string;
  destinoLat?: number;
  destinoLng?: number;
  travelMinutos: number;
  descargaMinutos: number;
  cargaInicio?: Date;
  cargaFin?: Date;
  llegadaEstimada?: Date;
  descargaFin?: Date;
  regresoFin?: Date;
  color: string;
  capacidadM3: number;
  ultimaActualizacion: Date;
}

export interface TruckStatusUpdate {
  truckId: number;
  status: TruckStatus;
  timestamp: Date;
  lat?: number;
  lng?: number;
}

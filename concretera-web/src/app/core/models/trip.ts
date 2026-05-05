export interface Trip {
  id: number;
  camionId: number;
  camionNombre: string;
  conductorId: number;
  conductorNombre: string;
  clienteId: number;
  clienteNombre: string;
  orderId: number;
  direccionDestino: string;
  lat: number;
  lng: number;
  m3Entregados: number;
  distanciaKm: number;
  travelMinutosIda: number;
  travelMinutosVuelta: number;
  descargaMinutos: number;
  cargaMinutos: number;
  tiempoTotalMinutos: number;
  fechaInicio: Date;
  fechaFin?: Date;
  costoCombustible?: number;
  costoTotal?: number;
  tarifaM3?: number;
  ingresos?: number;
  utilidad?: number;
  firmaDigitalUrl?: string;
  fotoEntregaUrl?: string;
  notas?: string;
}

export interface TripSummary {
  totalViajes: number;
  totalM3: number;
  totalKm: number;
  tiempoPromedioMin: number;
  ingresosTotales: number;
  costosTotales: number;
  utilidadTotal: number;
}

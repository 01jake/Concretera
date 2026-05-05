export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO'
}

export interface Order {
  id: number;
  clienteId: number;
  clienteNombre: string;
  direccion: string;
  lat: number;
  lng: number;
  m3Solicitados: number;
  status: OrderStatus;
  camionId?: number;
  travelMinutos: number;
  descargaMinutos: number;
  fechaSolicitada: Date;
  fechaAsignada?: Date;
  fechaEntrega?: Date;
  notas?: string;
  firmaDigitalUrl?: string;
  fotoEntregaUrl?: string;
}

export interface CreateOrderDto {
  clienteId: number;
  direccion: string;
  lat: number;
  lng: number;
  m3Solicitados: number;
  travelMinutos: number;
  descargaMinutos: number;
  notas?: string;
}

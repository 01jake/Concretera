export interface Client {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  direccionPrincipal: string;
  lat: number;
  lng: number;
  travelMinutosDefault: number;
  activo: boolean;
  totalViajes: number;
  fechaRegistro: Date;
}

export interface CreateClientDto {
  nombre: string;
  telefono: string;
  email?: string;
  direccionPrincipal: string;
  lat: number;
  lng: number;
  travelMinutosDefault: number;
}

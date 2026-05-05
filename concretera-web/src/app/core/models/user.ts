export enum UserRole {
  ADMIN = 'ADMIN',
  DESPACHADOR = 'DESPACHADOR',
  CONDUCTOR = 'CONDUCTOR'
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  camionAsignadoId?: number;
  activo: boolean;
  token?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expira: Date;
}

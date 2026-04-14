import { IProceso } from './proceso';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  idRol: string;
  idProceso: string;
  idConsejo: string;
  tipoConsejo: string;
  tipoConsejoDesc: string;
  claveConsejo: string;
  consejo: string;
  modulos: string[];
  proceso?: IProceso | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
}

export type TTipoConsejo = 'distrital' | 'municipal';

export interface IEleccion {
  consejo_tipo: 'D' | 'M';
  consejo_tipo_text: string;
}

export interface IProceso {
  id: number;
  tipo: string;
  anio: number;
  fecha: string;
  status: string;
  fecha_registro: string;
  consejo_distrital: boolean;
  consejo_municipal: boolean;
  modo: string;
  elecciones: IEleccion[];
}

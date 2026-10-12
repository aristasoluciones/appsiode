/** Integrante del consejo según SICE: consejerías, presidencia y secretaría técnica. */
export interface IIntegranteConsejo {
  id: number;
  id_cargo: number;
  /** Grupo del cargo como lo entrega SICE; sirve para separar presidencia y secretaría. */
  grupo_cargo: string;
  cargo: string;
  nombre: string;
  apellidos: string;
  genero: string | null;
}

/** Representación de partido aprobada en RPP; las rutas ya vienen como URL completa. */
export interface IRepresentacionPartido {
  id_representante: number;
  id_partido: number;
  partido: string;
  /** URL completa del logo del partido. */
  partido_imagen: string | null;
  nombre: string;
  apellidos: string;
  cargo: string;
  genero: string | null;
  nombramiento_no: string | null;
  nombramiento_fecha: string | null;
  /** URL completa del documento del nombramiento. */
  nombramiento_url: string | null;
  nombramiento_status: string | null;
  telefono: string | null;
  celular: string | null;
  correo: string | null;
  domicilio: string | null;
}

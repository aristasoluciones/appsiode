// Tipos de datos
export type ConsejoType = 'distrital' | 'municipal';

export interface Session {
  id: string;
  number: string;
  type: 'ESPECIAL' | 'EXTRAORDINARIA' | 'ORDINARIA' | 'URGENTE';
  sessionNumber?: string;
  status: 'CONCLUIDA' | 'EN_PROCESO' | 'PROGRAMADA' | 'CON_DEMORA';
  scheduledDate: string;
  startDate: string;
  endDate: string;
  incidents: number;
  councilId: string;
  councilName: string;
  councilType: ConsejoType;
  documents?: string;
}

export interface Councilor {
  cargo: string;
  nombre: string;
  presente: boolean;
}

export interface PoliticalRepresentative {
  partido: string;
  cargo: string;
  nombre: string;
  presente: boolean;
  telefono?: string;
  correo?: string;
  domicilio?: string;
  referencia?: string;
}

export interface SessionDetail extends Session {
  councilors: Councilor[];
  politicalReps: PoliticalRepresentative[];
  agendaPoints: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

export interface Council {
  id: string;
  name: string;
  type: ConsejoType;
  shortCode: string;
  sessionsCount: number;
  sessions: Session[];
}

// MOCK DATA - Consejos Distritales
const districtals: Council[] = [
  {
    id: '01',
    name: 'TUXTLA GUTIÉRREZ',
    type: 'distrital',
    shortCode: 'CD',
    sessionsCount: 8,
    sessions: [
      {
        id: '1',
        number: 'SEGUNDA',
        type: 'ESPECIAL',
        sessionNumber: 'SEGUNDA',
        status: 'CONCLUIDA',
        scheduledDate: '2024/06/04 08:00 AM',
        startDate: '2024/06/04 08:09 AM',
        endDate: '2024/06/11 15:31 PM',
        incidents: 0,
        councilId: '01',
        councilName: 'TUXTLA GUTIÉRREZ',
        councilType: 'distrital',
      },
      {
        id: '2',
        number: 'PRIMERA',
        type: 'EXTRAORDINARIA',
        sessionNumber: 'PRIMERA',
        status: 'CONCLUIDA',
        scheduledDate: '2024/06/03 10:30 AM',
        startDate: '2024/06/11 15:31 PM',
        endDate: '2024/06/11 15:31 PM',
        incidents: 0,
        councilId: '01',
        councilName: 'TUXTLA GUTIÉRREZ',
        councilType: 'distrital',
      },
    ],
  },
  {
    id: '02',
    name: 'TUXTLA GUTIÉRREZ',
    type: 'distrital',
    shortCode: 'CD',
    sessionsCount: 8,
    sessions: [],
  },
  {
    id: '03',
    name: 'CHIAPA DE CORZO',
    type: 'distrital',
    shortCode: 'CD',
    sessionsCount: 8,
    sessions: [],
  },
  {
    id: '04',
    name: 'YAJALÓN',
    type: 'distrital',
    shortCode: 'CD',
    sessionsCount: 9,
    sessions: [],
  },
  {
    id: '05',
    name: 'SAN CRISTÓBAL DE LAS CASAS',
    type: 'distrital',
    shortCode: 'CD',
    sessionsCount: 8,
    sessions: [
      {
        id: 'cd5-1',
        number: 'SEGUNDA',
        type: 'URGENTE',
        sessionNumber: 'SEGUNDA',
        status: 'CONCLUIDA',
        scheduledDate: '2024/06/04 08:00 AM',
        startDate: '2024/06/04 14:20 PM',
        endDate: '2024/06/07 23:05 PM',
        incidents: 0,
        councilId: '05',
        councilName: 'SAN CRISTÓBAL DE LAS CASAS',
        councilType: 'distrital',
      },
    ],
  },
];

// MOCK DATA - Consejos Municipales
const municipals: Council[] = [
  {
    id: '124',
    name: 'ACACOYAGUA',
    type: 'municipal',
    shortCode: 'CM',
    sessionsCount: 5,
    sessions: [],
  },
  {
    id: '125',
    name: 'ACALÁ',
    type: 'municipal',
    shortCode: 'CM',
    sessionsCount: 5,
    sessions: [],
  },
  {
    id: '126',
    name: 'ACAPETAHUA',
    type: 'municipal',
    shortCode: 'CM',
    sessionsCount: 5,
    sessions: [],
  },
];

// Obtener todos los consejos
export function getAllCouncils(): Council[] {
  return [...districtals, ...municipals];
}

// Obtener consejo por tipo e id
export function getCouncilByTypeAndId(type: string, id: string): Council | undefined {
  const allCouncils = getAllCouncils();
  if (type === 'd') {
    return allCouncils.find(c => c.type === 'distrital' && c.id === id);
  } else if (type === 'm') {
    return allCouncils.find(c => c.type === 'municipal' && c.id === id);
  }
  return undefined;
}

// Obtener detalle de sesión
export function getSessionDetail(councilId: string, sessionId: string): SessionDetail | undefined {
  const council = getAllCouncils().find(c => c.id === councilId);
  const session = council?.sessions.find(s => s.id === sessionId);

  if (!session) return undefined;

  return {
    ...session,
    councilors: [
      { cargo: 'PRESIDENTE(A)', nombre: 'SERGIO HERIBERTO VELASCO JIMENEZ', presente: true },
      {
        cargo: 'SECRETARIO(O) TÉCNICO(A)',
        nombre: 'MARÍA VICTORIA BORRAZ GONZÁLEZ',
        presente: true,
      },
      {
        cargo: 'CONSEJERO(A) PROPIETARIO(A) 1',
        nombre: 'KATIA JAQUELINE TRUJILLO HERNANDEZ',
        presente: true,
      },
      {
        cargo: 'CONSEJERO(A) PROPIETARIO(A) 2',
        nombre: 'OLEGARIO PEREZ JIMENEZ',
        presente: true,
      },
      {
        cargo: 'CONSEJERO(A) PROPIETARIO(A) 3',
        nombre: 'MARIA SARA RAMIREZ MAZARIEGOS',
        presente: false,
      },
      {
        cargo: 'CONSEJERO(A) PROPIETARIO(A) 4',
        nombre: 'PEDRO LUNA MENDEZ',
        presente: false,
      },
      {
        cargo: 'CONSEJERO(A) SUPLENTE 1',
        nombre: 'NALLEY RUBI HERNANDEZ MORALES',
        presente: true,
      },
      {
        cargo: 'CONSEJERO(A) SUPLENTE 2',
        nombre: 'MAYULI AQUINO GONZALEZ',
        presente: false,
      },
      {
        cargo: 'CONSEJERO(A) SUPLENTE 3',
        nombre: 'ANABEL RIVAS VELAZQUEZ',
        presente: false,
      },
    ],
    politicalReps: [
      {
        partido: 'PAN',
        cargo: 'PROPIETARIO',
        nombre: 'FRANCISCO ERNESTO BERMUDEZ NAVARRO',
        presente: true,
        telefono: '96767910S2',
        correo: 'bernaver@hotmail.com',
        domicilio: 'Privada Romerillo número. 26, Barrio de Fátima, San Cristóbal de Las Casas',
        referencia: '#29264',
      },
      {
        partido: 'PAN',
        cargo: 'SUPLENTE',
        nombre: 'RAUL ALEJANDRO VILLAFUERTE ESPINOZA',
        presente: false,
        telefono: '9676797433',
        correo: 'alexvillafuerte95@gmail.com',
        domicilio: 'Calle, Álvaro Obregón num. 7-B, Barrio Santa Lucia., San Cristóbal de Las Casas',
        referencia: '#29250',
      },
      {
        partido: 'PAN',
        cargo: 'SUPLENTE',
        nombre: 'JOSUE DAMIAN SANCHEZ CHILEL',
        presente: true,
        telefono: '9671032376',
        correo: 'jodasacii@gmail.com',
        domicilio: 'PRIV DEL SOL 7 A, FRACC BISMARK, San Cristóbal de Las Casas',
        referencia: '#29267',
      },
    ],
    agendaPoints: [
      { id: '1', title: 'Lectura de orden del día', type: 'Ordinario' },
      { id: '2', title: 'Aprobación de actas anteriores', type: 'Ordinario' },
    ],
  };
}

// Estadísticas (Indicadores)
export interface Statistics {
  programadas: number;
  conDemora: number;
  enProceso: number;
  concluidas: number;
  detailProgramadas: Array<{ type: string; code: string; cantidad: number }>;
  detailConDemora: Array<{ type: string; code: string; cantidad: number }>;
  detailEnProceso: Array<{ type: string; code: string; cantidad: number }>;
  detailConcluidas: Array<{ type: string; code: string; cantidad: number; councils?: Array<{ code: string; number: number; name: string }> }>;
}

export function getStatistics(councilId?: string): Statistics {
  // Si no hay councilId, retorna estadísticas globales
  if (!councilId) {
    return {
      programadas: 0,
      conDemora: 0,
      enProceso: 0,
      concluidas: 1164,
      detailProgramadas: [
        { type: 'CD', code: '0', cantidad: 0 },
        { type: 'CM', code: '0', cantidad: 0 },
      ],
      detailConDemora: [
        { type: 'CD', code: '0', cantidad: 0 },
        { type: 'CM', code: '0', cantidad: 0 },
      ],
      detailEnProceso: [
        { type: 'CD', code: '0', cantidad: 0 },
        { type: 'CM', code: '0', cantidad: 0 },
      ],
      detailConcluidas: [
        {
          type: 'CD',
          code: '200',
          cantidad: 200,
          councils: [
            { code: 'CD', number: 1, name: 'TUXTLA GUTIÉRREZ' },
            { code: 'CD', number: 2, name: 'TUXTLA GUTIÉRREZ' },
            { code: 'CD', number: 3, name: 'CHIAPA DE CORZO' },
            { code: 'CD', number: 4, name: 'YAJALÓN' },
            { code: 'CD', number: 5, name: 'SAN CRISTÓBAL DE LAS CASAS' },
            { code: 'CD', number: 6, name: 'COMITÁN DE DOMINGUEZ' },
            { code: 'CD', number: 7, name: 'OCOSINGO' },
            { code: 'CD', number: 8, name: 'SIMOJOVEL' },
            { code: 'CD', number: 9, name: 'PALENQUE' },
            { code: 'CD', number: 10, name: 'LA TRINITARIA' },
            { code: 'CD', number: 11, name: 'BOCHIL' },
            { code: 'CD', number: 12, name: 'PICHUCALCO' },
          ],
        },
        { type: 'CM', code: '964', cantidad: 964 },
      ],
    };
  }

  // Estadísticas por consejo específico
  const council = getAllCouncils().find(c => c.id === councilId);
  if (!council) {
    return {
      programadas: 0,
      conDemora: 0,
      enProceso: 0,
      concluidas: 0,
      detailProgramadas: [],
      detailConDemora: [],
      detailEnProceso: [],
      detailConcluidas: [],
    };
  }

  const sessions = council.sessions;
  const programadas = sessions.filter(s => s.status === 'PROGRAMADA').length;
  const conDemora = sessions.filter(s => s.status === 'CON_DEMORA').length;
  const enProceso = sessions.filter(s => s.status === 'EN_PROCESO').length;
  const concluidas = sessions.filter(s => s.status === 'CONCLUIDA').length;

  return {
    programadas,
    conDemora,
    enProceso,
    concluidas,
    detailProgramadas: [
      { type: council.type === 'distrital' ? 'CD' : 'CM', code: council.id, cantidad: programadas },
    ],
    detailConDemora: [
      { type: council.type === 'distrital' ? 'CD' : 'CM', code: council.id, cantidad: conDemora },
    ],
    detailEnProceso: [
      { type: council.type === 'distrital' ? 'CD' : 'CM', code: council.id, cantidad: enProceso },
    ],
    detailConcluidas: [
      { type: council.type === 'distrital' ? 'CD' : 'CM', code: council.id, cantidad: concluidas },
    ],
  };
}

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  LockOpen,
  Mail,
  MapPin,
  Minus,
  Pencil,
  Phone,
  SearchX,
  ThumbsDown,
  ThumbsUp,
  Vote,
  Smartphone,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/common/container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSesionesConsejo } from '../../components/sesiones-consejo-data';
import { useSesionDetalle, useRepresentantesExternos, useGuardarAsistencia, useIniciarSesion, 
        useTerminarSesion, useAgregarAsuntoGeneral, type IRepresentanteExternoAPI, type ITerminarRepresentantePayload } from './session-detail-data';
import { IncidenciasCard } from './incidencias-card';
import { ExpedientesCard } from './expedientes-card';
import { VotacionDialog } from './votacion-dialog';
import { SesionEdicion } from './sesion-edicion';
import type { ISesionDetalleAPI, IRepresentanteNorm, IConsejeroExterno } from '@/types/sesiones';

import { useAuth } from '@/providers/auth-provider';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  type: string;
  id: string;
  sessionId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day    = String(d.getDate()).padStart(2, '0');
  const mes    = MESES[d.getMonth()];
  const year   = d.getFullYear();
  const hours  = d.getHours();
  const ampm   = hours >= 12 ? 'PM' : 'AM';
  const hh     = String(hours % 12 || 12).padStart(2, '0');
  const mm     = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mes} ${year}, ${hh}:${mm} ${ampm}`;
}

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  CONCLUIDA:  'success',
  PROCESO: 'warning',
  DEMORA: 'destructive',
  PROGRAMADA: 'info',
};

const statusVariant = (s: string): BadgeVariant => STATUS_VARIANT[s] ?? 'secondary';
const statusLabel   = (s: string): string => s.replaceAll('_', ' ');

// ─── Consejeros externos (API externa — mock hasta integración) ───────────────

const ACTIVE_STATUSES = new Set(['PROCESO', 'DEMORA', 'PROGRAMADA']);



/** TODO: reemplazar con llamada a API externa cuando esté disponible */
const MOCK_CONSEJEROS_ELECTORALES: IConsejeroExterno[] = [
  {
    consejo_tipo: 'M', consejo_clave: 66, consejo: 'PANTELHÓ',
    id: 17, grupo_cargo: 'PRESIDENTA(E)', id_cargo: 1,
    nombre: 'PATRICIA ELIZABETH', apellidos: 'RAMOS GUTIERREZ',
    genero: 'M', cargo: 'PRESIDENCIA',
  },
  {
    consejo_tipo: 'M', consejo_clave: 66, consejo: 'PANTELHÓ',
    id: 18, grupo_cargo: 'CONSEJERO(A)', id_cargo: 2,
    nombre: 'JUAN CARLOS', apellidos: 'MÉNDEZ TORRES',
    genero: 'H', cargo: 'CONSEJERÍA ELECTORAL',
  },
  {
    consejo_tipo: 'M', consejo_clave: 66, consejo: 'PANTELHÓ',
    id: 19, grupo_cargo: 'CONSEJERO(A)', id_cargo: 2,
    nombre: 'ANA LUCÍA', apellidos: 'PÉREZ GÓMEZ',
    genero: 'M', cargo: 'CONSEJERÍA ELECTORAL',
  },
  {
    consejo_tipo: 'M', consejo_clave: 66, consejo: 'PANTELHÓ',
    id: 20, grupo_cargo: 'SECRETARIO(A)', id_cargo: 3,
    nombre: 'ROBERTO', apellidos: 'HERNÁNDEZ RUIZ',
    genero: 'H', cargo: 'SECRETARÍA',
  },
];

// ─── Representantes PP: tipos y normalización ─────────────────────────────────

function normalizeRepresentante(r: IRepresentanteExternoAPI): IRepresentanteNorm {
  const appt = r.appointments?.[0];
  return {
    id_representante: r.id,
    id_partido: r.party_id,
    partyName: r.party?.name ?? '',
    partyImagePath: r.party?.imagePath ?? null,
    nombre: r.name,
    apellidos: [r.paternal, r.maternal].filter(Boolean).join(' '),
    cargo: r.charge,
    genero: r.sex,
    asistencia: false,
    nombramiento_no: appt?.invoice ?? null,
    nombramiento_fecha: appt?.expedition ?? null,
    nombramiento_url: appt?.documentPath ?? null,
    nombramiento_status: appt?.status ?? null,
    telefono: r.phone ?? null,
    celular: r.mobilePhone ?? null,
    correo: r.email ?? null,
    domicilio: r.address ?? null,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SessionDetailPage({ type, id, sessionId }: Props) {
  const { data, isLoading, isError, refetch } = useSesionDetalle(sessionId);
  const { data: consejoData } = useSesionesConsejo(type, id);
  const { mutate: iniciarSesion, isPending: iniciando } = useIniciarSesion(sessionId);
  const { mutate: terminarSesion, isPending: terminando } = useTerminarSesion(sessionId);
  const [confirmarInicio, setConfirmarInicio] = useState(false);
  const [confirmarTermino, setConfirmarTermino] = useState(false);
  const [asistenciaExtOverrides, setAsistenciaExtOverrides] = useState<Record<number, boolean>>({});
  const [votacionPunto, setVotacionPunto] = useState<ISesionDetalleAPI['pod'][number] | null>(null);
  const [nuevoAsunto, setNuevoAsunto] = useState('');
  const { hasPermission } = useAuth();
  const [modoEdicion, setModoEdicion] = useState(false);

  const session       = data?.session ?? null;
  const notFound      = data?.notFound ?? false;
  const tipoLabel     = type === 'd' ? 'Distrital' : 'Municipal';
  const consejMeta     = consejoData?.meta?.consejo;
  const consejoNombre  = consejMeta?.consejo        ?? `Consejo ${tipoLabel} ${id}`;
  const consejoClave   = consejMeta?.clave_consejo   ?? id;
  const consejoTipoDesc = consejMeta?.tipo_consejo_desc ?? tipoLabel;

  const { data: repData = EMPTY_REPS, isLoading: loadingExt, isError: errorExt } = useRepresentantesExternos(type as 'd' | 'm', String(consejoClave));
  const representantesNorm = useMemo(() => repData.map(normalizeRepresentante), [repData]);

  // Permisos de acceso para acciones específicas
  const canIniciarSesion = hasPermission('sesionesdelconsejo.sesiones.iniciar'); 
  const canTerminarSesion = hasPermission('sesionesdelconsejo.sesiones.terminar'); 
  const canAgregarActualizarAsistencia = hasPermission('sesionesdelconsejo.sesiones.actualizarasistencia');
  const canEditarOrdenDia = hasPermission('sesionesdelconsejo.pod.editar');
  const canEliminarOrdenDia = hasPermission('sesionesdelconsejo.sesiones.eliminarpod');
  const canAgregarAsuntoGeneral = hasPermission('sesionesdelconsejo.asuntos.insert');


  const handleIniciarSesion = () => {
    iniciarSesion({
      consejeros: MOCK_CONSEJEROS_ELECTORALES.map((c) => ({
        cargo: c.cargo,
        genero: c.genero,
        nombre: c.nombre,
        apellidos: c.apellidos,
        id_cargo: c.id_cargo,
      })),
    });
  };

  const handleAbrirVotacion = (point: ISesionDetalleAPI['pod'][number]) => setVotacionPunto(point);
  const { mutate: agregarAsunto, isPending: guardandoAsunto } = useAgregarAsuntoGeneral(sessionId);
  const handleGuardarAsunto = () => {
    const texto = nuevoAsunto.trim();
    if (!texto || texto.length > 2000) return;
    agregarAsunto(texto, { onSuccess: () => setNuevoAsunto('') });
  };

  const handleTerminarSesion = () => {
    terminarSesion({
      representantes: representantesNorm.map<ITerminarRepresentantePayload>((r) => ({
        id_partido: r.id_partido,
        id_representante: r.id_representante,
        nombre: r.nombre,
        apellidos: r.apellidos,
        cargo: r.cargo,
        genero: r.genero,
        nombramiento_no: r.nombramiento_no,
        nombramiento_fecha: r.nombramiento_fecha,
        nombramiento_url: r.nombramiento_url,
        nombramiento_status: r.nombramiento_status,
        asistencia: asistenciaExtOverrides[r.id_representante] ?? false,
        domicilio: r.domicilio,
        tel_casa: r.telefono,
        tel_cel: r.celular,
        correo: r.correo,
      })),
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <Container>
          <div className="flex items-center justify-between py-3">
            <Skeleton className="h-4 w-72 animate-pulse motion-reduce:animate-none" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="h-9 w-28 animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        </Container>
        <Container>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-28 w-full rounded-xl animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-9 w-80 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-72 w-full rounded-xl animate-pulse motion-reduce:animate-none" />
          </div>
        </Container>
      </>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <SearchX className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Sesión no encontrada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Verifica el identificador e intenta nuevamente.
          </p>
          <Button variant="outline" asChild>
            <Link href={`/sesiones/${type}/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </Container>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !session) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Error al cargar la sesión
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No se pudo obtener la información. Intenta nuevamente.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </Container>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Breadcrumb + acciones ───────────────────────────────────────── */}
      <Container>
        <div className="flex items-center justify-between py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/sesiones">Sesiones</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/sesiones/${type}/${id}`}>
                    Consejos {consejoTipoDesc} {consejoClave}. {consejoNombre}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{session.tipo} {session.noSesion}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/sesiones/${type}/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Reporte
            </Button>
            {(session.status === 'DEMORA' || session.status === 'PROGRAMADA') && (
              <Button
                size="sm"
                variant={modoEdicion ? 'primary' : 'outline'}
                onClick={() => setModoEdicion((prev) => !prev)}
              >
                {modoEdicion ? (
                  <><X className="h-4 w-4" /> Cerrar edición</>
                ) : (
                  <><Pencil className="h-4 w-4" /> Editar</>
                )}
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <Container>
        <div className="flex flex-col gap-5">

          {/* ── Modo edición ──────────────────────────────────────────────── */}
          {modoEdicion && (
            <SesionEdicion
              session={session}
              idSesion={sessionId}
              canEditarOrdenDia={canEditarOrdenDia}
              canEliminarOrdenDia={canEliminarOrdenDia}
            />
          )}

          {/* ── Resumen de sesión ─────────────────────────────────────────── */}
          {!modoEdicion && <Card className="overflow-hidden">
            {iniciando && (
              <div className="h-1 w-full bg-primary/20 overflow-hidden">
                <div className="h-full bg-primary animate-[progress_1.4s_ease-in-out_infinite]" />
              </div>
            )}
            <CardContent className="p-5">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Fecha programada
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatFecha(session.fechaProgramada)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Fecha inicio
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatFecha(session.fechaInicio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Fecha conclusión
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatFecha(session.fechaConclusion)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Estatus
                    </dt>
                    <dd>
                      <Badge variant={statusVariant(session.status)} appearance="light" size="sm">
                        {statusLabel(session.statusText)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Tipo
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {session.tipo}
                    </dd>
                  </div>
                   <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      No. de sesión
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {session.noSesion}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Documentos
                    </dt>
                    <dd>
                      {session.url ? (
                        <a
                          href={session.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Descargar
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin documento</span>
                      )}
                    </dd>
                  </div>
                </dl>
            </CardContent>
            {((session.status === 'PROGRAMADA' || session.status === 'DEMORA') && canIniciarSesion) && (
              <div className="px-5 pb-5 flex justify-start">
                <Button
                  size="sm"
                  disabled={iniciando}
                  onClick={() => setConfirmarInicio(true)}
                >
                  {iniciando ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando...</>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </div>
            )}
            {(session.status === 'PROCESO' && canTerminarSesion) && (
              <div className="px-5 pb-5 flex justify-start">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={terminando}
                  onClick={() => setConfirmarTermino(true)}
                >
                  {terminando ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Terminando...</>
                  ) : (
                    'Terminar Sesión'
                  )}
                </Button>
              </div>
            )}

            <AlertDialog open={confirmarInicio} onOpenChange={setConfirmarInicio}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Iniciar esta sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás a punto de iniciar la sesión. Esta acción{' '}
                    <span className="font-semibold text-destructive">no es reversible</span>;
                    una vez iniciada no podrás regresar al estado anterior.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleIniciarSesion}>
                    Sí, iniciar sesión
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmarTermino} onOpenChange={setConfirmarTermino}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Terminar esta sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ests a punto de concluir la sesión. Esta acción{' '}
                    <span className="font-semibold text-destructive">no es reversible</span>;
                    una vez terminada no podrás regresar al estado anterior. Asegurese de haber registrado correctamente la asistencia de los representantes antes de confirmar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleTerminarSesion}
                  >Sí, terminar sesión</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>}

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          {!modoEdicion && <Tabs defaultValue="asistencia">
            <TabsList variant="line">
              <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
              <TabsTrigger value="pod">Puntos del orden del día</TabsTrigger>
              <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
              <TabsTrigger value="expediente">Expedientes</TabsTrigger>
            </TabsList>

            {/* ── Tab: Asistencia ─────────────────────────────────────────── */}
            <TabsContent value="asistencia">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Consejeros Electorales */}
                <ConsejerosAsistenciaCard
                  status={session.status}
                  asistencia={session.asistencia}
                  sessionId={sessionId}
                  canAgregarActualizarAsistencia={canAgregarActualizarAsistencia}
                />

                {/* Representaciones de Partidos Políticos */}
                <RepresentacionesPPCard
                  status={session.status}
                  asistenciaPP={session.asistenciaPP}
                  tipo={type as 'd' | 'm'}
                  idConsejo={String(consejoClave)}
                  asistenciaExtOverrides={asistenciaExtOverrides}
                  onToggleExt={(id) => setAsistenciaExtOverrides((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }))}
                  representantes={representantesNorm}
                  loadingExt={loadingExt}
                  errorExt={errorExt}
                />

              </div>
            </TabsContent>

            {/* ── Tab: Orden del día ──────────────────────────────────────── */}
            <TabsContent value="pod">
              <Card>
                <CardHeader>
                  <CardTitle>Puntos del Orden del Día</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {session.pod.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-7 w-7 text-gray-400" />}
                      title="Sin puntos del orden del día"
                      description="No hay puntos registrados para esta sesión."
                    />
                  ) : (
                    <ol className="divide-y divide-border">
                      {session.pod.map((point) => {
                        const esAprobacion = point.tipo === 'APROBACION';
                        const readonly = session.status != 'PROCESO';
                        const totalVotos = point.votos_afavor + point.votos_encontra + point.votos_abstencion;
                        return (
                          <li
                            key={`${point.id_punto}-${point.id_subpunto}`}
                            className="flex items-start gap-3 px-5 py-4"
                          >
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground mt-0.5">
                              {point.id_punto}
                            </span>
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:gap-6">
                              {/* Descripción + badge */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-relaxed text-justify">
                                  {point.descripcion}
                                </p>
                              </div>
                              {/* Resumen de votación */}
                              <div className="mt-3 sm:mt-0 sm:shrink-0 flex flex-col gap-1 sm:min-w-[130px]">
                                {esAprobacion ? (
                                  <>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                                      <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
                                      {point.votos_afavor} a favor
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-destructive font-medium">
                                      <ThumbsDown className="h-3.5 w-3.5 shrink-0" />
                                      {point.votos_encontra} en contra
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                                      <Minus className="h-3.5 w-3.5 shrink-0" />
                                      {point.votos_abstencion} abstención
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No aplica</span>
                                )}
                              </div>
                            </div>
                            {esAprobacion && !readonly && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 mt-0.5"
                                onClick={() => handleAbrirVotacion(point)}
                              >
                                <Vote className="h-3.5 w-3.5" />
                                Votar
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {session.status === 'PROCESO' && (
                    <div className="px-5 py-4 border-t border-border space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agregar asunto general</p>
                      <Textarea
                        placeholder="Describe el nuevo punto del orden del día…"
                        maxLength={2000}
                        rows={3}
                        value={nuevoAsunto}
                        onChange={(e) => setNuevoAsunto(e.target.value)}
                        disabled={guardandoAsunto}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{nuevoAsunto.length}/2000</span>
                        <Button
                          size="sm"
                          disabled={!nuevoAsunto.trim() || nuevoAsunto.length > 2000 || guardandoAsunto}
                          onClick={handleGuardarAsunto}
                        >
                          {guardandoAsunto && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {votacionPunto && (
              <VotacionDialog
                open={!!votacionPunto}
                onOpenChange={(v) => { if (!v) setVotacionPunto(null); }}
                punto={votacionPunto}
                consejeros={session.asistencia}
                idSesion={sessionId}
              />
            )}

            {/* ── Tab: Incidencias ────────────────────────────────────────── */}
            <TabsContent value="incidencias">
              <IncidenciasCard
                idSesion={sessionId}
                readonly={session.status !== 'PROCESO'}
              />
            </TabsContent>

            {/* ── Tab: Expediente ─────────────────────────────────────────── */}
            <TabsContent value="expediente">
              <ExpedientesCard
                idSesion={sessionId}
                readonly={session.status !== 'PROCESO'}
              />
            </TabsContent>

          </Tabs>}
        </div>
      </Container>
    </>
  );
}

// ─── ConsejerosAsistenciaCard ─────────────────────────────────────────────────

function ConsejerosAsistenciaCard({
  status,
  asistencia,
  sessionId,
  canAgregarActualizarAsistencia,
}: {
  status: string;
  asistencia: ISesionDetalleAPI['asistencia'];
  sessionId: string;
  canAgregarActualizarAsistencia: boolean;
}) {
  const canSave  = status !== 'PROGRAMADA' && status !== 'DEMORA';

  const { mutate: guardar, isPending: guardando } = useGuardarAsistencia(sessionId);

  // Estado para modo PROCESO (usa consejeros reales de asistencia)
  const [asistenciaExterna, setAsistenciaExterna] = useState<Record<number, boolean>>(
    () => Object.fromEntries(asistencia.map((p) => [p.id_asistencia ?? 0, p.asistencia ?? false])),
  );

  // Estado para modo CONCLUIDA
  const [asistenciaConc, setAsistenciaConc] = useState<Record<number, boolean>>(
    () => Object.fromEntries(asistencia.map((p) => [p.id_asistencia ?? 0, p.asistencia ?? false])),
  );
  const [desbloqueado, setDesbloqueado] = useState(false);

  // ── Modo PROGRAMADA / DEMORA: lista sin checkboxes (preview para iniciar) ─
  if (status === 'PROGRAMADA' || status === 'DEMORA') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consejeros Electorales</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {MOCK_CONSEJEROS_ELECTORALES.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-7 w-7 text-gray-400" />}
              title="Sin consejeros"
              description="No hay consejeros registrados para esta sesión."
            />
          ) : (
            <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
              <ul className="divide-y divide-border">
                {MOCK_CONSEJEROS_ELECTORALES.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {c.nombre} {c.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.cargo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Modo PROCESO: listado con checkboxes + Guardar ────────────────────────
  if (status === 'PROCESO') {
    const allSelected = asistencia.every((p) => asistenciaExterna[p.id_asistencia ?? 0] ?? false);
    const someSelected = asistencia.some((p) => asistenciaExterna[p.id_asistencia ?? 0] ?? false);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-consejeros"
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => {
                  const newValue = checked === true;
                  setAsistenciaExterna((prev) =>
                    Object.fromEntries(asistencia.map((p) => [p.id_asistencia ?? 0, newValue]))
                  );
                }}
              />
              <label htmlFor="select-all-consejeros" className="cursor-pointer">
                <CardTitle>Consejeros Electorales</CardTitle>
              </label>
            </div>
            {(canSave && canAgregarActualizarAsistencia) && (
              <Button
                size="sm"
                disabled={guardando}
                onClick={() => {
                  const payload = asistencia.map((p) => ({
                    id: p.id_asistencia ?? 0,
                    asistencia: asistenciaExterna[p.id_asistencia ?? 0] ?? false,
                  }));
                  guardar({ asistencia: payload });
                }}
              >
                {guardando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : 'Guardar'}
              </Button>
            )}
        </CardHeader>
        <CardContent className="p-0">
          {asistencia.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-7 w-7 text-gray-400" />}
              title="Sin consejeros"
              description="No hay consejeros registrados para esta sesión."
            />
          ) : (
            <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
              <ul className="divide-y divide-border">
                {asistencia.map((p) => {
                  const presente = asistenciaExterna[p.id_asistencia ?? 0] ?? false;
                  return (
                    <li key={p.id_asistencia ?? p.nombre} className="flex items-center gap-3 px-5 py-3">
                      <Checkbox
                        id={`ext-${p.id_asistencia ?? p.nombre}`}
                        checked={presente}
                        onCheckedChange={() =>
                          setAsistenciaExterna((prev) => ({ ...prev, [p.id_asistencia ?? 0]: !prev[p.id_asistencia ?? 0] }))
                        }
                      />
                      <label htmlFor={`ext-${p.id_asistencia ?? p.nombre}`} className="flex-1 min-w-0 cursor-pointer">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {p.nombre} {p.apellidos}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.cargo}</p>
                      </label>
                      <Badge variant={presente ? 'success' : 'destructive'} appearance="light" size="sm">
                        {presente ? 'Presente' : 'Ausente'}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Modo CONCLUIDA: listar desde sesión, editable con desbloqueo ─────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Consejeros Electorales</CardTitle>
          <div className="flex items-center gap-2">
            {(desbloqueado && canSave && canAgregarActualizarAsistencia) && (
              <Button
                size="sm"
                disabled={guardando}
                onClick={() => {
                  const payload = asistencia.map((p) => ({
                    id: p.id_asistencia ?? 0,
                    asistencia: asistenciaConc[p.id_asistencia ?? 0] ?? (p.asistencia ?? false),
                  }));
                  guardar({ asistencia: payload });
                }}
              >
                {guardando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : 'Guardar'}
              </Button>
            )}
            {desbloqueado && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDesbloqueado(false)}
              >
                Cancelar edición
              </Button>
            )}
            {(!desbloqueado && canAgregarActualizarAsistencia) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDesbloqueado(true)}
              >
                <LockOpen className="h-3.5 w-3.5" /> Editar asistencia
              </Button>
            )}
          </div>
      </CardHeader>
      <CardContent className="p-0">
        {asistencia.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin consejeros"
            description="No hay consejeros registrados para esta sesión."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
            <ul className="divide-y divide-border">
              {asistencia.map((person) => {
                const presente = asistenciaConc[person.id_asistencia ?? 0] ?? false;
                return (
                  <li key={person.id_asistencia ?? person.nombre} className="flex items-center gap-3 px-5 py-3">
                    {desbloqueado ? (
                      <Checkbox
                        id={`conc-${person.id_asistencia ?? person.nombre}`}
                        checked={presente}
                        onCheckedChange={() =>
                          setAsistenciaConc((prev) => ({
                            ...prev,
                            [person.id_asistencia ?? 0]: !prev[person.id_asistencia ?? 0],
                          }))
                        }
                      />
                    ) : null}
                    <label
                      htmlFor={desbloqueado ? `conc-${person.id_asistencia ?? person.nombre}` : undefined}
                      className={`flex-1 min-w-0 ${desbloqueado ? 'cursor-pointer' : ''}`}
                    >
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {person.nombre} {person.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{person.cargo}</p>
                    </label>
                    <Badge variant={presente ? 'success' : 'destructive'} appearance="light" size="sm">
                      {presente ? 'Presente' : 'Ausente'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

// ─── RepresentacionesPPCard ───────────────────────────────────────────────────

type AsistenciaPPItem = ISesionDetalleAPI['asistencia_pp'][number];

const RPP_API_BASE = process.env.NEXT_PUBLIC_RPP_API_BASE ?? '';
const EMPTY_REPS: IRepresentanteExternoAPI[] = [];

function RepresentacionesPPCard({
  status,
  asistenciaPP,
  tipo,
  idConsejo,
  asistenciaExtOverrides,
  onToggleExt,
  representantes,
  loadingExt,
  errorExt,
}: {
  status: string;
  asistenciaPP: AsistenciaPPItem[];
  tipo: 'd' | 'm';
  idConsejo: string | null;
  asistenciaExtOverrides: Record<number, boolean>;
  onToggleExt: (id: number) => void;
  representantes: IRepresentanteNorm[];
  loadingExt: boolean;
  errorExt: boolean;
}) {

  const isActive = ACTIVE_STATUSES.has(status);

  // ── API externa: datos pasados desde el componente padre ──
  // const { data: repData = EMPTY_REPS, isLoading: loadingExt } = useRepresentantesExternos(
  //   tipo,
  //   idConsejo,
  // );
  // const representantes = repData.map(normalizeRepresentante);

  // Mapa id_partido → partyImagePath, siempre desde la API externa
  const partyImageMap = useMemo(
    () => Object.fromEntries(
      representantes
        .filter((r) => r.partyImagePath)
        .map((r) => [r.id_partido, r.partyImagePath] as [number, string])
    ),
    [representantes],
  );

  // Usamos un Record de overrides para los toggles del usuario; el valor base es siempre false.
  const asistenciaExt = useMemo(
    () => Object.fromEntries(representantes.map((r) => [r.id_representante, asistenciaExtOverrides[r.id_representante] ?? false])),
    [representantes, asistenciaExtOverrides],
  );

  // ── Modo CONCLUIDA: representantes desde sesión guardada ─────────────────
  const [asistenciaConc, setAsistenciaConc] = useState<Record<number, boolean>>(
    () => Object.fromEntries(asistenciaPP.map((p) => [p.id_asistencia_pp, p.asistencia])),
  );
  const [desbloqueado, setDesbloqueado] = useState(false);

  // ── Modo PROGRAMADA / DEMORA: lista informativa sin checkboxes ───────────
  if (status === 'PROGRAMADA' || status === 'DEMORA') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Representaciones de Partidos Políticos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingExt ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : errorExt ? (
            <EmptyState
              icon={<AlertTriangle className="h-7 w-7 text-destructive" />}
              title="Sin conexión con representantes"
              description="No se pudo establecer contacto con el servicio de representantes. Intenta recargar la página."
            />
          ) : representantes.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-7 w-7 text-gray-400" />}
              title="Sin representantes"
              description="No hay representantes activos para este consejo."
            />
          ) : (
            <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
              <ul className="divide-y divide-border">
                {representantes.map((rep) => (
                  <li key={rep.id_representante} className="px-5 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {rep.partyImagePath && RPP_API_BASE ? (
                          <div className="relative shrink-0 w-8 h-8 rounded overflow-hidden">
                            <Image
                              src={`${RPP_API_BASE}/${rep.partyImagePath}`}
                              alt={rep.partyName}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {rep.id_partido}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {rep.nombre} {rep.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rep.cargo}</p>
                        </div>
                      </div>
                      {rep.nombramiento_url && (
                        <a
                          href={`${RPP_API_BASE}/${rep.nombramiento_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-muted transition-colors"
                          title="Ver nombramiento"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                    {(rep.telefono || rep.celular || rep.correo || rep.domicilio) && (
                      <div className="pl-[2.75rem] flex flex-col gap-0.5">
                        {rep.telefono && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />{rep.telefono}
                          </p>
                        )}
                        {rep.celular && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Smartphone className="h-3 w-3 shrink-0" />{rep.celular}
                          </p>
                        )}
                        {rep.correo && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />{rep.correo}
                          </p>
                        )}
                        {rep.domicilio && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />{rep.domicilio}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Modo PROCESO: lista con checkboxes + Guardar ──────────────────────────
  if (status === 'PROCESO') {
    const allSelected = representantes.every((rep) => asistenciaExt[rep.id_representante] ?? false);
    const someSelected = representantes.some((rep) => asistenciaExt[rep.id_representante] ?? false);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-representantes"
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => {
                const newValue = checked === true;
                // Actualizar todos los representantes
                representantes.forEach((rep) => {
                  if (asistenciaExt[rep.id_representante] !== newValue) {
                    onToggleExt(rep.id_representante);
                  }
                });
              }}
            />
            <label htmlFor="select-all-representantes" className="cursor-pointer">
              <CardTitle>Representaciones de Partidos Políticos</CardTitle>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingExt ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : errorExt ? (
            <EmptyState
              icon={<AlertTriangle className="h-7 w-7 text-destructive" />}
              title="Sin conexión con representantes"
              description="No se pudo establecer contacto con el servicio de representantes. Intenta recargar la página."
            />
          ) : representantes.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-7 w-7 text-gray-400" />}
              title="Sin representantes"
              description="No hay representantes activos para este consejo."
            />
          ) : (
            <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
              <ul className="divide-y divide-border">
                {representantes.map((rep) => {
                  const presente = asistenciaExt[rep.id_representante] ?? false;
                  return (
                    <li key={rep.id_representante} className="px-5 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Checkbox
                            id={`rpp-ext-${rep.id_representante}`}
                            checked={presente}
                            onCheckedChange={() => onToggleExt(rep.id_representante)}
                            className="mt-0.5"
                          />
                          {rep.partyImagePath && RPP_API_BASE ? (
                            <div className="relative shrink-0 w-8 h-8 rounded overflow-hidden">
                              <Image
                                src={`${RPP_API_BASE}/${rep.partyImagePath}`}
                                alt={rep.partyName}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                              {rep.id_partido}
                            </div>
                          )}
                          <label
                            htmlFor={`rpp-ext-${rep.id_representante}`}
                            className="min-w-0 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {rep.nombre} {rep.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{rep.cargo}</p>
                          </label>
                        </div>
                        {rep.nombramiento_url && (
                          <a
                            href={`${RPP_API_BASE}/${rep.nombramiento_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-muted transition-colors"
                            title="Ver nombramiento"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                      {(rep.telefono || rep.celular || rep.correo || rep.domicilio) && (
                        <div className="pl-[4.25rem] flex flex-col gap-0.5">
                          {rep.telefono && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              {rep.telefono}
                            </p>
                          )}
                          {rep.celular && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Smartphone className="h-3 w-3 shrink-0" />
                              {rep.celular}
                            </p>
                          )}
                          {rep.correo && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              {rep.correo}
                            </p>
                          )}
                          {rep.domicilio && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {rep.domicilio}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Modo CONCLUIDA ───────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Representaciones de Partidos Políticos</CardTitle>
          <div className="flex items-center gap-2">
            {desbloqueado ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDesbloqueado(false)}
              >
                Cancelar edición
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDesbloqueado(true)}
              >
                <LockOpen className="h-3.5 w-3.5" /> Editar asistencia
              </Button>
            )}
          </div>
      </CardHeader>
      <CardContent className="p-0">
        {asistenciaPP.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-7 w-7 text-gray-400" />}
            title="Sin representantes"
            description="No hay representantes de partidos registrados."
          />
        ) : (
          <ScrollArea className="h-[calc(100dvh-440px)] min-h-[200px]">
            <ul className="divide-y divide-border">
              {asistenciaPP.map((rep) => {
                const presente = asistenciaConc[rep.id_asistencia_pp] ?? false;
                return (
                  <li key={rep.id_asistencia_pp} className="px-5 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {desbloqueado && (
                          <Checkbox
                            id={`rpp-conc-${rep.id_asistencia_pp}`}
                            checked={presente}
                            onCheckedChange={() =>
                              setAsistenciaConc((prev) => ({
                                ...prev,
                                [rep.id_asistencia_pp]: !prev[rep.id_asistencia_pp],
                              }))
                            }
                            className="mt-0.5"
                          />
                        )}
                        {partyImageMap[rep.id_partido] && RPP_API_BASE ? (
                          <div className="relative shrink-0 w-8 h-8 rounded overflow-hidden">
                            <Image
                              src={`${RPP_API_BASE}/${partyImageMap[rep.id_partido]}`}
                              alt={String(rep.id_partido)}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {rep.id_partido}
                          </div>
                        )}
                        <label
                          htmlFor={desbloqueado ? `rpp-conc-${rep.id_asistencia_pp}` : undefined}
                          className={`min-w-0 ${desbloqueado ? 'cursor-pointer' : ''}`}
                        >
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {rep.nombre} {rep.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rep.cargo}</p>
                        </label>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {rep.nombramiento_url && (
                          <a
                            href={`${RPP_API_BASE}/${rep.nombramiento_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-muted transition-colors"
                            title="Ver nombramiento"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        )}
                        <Badge variant={presente ? 'success' : 'destructive'} appearance="light" size="sm">
                          {presente ? 'Presente' : 'Ausente'}
                        </Badge>
                      </div>
                    </div>
                    {(rep.telefono || rep.celular || rep.correo || rep.domicilio) && (
                      <div className="pl-10 flex flex-col gap-0.5">
                        {rep.telefono && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {rep.telefono}
                          </p>
                        )}
                        {rep.celular && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {rep.celular}
                          </p>
                        )}
                        {rep.correo && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            {rep.correo}
                          </p>
                        )}
                        {rep.domicilio && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {rep.domicilio}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}


function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-5">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

/**
 * Renderiza el contenido de incidencias cuando el API devuelve datos.
 * La forma exacta del objeto se desconoce hasta tener más ejemplos;
 * mientras tanto se muestra como tabla de propiedades (array o único objeto).
 */
function IncidenciasContent({ data }: { data: unknown }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground"
        >
          <PropList obj={item as Record<string, unknown>} />
        </div>
      ))}
    </div>
  );
}

/** Renderiza un objeto plano como lista de clave:valor. */
function PropList({ obj }: { obj: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {Object.entries(obj).map(([key, value]) => (
        <div key={key}>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            {key.replaceAll('_', ' ')}
          </dt>
          <dd className="text-sm text-foreground break-words">
            {value === null || value === undefined
              ? '—'
              : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

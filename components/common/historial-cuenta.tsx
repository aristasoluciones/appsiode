'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Monitor,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
  User,
  UserCog,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import {
  HISTORIAL_TAMANIO,
  useHistorialCuenta,
  useTiposEvento,
} from '@/hooks/use-historial-cuenta';
import { formatFechaHora } from '@/lib/fechas';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Timeline,
  TimelineItem,
  type TTimelineTono,
} from '@/components/common/timeline';
import type { IEventoCuenta } from '@/types/auth';

/** Marcador de cada evento: icono y color según lo que ocurrió. */
const MARCADORES: Record<string, { icono: ReactNode; tono: TTimelineTono }> = {
  'cuenta.creada': { icono: <UserPlus />, tono: 'exito' },
  'cuenta.editada': { icono: <UserCog />, tono: 'primario' },
  'cuenta.rol_cambiado': { icono: <BadgeCheck />, tono: 'info' },
  'cuenta.eliminada': { icono: <UserMinus />, tono: 'peligro' },
  'contrasenia.cambiada': { icono: <KeyRound />, tono: 'advertencia' },
  'contrasenia.recuperacion_solicitada': { icono: <Mail />, tono: 'neutro' },
  'contrasenia.restablecida': { icono: <KeyRound />, tono: 'advertencia' },
  'sesion.inicio': { icono: <LogIn />, tono: 'exito' },
  'sesion.cierre': { icono: <LogOut />, tono: 'neutro' },
  'sesion.revocada': { icono: <ShieldOff />, tono: 'peligro' },
  'sesion.revocada_masiva': { icono: <ShieldOff />, tono: 'peligro' },
  'mfa.activado': { icono: <ShieldCheck />, tono: 'exito' },
  'mfa.desactivado': { icono: <ShieldOff />, tono: 'advertencia' },
  'mfa.reseteado': { icono: <RotateCcw />, tono: 'advertencia' },
  'mfa.exigido': { icono: <ShieldAlert />, tono: 'info' },
  'mfa.liberado': { icono: <Shield />, tono: 'neutro' },
};

/** Respaldo por categoría, por si el API agrega tipos nuevos. */
const MARCADORES_CATEGORIA: Record<
  string,
  { icono: ReactNode; tono: TTimelineTono }
> = {
  cuenta: { icono: <User />, tono: 'primario' },
  contrasenia: { icono: <KeyRound />, tono: 'advertencia' },
  sesion: { icono: <Monitor />, tono: 'neutro' },
  mfa: { icono: <Shield />, tono: 'info' },
};

const CATEGORIAS: Record<string, string> = {
  cuenta: 'Cuenta',
  contrasenia: 'Contraseña',
  sesion: 'Sesión',
  mfa: 'Segundo paso',
};

/** Nombre en pantalla de los datos que acompañan a cada evento. */
const ETIQUETAS_DETALLE: Record<string, string> = {
  usuario: 'Usuario',
  rol: 'Rol',
  origen: 'Origen',
  metodo: 'Método',
  dispositivo: 'Equipo',
  cerradas: 'Sesiones cerradas',
};

const TODOS = 'todos';

function marcador(evento: IEventoCuenta) {
  return (
    MARCADORES[evento.tipo] ??
    MARCADORES_CATEGORIA[evento.categoria] ?? {
      icono: <User />,
      tono: 'neutro' as TTimelineTono,
    }
  );
}

function humanizar(clave: string) {
  const texto = clave.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Convierte el detalle del evento en líneas legibles. */
function describirDetalle(detalle: Record<string, unknown> | null): string[] {
  if (!detalle) return [];

  const valor = (clave: string) => {
    const v = detalle[clave];
    return v == null || v === '' ? null : String(v);
  };

  const lineas: string[] = [];
  const usadas = new Set<string>();

  // Los cambios se leen mejor como «de → a» que como dos renglones sueltos.
  if (valor('rol_anterior') || valor('rol_nuevo')) {
    lineas.push(`Rol: ${valor('rol_anterior') ?? '—'} → ${valor('rol_nuevo') ?? '—'}`);
    usadas.add('rol_anterior').add('rol_nuevo');
  }
  if (valor('usuario_anterior')) {
    lineas.push(
      `Usuario: ${valor('usuario_anterior')} → ${valor('usuario') ?? '—'}`,
    );
    usadas.add('usuario_anterior').add('usuario');
  }

  for (const [clave, bruto] of Object.entries(detalle)) {
    if (usadas.has(clave)) continue;
    if (bruto == null || bruto === '' || typeof bruto === 'object') continue;
    lineas.push(`${ETIQUETAS_DETALLE[clave] ?? humanizar(clave)}: ${bruto}`);
  }

  return lineas;
}

/** Quién provocó el evento, en primera o en tercera persona según la pantalla. */
function describirActor(evento: IEventoCuenta, esPropia: boolean): string {
  if (evento.id_actor == null) return 'Registrado por el sistema';
  if (evento.actor_es_titular)
    return esPropia ? 'Realizado por usted' : 'Realizado por el propio usuario';
  return `Realizado por ${evento.actor_nombre || evento.actor_usuario || 'otro usuario'}`;
}

/** Desde qué equipo y dirección quedó registrado el evento. */
function describirOrigen(evento: IEventoCuenta): string | null {
  const partes = [evento.dispositivo, evento.ip].filter(Boolean);
  return partes.length ? `Desde ${partes.join(' · ')}` : null;
}

export interface HistorialCuentaProps {
  /**
   * Cuenta consultada. Sin valor se muestra el historial del propio usuario,
   * que no requiere permisos administrativos.
   */
  idUsuario?: number | null;
  /** Permite montar el componente antes de que la pantalla lo necesite. */
  enabled?: boolean;
  className?: string;
}

/**
 * Línea de tiempo del historial de una cuenta: qué le ha pasado desde que se
 * creó, quién lo hizo y desde dónde, con filtro por tipo de evento y paginado.
 * La usan «Mi perfil» —sobre la propia cuenta— y el detalle de una cuenta en
 * la pantalla de Usuarios.
 */
export function HistorialCuenta({
  idUsuario = null,
  enabled = true,
  className,
}: HistorialCuentaProps) {
  const esPropia = idUsuario == null;
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState<string>(TODOS);

  const { data: tipos } = useTiposEvento(enabled);
  const { data, isLoading, isError, isFetching, refetch } = useHistorialCuenta({
    idUsuario,
    pagina,
    tipo: filtro === TODOS ? null : filtro,
    enabled,
  });

  // Tipos agrupados por categoría, tal como se ofrecen en el filtro.
  const grupos = useMemo(() => {
    const mapa = new Map<string, { clave: string; titulo: string }[]>();
    for (const t of tipos ?? []) {
      const lista = mapa.get(t.categoria) ?? [];
      lista.push({ clave: t.clave, titulo: t.titulo });
      mapa.set(t.categoria, lista);
    }
    return Array.from(mapa.entries());
  }, [tipos]);

  const eventos = data?.eventos ?? [];
  const total = data?.total ?? 0;
  const paginas = data?.paginas ?? 0;
  const desde = total === 0 ? 0 : (pagina - 1) * HISTORIAL_TAMANIO + 1;
  const hasta = Math.min(pagina * HISTORIAL_TAMANIO, total);

  const cambiarFiltro = (valor: string) => {
    setFiltro(valor);
    setPagina(1);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {esPropia
            ? 'Todo lo que ha ocurrido con su cuenta, de lo más reciente a lo más antiguo.'
            : 'Todo lo que ha ocurrido con la cuenta, de lo más reciente a lo más antiguo.'}
        </p>
        <Select value={filtro} onValueChange={cambiarFiltro}>
          <SelectTrigger className="w-56" disabled={isLoading}>
            <SelectValue placeholder="Todos los eventos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los eventos</SelectItem>
            {grupos.map(([categoria, lista]) => (
              <SelectGroup key={categoria}>
                <SelectLabel>
                  {CATEGORIAS[categoria] ?? humanizar(categoria)}
                </SelectLabel>
                <SelectItem value={categoria}>
                  Todo: {(CATEGORIAS[categoria] ?? humanizar(categoria)).toLowerCase()}
                </SelectItem>
                {lista.map((t) => (
                  <SelectItem key={t.clave} value={t.clave}>
                    {t.titulo}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-5 space-y-3">
          <Alert variant="destructive" close={false}>
            <AlertIcon>
              <TriangleAlert />
            </AlertIcon>
            <AlertTitle>No se pudo consultar el historial.</AlertTitle>
          </Alert>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && eventos.length === 0 && (
        <p className="mt-5 text-sm text-muted-foreground">
          {filtro === TODOS
            ? 'Todavía no hay eventos registrados.'
            : 'No hay eventos de ese tipo en el historial.'}
        </p>
      )}

      {!isLoading && !isError && eventos.length > 0 && (
        <>
          <Timeline className={`mt-5 ${isFetching ? 'opacity-60' : ''}`}>
            {eventos.map((evento) => {
              const { icono, tono } = marcador(evento);
              const origen = describirOrigen(evento);
              return (
                <TimelineItem
                  key={evento.id}
                  icono={icono}
                  tono={tono}
                  titulo={evento.tipo_titulo}
                  fecha={formatFechaHora(evento.fecha)}
                >
                  <p className="text-xs text-muted-foreground">
                    {describirActor(evento, esPropia)}
                  </p>
                  {origen && (
                    <p className="text-xs text-muted-foreground break-all">
                      {origen}
                    </p>
                  )}
                  {describirDetalle(evento.detalle).map((linea) => (
                    <p
                      key={linea}
                      className="text-xs text-muted-foreground break-all"
                    >
                      {linea}
                    </p>
                  ))}
                </TimelineItem>
              );
            })}
          </Timeline>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              Mostrando {desde}–{hasta} de {total}{' '}
              {total === 1 ? 'evento' : 'eventos'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1 || isFetching}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {pagina} de {Math.max(paginas, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= paginas || isFetching}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

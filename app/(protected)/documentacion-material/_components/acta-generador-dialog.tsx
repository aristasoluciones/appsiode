'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Eye,
  FileCheck2,
  Info,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from 'react-hook-form';
import { z } from 'zod';
import type {
  IActa,
  IActaGenerarPayload,
  IActaParticipante,
} from '@/types/material-electoral';
import { ACTA_LIMITES } from '@/types/material-electoral';
import { toastError } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { InputDesbloqueable } from '@/components/common/input-desbloqueable';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import {
  useActa,
  useCambiarTiposBorrador,
  useEliminarBorrador,
  useGenerarActa,
  useVistaPreviaActa,
} from '../_hooks/use-actas';
import { useTiposActa } from '../_hooks/use-tipos-acta';
import {
  normalizeRepresentanteApertura,
  useIntegracionApertura,
  useRepresentantesExternosApertura,
} from '../../aperturas/_hooks/use-external';
import {
  ActaAsistenciaCard,
  type IAsistenciaItem,
} from './acta-asistencia-card';
import { ESTATUS_ACTA } from './acta-estatus';
import { ActaFotografiasApartado } from './acta-fotografias-apartado';
import {
  SeccionGenerador,
  type IEstadoSeccion,
  type TSeccionGenerador,
} from './acta-generador-seccion';
import {
  ordenarRepresentaciones,
  subtituloRepresentacion,
} from './acta-representaciones';
import { ActaTiposArticuloCampo } from './acta-tipos-articulo-campo';
import {
  CUSTODIA_VACIA,
  custodiaSchema,
  trasladoDesdeActa,
  trasladoParaApi,
  validarCustodia,
  VEHICULO_VACIO,
  vehiculoSchema,
} from './acta-traslado';
import {
  ActaTrasladoCampos,
  CustodiaInterruptor,
} from './acta-traslado-secciones';

// ─── Formulario ───────────────────────────────────────────────────────────────

const datosSchema = z
  .object({
    fecha_acta: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Captura la fecha del acta.' }),
    hora_acta: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, {
      message: 'Captura la hora del acta.',
    }),
    ciudad: z
      .string()
      .trim()
      .min(1, { message: 'Captura la ciudad.' })
      .max(ACTA_LIMITES.ciudad.max, {
        message: `La ciudad no debe superar ${ACTA_LIMITES.ciudad.max} caracteres.`,
      }),
    lugar: z
      .string()
      .trim()
      .min(1, { message: 'Captura el lugar de la reunión.' })
      .max(ACTA_LIMITES.lugar.max, {
        message: `El lugar no debe superar ${ACTA_LIMITES.lugar.max} caracteres.`,
      }),
    presidencia: z
      .string()
      .trim()
      .min(1, { message: 'Captura el nombre de la presidencia.' })
      .max(200),
    secretaria: z
      .string()
      .trim()
      .min(1, { message: 'Captura el nombre de la secretaría técnica.' })
      .max(200),
    tipos_articulo: z.array(z.string()).min(1, {
      message: 'Elige al menos un tipo de artículo para el acta.',
    }),
    vehiculo: vehiculoSchema,
    custodia: custodiaSchema,
  })
  .superRefine((v, ctx) => {
    // Con custodia, los datos de la patrulla son obligatorios.
    validarCustodia(v.custodia, (campo, message) =>
      ctx.addIssue({ code: 'custom', path: ['custodia', campo], message }),
    );
  });

type TDatosForm = z.infer<typeof datosSchema>;

/** Sección del generador a la que pertenece cada campo del formulario. */
const CAMPO_SECCION: Record<
  string,
  Exclude<TSeccionGenerador, 'fotografias'> | undefined
> = {
  fecha_acta: 'reunion',
  hora_acta: 'reunion',
  ciudad: 'reunion',
  lugar: 'reunion',
  tipos_articulo: 'reunion',
  vehiculo: 'traslado',
  custodia: 'traslado',
  presidencia: 'participantes',
  secretaria: 'participantes',
};

const ORDEN_SECCIONES: TSeccionGenerador[] = [
  'reunion',
  'traslado',
  'participantes',
  'fotografias',
];

/** Renglón de consejería o representación con lo que el acta necesita. */
interface IPersonaActa extends IAsistenciaItem {
  cargo?: string | null;
  id_partido?: number | null;
  partido?: string | null;
}

/** Lo que se guarda en el navegador para retomar el borrador con lo capturado. */
interface IBorradorLocal {
  datos: TDatosForm;
  consejerias: IPersonaActa[];
  representaciones: IPersonaActa[];
}

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ahora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const DATOS_VACIOS: TDatosForm = {
  fecha_acta: '',
  hora_acta: '',
  ciudad: '',
  lugar: '',
  presidencia: '',
  secretaria: '',
  tipos_articulo: [],
  vehiculo: VEHICULO_VACIO,
  custodia: CUSTODIA_VACIA,
};

/** Presidencia y secretaría vienen en la misma lista de SICE que las consejerías; se separan por su cargo. */
const ES_PRESIDENCIA = /PRESIDEN/i;
const ES_SECRETARIA = /SECRETAR/i;

function claveLocal(idActa: number) {
  return `siode.acta-generador.${idActa}`;
}

// ─── Ventana ──────────────────────────────────────────────────────────────────

interface ActaGeneradorDialogProps {
  /** Borrador recién creado o retomado, o acta en Generada/Requerido a editar. */
  idActa: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Generador del acta circunstanciada: fecha y hora, ciudad y lugar; presidencia,
 * secretaría técnica, consejerías con asistencia y representaciones de partido
 * (obtenidas como en aperturas); fotografías por apartado con sus mínimos; vista
 * previa en Word antes de guardar. Al cerrar sin guardar, el borrador con sus
 * fotografías se conserva en el servidor y lo capturado en el navegador.
 */
export function ActaGeneradorDialog({
  idActa,
  open,
  onOpenChange,
}: ActaGeneradorDialogProps) {
  const { user } = useAuth();
  const { data: acta, isLoading } = useActa(open ? idActa : null);

  const generar = useGenerarActa();
  const vistaPrevia = useVistaPreviaActa();
  const eliminarBorrador = useEliminarBorrador();

  const esBorrador = acta?.estatus === 'BORRADOR';
  const regenerar = !!acta && !esBorrador;
  const readOnly = !!acta && !acta.editable;

  // ── Padrón externo (solo cuando el acta todavía no tiene participantes) ────
  const necesitaPadron = !!acta && acta.participantes.length === 0;
  const tipoChar =
    user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M'
      ? user.tipoConsejo
      : null;
  const {
    data: consejerosExt = [],
    isLoading: cargandoConsejeros,
    isError: errorConsejeros,
  } = useIntegracionApertura(
    necesitaPadron ? tipoChar : null,
    necesitaPadron && user?.claveConsejo ? Number(user.claveConsejo) : null,
  );
  const {
    data: representantesExt = [],
    isLoading: cargandoRep,
    isError: errorRep,
  } = useRepresentantesExternosApertura(
    necesitaPadron && tipoChar ? (tipoChar === 'D' ? 'd' : 'm') : null,
    necesitaPadron && user?.idConsejo ? Number(user.idConsejo) : null,
  );

  // ── Tipos de artículo ─────────────────────────────────────────────────────
  // Los tipos que ya están en otra acta en curso aparecen deshabilitados; los
  // del propio acta, no. En un borrador, cada cambio se guarda de inmediato
  // porque el borrador reserva sus tipos.
  const {
    opciones: opcionesTipo,
    ocupados: tiposOcupados,
    cargando: cargandoTipos,
  } = useTiposActa({
    habilitado: open,
    actaId: acta?.id ?? null,
    propios: acta?.tipos_articulo,
  });
  const cambiarTipos = useCambiarTiposBorrador();

  // ── Estado del formulario ─────────────────────────────────────────────────
  const form = useForm<TDatosForm>({
    resolver: zodResolver(datosSchema),
    mode: 'onSubmit',
    defaultValues: DATOS_VACIOS,
  });
  const [consejerias, setConsejerias] = useState<IPersonaActa[]>([]);
  const [representaciones, setRepresentaciones] = useState<IPersonaActa[]>([]);
  const [sembrado, setSembrado] = useState(false);
  const [confirmarSinRenglones, setConfirmarSinRenglones] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  /** Secciones desplegadas del generador; se eligen al hidratar el acta. */
  /** Se muestra tras intentar generar o ver la vista previa sin ninguna persona presente. */
  const [asistenciaRequerida, setAsistenciaRequerida] = useState(false);
  const [abiertas, setAbiertas] = useState<Set<TSeccionGenerador>>(
    () => new Set(),
  );
  const seccionesIniciadasRef = useRef<number | null>(null);
  /**
   * Acta cuyo formulario ya se hidrató. Cada foto subida o quitada deja un
   * objeto `acta` nuevo en caché; sin esta marca el efecto volvería a correr y
   * pisaría lo que el usuario lleva capturado.
   */
  const hidratadaRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) hidratadaRef.current = null;
  }, [open]);

  // Al abrir: lo guardado en el acta manda; si no hay, lo que quedó en el
  // navegador; y si tampoco, se siembra desde los sistemas externos. Corre una
  // sola vez por acta abierta.
  useEffect(() => {
    if (!open || !acta || hidratadaRef.current === acta.id) return;
    hidratadaRef.current = acta.id;
    setSembrado(false);

    // La ciudad se propone con el nombre del consejo (el municipio o la
    // cabecera del distrito) y el lugar con el consejo mismo; se usan siempre
    // que el acta o el borrador los tengan vacíos, y el usuario los corrige.
    const nombreConsejo = (acta.consejo ?? user?.consejo ?? '').trim();
    const lugarPropuesto = nombreConsejo
      ? `Consejo ${acta.tipo_consejo === 'D' ? 'Distrital' : 'Municipal'} ${nombreConsejo}`
      : '';

    if (acta.participantes.length > 0) {
      const p = acta.participantes;
      form.reset({
        fecha_acta: acta.fecha_acta ?? hoy(),
        hora_acta: (acta.hora_acta ?? ahora()).slice(0, 5),
        ciudad: acta.ciudad || nombreConsejo,
        lugar: acta.lugar || lugarPropuesto,
        presidencia: p.find((x) => x.tipo === 'PRESIDENCIA')?.nombre ?? '',
        secretaria: p.find((x) => x.tipo === 'SECRETARIA')?.nombre ?? '',
        tipos_articulo: (acta.tipos_articulo ?? []).map((t) => t.clave),
        ...trasladoDesdeActa(acta.vehiculo, acta.custodia),
      });
      setConsejerias(
        p
          .filter((x) => x.tipo === 'CONSEJERIA')
          .map((x, i) => ({
            orden: i + 1,
            nombre: x.nombre,
            subtitulo: x.cargo ?? 'Consejería electoral',
            cargo: x.cargo,
            asistencia: !!x.asistencia,
          })),
      );
      setRepresentaciones(
        ordenarRepresentaciones(
          p.filter((x) => x.tipo === 'REPRESENTACION'),
        ).map((x, i) => ({
          orden: i + 1,
          nombre: x.nombre,
          subtitulo: subtituloRepresentacion(x.partido, x.cargo),
          cargo: x.cargo,
          id_partido: x.id_partido,
          partido: x.partido,
          imagen: x.imagen ?? null,
          asistencia: !!x.asistencia,
        })),
      );
      setSembrado(true);
      return;
    }

    try {
      const raw = sessionStorage.getItem(claveLocal(acta.id));
      if (raw) {
        const local = JSON.parse(raw) as IBorradorLocal;
        form.reset({
          ...DATOS_VACIOS,
          ...local.datos,
          // Lo reservado en el servidor manda sobre lo que quedó en el navegador.
          tipos_articulo: (acta.tipos_articulo ?? []).map((t) => t.clave),
          ciudad: local.datos?.ciudad || nombreConsejo,
          lugar: local.datos?.lugar || lugarPropuesto,
        });
        setConsejerias(local.consejerias ?? []);
        setRepresentaciones(
          ordenarRepresentaciones(local.representaciones ?? []).map((r, i) => ({
            ...r,
            orden: i + 1,
          })),
        );
        setSembrado(true);
        return;
      }
    } catch {
      /* sin almacenamiento: se siembra desde los sistemas externos */
    }

    // Borrador nuevo.
    form.reset({
      ...DATOS_VACIOS,
      // El borrador nace con los tipos que el consejo eligió al abrirlo.
      tipos_articulo: (acta.tipos_articulo ?? []).map((t) => t.clave),
      fecha_acta: hoy(),
      hora_acta: ahora(),
      ciudad: nombreConsejo,
      lugar: lugarPropuesto,
    });
    setConsejerias([]);
    setRepresentaciones([]);
  }, [open, acta, form, user?.consejo]);

  // Siembra desde SICE y RPP, solo si no había nada guardado.
  useEffect(() => {
    if (!open || !acta || sembrado || !necesitaPadron) return;
    if (cargandoConsejeros || cargandoRep) return;

    const presidencia = consejerosExt.find((c) => ES_PRESIDENCIA.test(c.cargo));
    const secretaria = consejerosExt.find((c) => ES_SECRETARIA.test(c.cargo));
    if (presidencia && !form.getValues('presidencia')) {
      form.setValue(
        'presidencia',
        `${presidencia.nombre} ${presidencia.apellidos}`.trim(),
      );
    }
    if (secretaria && !form.getValues('secretaria')) {
      form.setValue(
        'secretaria',
        `${secretaria.nombre} ${secretaria.apellidos}`.trim(),
      );
    }
    setConsejerias(
      consejerosExt
        .filter(
          (c) => !ES_PRESIDENCIA.test(c.cargo) && !ES_SECRETARIA.test(c.cargo),
        )
        .map((c, i) => ({
          orden: i + 1,
          nombre: `${c.nombre} ${c.apellidos}`.trim(),
          subtitulo: c.cargo,
          cargo: c.cargo,
          asistencia: false,
        })),
    );
    setRepresentaciones(
      ordenarRepresentaciones(
        representantesExt.map(normalizeRepresentanteApertura).map((r) => ({
          ...r,
          partido: r.partyName,
        })),
      ).map((r, i) => ({
        orden: i + 1,
        nombre: `${r.nombre} ${r.apellidos}`.trim(),
        subtitulo: subtituloRepresentacion(r.partyName, r.cargo),
        cargo: r.cargo,
        id_partido: r.id_partido,
        partido: r.partyName,
        imagen: r.partyImagePath ?? null,
        asistencia: false,
      })),
    );
    setSembrado(true);
  }, [
    open,
    acta,
    sembrado,
    necesitaPadron,
    cargandoConsejeros,
    cargandoRep,
    consejerosExt,
    representantesExt,
    form,
  ]);

  const autoguardar = open && !!acta && esBorrador && sembrado;

  const limpiarLocal = useCallback((id: number) => {
    try {
      sessionStorage.removeItem(claveLocal(id));
    } catch {
      /* nada que limpiar */
    }
  }, []);

  // ── Asistencia ────────────────────────────────────────────────────────────
  const toggleConsejeria = (orden: number, v: boolean) =>
    setConsejerias((prev) =>
      prev.map((c) => (c.orden === orden ? { ...c, asistencia: v } : c)),
    );
  const toggleTodasConsejerias = (v: boolean) =>
    setConsejerias((prev) => prev.map((c) => ({ ...c, asistencia: v })));
  const toggleRepresentacion = (orden: number, v: boolean) =>
    setRepresentaciones((prev) =>
      prev.map((c) => (c.orden === orden ? { ...c, asistencia: v } : c)),
    );
  const toggleTodasRepresentaciones = (v: boolean) =>
    setRepresentaciones((prev) => prev.map((c) => ({ ...c, asistencia: v })));

  // ── Fotografías ───────────────────────────────────────────────────────────
  const apartados = useMemo(
    () =>
      (acta?.configuracion.apartados ?? [])
        .filter((a) => a.activo)
        .sort((a, b) => a.orden - b.orden),
    [acta],
  );
  const fotosPorApartado = useMemo(() => {
    const mapa = new Map<string, IActa['fotografias']>();
    for (const f of acta?.fotografias ?? []) {
      const lista = mapa.get(f.apartado) ?? [];
      lista.push(f);
      mapa.set(f.apartado, lista);
    }
    return mapa;
  }, [acta]);

  // El mínimo se calcula con las fotografías reales del acta, no con el avance
  // que trae la configuración, para que reaccione al subir o quitar.
  const apartadosIncompletos = useMemo(
    () =>
      apartados.filter(
        (a) => (fotosPorApartado.get(a.clave)?.length ?? 0) < a.minimo,
      ),
    [apartados, fotosPorApartado],
  );
  const minimosCumplidos = apartadosIncompletos.length === 0;

  // ── Envío ─────────────────────────────────────────────────────────────────
  function armarPayload(
    datos: TDatosForm,
    confirmar = false,
  ): IActaGenerarPayload {
    const participantes: IActaParticipante[] = [
      {
        tipo: 'PRESIDENCIA',
        nombre: datos.presidencia.trim(),
        asistencia: true,
      },
      { tipo: 'SECRETARIA', nombre: datos.secretaria.trim(), asistencia: true },
      ...consejerias.map<IActaParticipante>((c) => ({
        tipo: 'CONSEJERIA',
        nombre: c.nombre,
        cargo: c.cargo ?? null,
        asistencia: c.asistencia,
      })),
      ...representaciones.map<IActaParticipante>((r) => ({
        tipo: 'REPRESENTACION',
        nombre: r.nombre,
        cargo: r.cargo ?? null,
        id_partido: r.id_partido ?? null,
        partido: r.partido ?? null,
        imagen: r.imagen ?? null,
        asistencia: r.asistencia,
      })),
    ];
    return {
      id_acta: acta!.id,
      fecha_acta: datos.fecha_acta,
      hora_acta: datos.hora_acta.slice(0, 5),
      ciudad: datos.ciudad.trim(),
      lugar: datos.lugar.trim(),
      participantes,
      tipos_articulo: datos.tipos_articulo,
      ...trasladoParaApi(datos),
      confirmar_sin_renglones: confirmar,
    };
  }

  async function enviar(confirmar: boolean) {
    if (!hayAsistentes()) return;
    const datos = form.getValues();
    try {
      await generar.mutateAsync({
        payload: armarPayload(datos, confirmar),
        regenerar,
      });
      limpiarLocal(acta!.id);
      onOpenChange(false);
    } catch (error) {
      const respuesta = (
        error as {
          response?: {
            status?: number;
            data?: {
              message?: string;
              data?: { requiere_confirmacion?: boolean };
            };
          };
        }
      )?.response;
      // Sin comprobaciones al corte la API pide confirmar antes de generar.
      if (
        respuesta?.status === 409 &&
        respuesta.data?.data?.requiere_confirmacion
      ) {
        setConfirmarSinRenglones(true);
        return;
      }
      toastError(
        respuesta?.data?.message ??
          'No se pudo generar el acta. Intenta nuevamente.',
      );
    }
  }

  /** Debe haber al menos una persona presente; si no, se abre la sección y se avisa. */
  function hayAsistentes() {
    const hay = [...consejerias, ...representaciones].some((p) => p.asistencia);
    setAsistenciaRequerida(!hay);
    if (!hay) irASeccion('participantes');
    return hay;
  }

  function handleVistaPrevia() {
    form.handleSubmit((datos) => {
      if (!hayAsistentes()) return;
      vistaPrevia.mutate(armarPayload(datos));
    }, abrirConErrores)();
  }

  function handleEliminarBorrador() {
    if (!acta) return;
    eliminarBorrador.mutate(acta.id, {
      onSuccess: () => {
        limpiarLocal(acta.id);
        setConfirmarEliminar(false);
        onOpenChange(false);
      },
    });
  }

  const ocupado =
    generar.isPending || vistaPrevia.isPending || eliminarBorrador.isPending;

  function cerrar(v: boolean) {
    if (ocupado) return;
    onOpenChange(v);
  }

  const estatus = acta ? ESTATUS_ACTA[acta.estatus] : null;

  // ── Secciones ─────────────────────────────────────────────────────────────
  // Lo que falta se calcula con las mismas reglas del formulario, para que el
  // índice, cada tarjeta y el pie digan lo mismo que dirá la validación.
  const valores = form.watch();
  const pendientesPorSeccion = { reunion: 0, traslado: 0, participantes: 0 };
  const revision = datosSchema.safeParse(valores);
  if (!revision.success) {
    const vistos = new Set<string>();
    for (const issue of revision.error.issues) {
      const ruta = issue.path.join('.');
      const seccion = CAMPO_SECCION[String(issue.path[0])];
      if (!seccion || vistos.has(ruta)) continue;
      vistos.add(ruta);
      pendientesPorSeccion[seccion] += 1;
    }
  }
  const presentes = [...consejerias, ...representaciones].filter(
    (p) => p.asistencia,
  ).length;
  const requeridos = apartados.filter((a) => a.minimo > 0).length;
  const etiquetasTipo = opcionesTipo
    .filter((o) => valores.tipos_articulo?.includes(o.clave))
    .map((o) => o.descripcion);
  const estados: IEstadoSeccion[] = [
    {
      id: 'reunion',
      titulo: 'Datos del acta',
      descripcion:
        'Fecha, hora, lugar y tipos de artículo del acta. Todos los campos son obligatorios.',
      resumen: [
        valores.fecha_acta &&
          `${valores.fecha_acta.split('-').reverse().join('/')} ${valores.hora_acta ?? ''}`.trim(),
        valores.ciudad,
        etiquetasTipo.join(', '),
      ]
        .filter(Boolean)
        .join(' · '),
      pendientes: pendientesPorSeccion.reunion,
    },
    {
      id: 'traslado',
      titulo: 'Traslado',
      descripcion:
        'Vehículo en que se trasladan la documentación y el material y, si hubo, su custodia. Todo es obligatorio salvo el número económico.',
      resumen: [
        [
          valores.vehiculo?.tipo,
          valores.vehiculo?.marca,
          valores.vehiculo?.placas,
        ]
          .filter(Boolean)
          .join(' '),
        valores.custodia?.custodiado ? 'Con custodia' : 'Sin custodia',
      ]
        .filter(Boolean)
        .join(' · '),
      pendientes: pendientesPorSeccion.traslado,
    },
    {
      id: 'participantes',
      titulo: 'Participantes',
      descripcion:
        'Presidencia, secretaría técnica y asistencia de consejerías y representaciones. Los nombres son obligatorios y debes seleccionar al menos una persona.',
      resumen: `${presentes} de ${consejerias.length + representaciones.length} consejerías y representaciones presentes`,
      pendientes:
        pendientesPorSeccion.participantes + (presentes === 0 ? 1 : 0),
    },
    {
      id: 'fotografias',
      titulo: 'Fotografías',
      descripcion:
        'Fotografías por apartado. Los apartados con mínimo son obligatorios; los opcionales no bloquean la generación del acta.',
      resumen: `${requeridos - apartadosIncompletos.length} de ${requeridos} apartados requeridos · ${acta?.fotografias.length ?? 0} fotografías`,
      pendientes: apartadosIncompletos.length,
    },
  ];
  const estadoDe = (id: TSeccionGenerador) => estados.find((e) => e.id === id)!;

  function cambiarSeccion(id: TSeccionGenerador, abierta: boolean) {
    setAbiertas((prev) => {
      const sig = new Set(prev);
      if (abierta) sig.add(id);
      else sig.delete(id);
      return sig;
    });
  }

  /** Abre la sección y lleva la vista a ella (índice, pie y errores al enviar). */
  function irASeccion(id: TSeccionGenerador) {
    cambiarSeccion(id, true);
    const reducido = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    requestAnimationFrame(() =>
      document.getElementById(`seccion-${id}`)?.scrollIntoView({
        block: 'start',
        behavior: reducido ? 'auto' : 'smooth',
      }),
    );
  }

  // Al validar con errores, se abren las secciones afectadas y se lleva la
  // vista a la primera: con tarjetas plegadas, un error no puede quedar oculto.
  function abrirConErrores(errores: FieldErrors<TDatosForm>) {
    const secciones = ORDEN_SECCIONES.filter((s) =>
      Object.keys(errores).some((campo) => CAMPO_SECCION[campo] === s),
    );
    if (secciones.length === 0) return;
    setAbiertas((prev) => new Set([...Array.from(prev), ...secciones]));
    irASeccion(secciones[0]);
  }

  // Al abrir el acta ya hidratada: abiertas solo las secciones incompletas
  // (en un borrador nuevo, casi siempre traslado); las completas, plegadas.
  useEffect(() => {
    if (!open) {
      seccionesIniciadasRef.current = null;
      return;
    }
    if (!acta || !sembrado || seccionesIniciadasRef.current === acta.id) {
      return;
    }
    seccionesIniciadasRef.current = acta.id;
    setAbiertas(
      // Datos del acta siempre abierta: es lo primero que se revisa.
      new Set<TSeccionGenerador>([
        'reunion',
        ...estados.filter((e) => e.pendientes > 0).map((e) => e.id),
      ]),
    );
    // Solo al hidratar: después, cada sección la abre o cierra el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, acta?.id, sembrado]);

  return (
    <>
      <Dialog open={open} onOpenChange={cerrar}>
        <DialogContent
          className="sm:max-w-6xl w-[95vw] h-[92vh] max-h-[95vh] flex flex-col"
          // Escape dentro de un campo desbloqueado cancela su edición, no
          // cierra el generador.
          onEscapeKeyDown={(e) => {
            if (
              (e.target as HTMLElement | null)?.closest?.(
                '[data-desbloqueable="editando"]',
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {regenerar
                ? 'Editar acta circunstanciada'
                : 'Generar acta circunstanciada'}
              {estatus && acta && (
                <Badge variant={estatus.variant} appearance="light" size="sm">
                  {estatus.label} · #{acta.id}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {regenerar
                ? 'Al guardar se toma un corte nuevo de las comprobaciones y se vuelve a generar el acta circunstanciada en Word con los datos actuales; las observaciones de oficina central se conservan.'
                : 'Captura los datos de la reunión, marca la asistencia y agrega las fotografías de cada apartado. Puedes cerrar y retomar el borrador después.'}
            </DialogDescription>
          </DialogHeader>

          {/* Solo el cuerpo hace scroll; cabecera y pie quedan fijos. */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1">
              {isLoading || !acta ? (
                <div className="space-y-4" aria-busy="true">
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {readOnly && (
                    <Alert variant="warning" icon="warning" appearance="light">
                      <AlertIcon>
                        <AlertCircle />
                      </AlertIcon>
                      <AlertTitle>{estatus?.descripcion}</AlertTitle>
                    </Alert>
                  )}

                  {/* Avisos del borrador (tipos sin comprobaciones nuevas): no
                    impiden capturar el acta. */}
                  {esBorrador &&
                    (acta.advertencias ?? []).map((a) => (
                      <Alert
                        key={a.codigo}
                        variant="warning"
                        icon="warning"
                        appearance="light"
                      >
                        <AlertIcon>
                          <AlertCircle />
                        </AlertIcon>
                        <AlertTitle>{a.mensaje}</AlertTitle>
                      </Alert>
                    ))}

                  {acta.estatus === 'REQUERIDO' &&
                    acta.observaciones[0]?.observaciones && (
                      <Alert
                        variant="warning"
                        icon="warning"
                        appearance="light"
                      >
                        <AlertIcon>
                          <AlertCircle />
                        </AlertIcon>
                        <AlertTitle>
                          Observaciones de oficina central:{' '}
                          {acta.observaciones[0].observaciones}
                        </AlertTitle>
                      </Alert>
                    )}

                  {/* ── Datos de la reunión ─────────────────────────────────── */}
                  {autoguardar && (
                    <AutoguardadoBorrador
                      control={form.control}
                      idActa={acta.id}
                      consejerias={consejerias}
                      representaciones={representaciones}
                    />
                  )}
                  <Form {...form}>
                    <form
                      id="acta-generador-form"
                      className="space-y-4"
                      onSubmit={form.handleSubmit(
                        () => enviar(false),
                        abrirConErrores,
                      )}
                    >
                      <SeccionGenerador
                        estado={estadoDe('reunion')}
                        abierta={abiertas.has('reunion')}
                        onAbiertaChange={(v) => cambiarSeccion('reunion', v)}
                      >
                        <div className="grid gap-4 sm:grid-cols-4">
                          <FormField
                            control={form.control}
                            name="fecha_acta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Fecha{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="hora_acta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Hora{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="ciudad"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>
                                  Ciudad{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <InputDesbloqueable
                                    etiqueta="ciudad"
                                    {...field}
                                    maxLength={ACTA_LIMITES.ciudad.max}
                                    placeholder="Ciudad donde se levanta el acta"
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lugar"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-4">
                                <FormLabel>
                                  Lugar de la reunión{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={2}
                                    maxLength={ACTA_LIMITES.lugar.max}
                                    placeholder="Instalaciones del consejo, domicilio…"
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="sm:col-span-4">
                            <ActaTiposArticuloCampo
                              control={form.control}
                              name="tipos_articulo"
                              opciones={opcionesTipo}
                              ocupados={tiposOcupados}
                              loading={cargandoTipos}
                              disabled={readOnly || cambiarTipos.isPending}
                              onCambio={(tipos) => {
                                if (!esBorrador || !acta) return;
                                const previos = (acta.tipos_articulo ?? []).map(
                                  (t) => t.clave,
                                );
                                // Sin tipos no hay borrador que reservar: se avisa
                                // con el mensaje del formulario al guardar.
                                if (tipos.length === 0) return;
                                cambiarTipos.mutate(
                                  { id: acta.id, tipos },
                                  {
                                    // Si otro acta ya tomó el tipo, el servidor
                                    // avisa y la selección regresa a lo reservado.
                                    onError: () =>
                                      form.setValue('tipos_articulo', previos),
                                  },
                                );
                              }}
                            />
                          </div>
                        </div>
                      </SeccionGenerador>

                      {/* ── Traslado: vehículo y, si aplica, custodia ───────── */}
                      <SeccionGenerador
                        estado={estadoDe('traslado')}
                        abierta={abiertas.has('traslado')}
                        onAbiertaChange={(v) => cambiarSeccion('traslado', v)}
                        accion={
                          <CustodiaInterruptor
                            readOnly={readOnly}
                            onActivar={() => cambiarSeccion('traslado', true)}
                          />
                        }
                      >
                        <ActaTrasladoCampos readOnly={readOnly} />
                      </SeccionGenerador>

                      {/* ── Participantes ───────────────────────────────────── */}
                      <SeccionGenerador
                        estado={estadoDe('participantes')}
                        abierta={abiertas.has('participantes')}
                        onAbiertaChange={(v) =>
                          cambiarSeccion('participantes', v)
                        }
                      >
                        {asistenciaRequerida && presentes === 0 && (
                          <p className="text-sm text-destructive" role="alert">
                            Debes seleccionar al menos una persona (consejería o
                            representación).
                          </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="presidencia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Presidencia{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <InputDesbloqueable
                                    etiqueta="presidencia"
                                    {...field}
                                    maxLength={200}
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secretaria"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Secretaría técnica{' '}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <InputDesbloqueable
                                    etiqueta="secretaría técnica"
                                    {...field}
                                    maxLength={200}
                                    disabled={readOnly}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <ActaAsistenciaCard
                            id="acta-consejerias"
                            titulo="Consejerías electorales"
                            items={consejerias}
                            loading={necesitaPadron && !sembrado}
                            error={necesitaPadron && errorConsejeros}
                            readOnly={readOnly}
                            vacio="No hay consejerías registradas para este consejo."
                            onToggle={toggleConsejeria}
                            onToggleAll={toggleTodasConsejerias}
                          />
                          <ActaAsistenciaCard
                            id="acta-representaciones"
                            titulo="Representaciones de partido"
                            items={representaciones}
                            loading={necesitaPadron && !sembrado}
                            error={necesitaPadron && errorRep}
                            readOnly={readOnly}
                            vacio="No hay representaciones acreditadas para este consejo."
                            onToggle={toggleRepresentacion}
                            onToggleAll={toggleTodasRepresentaciones}
                          />
                        </div>
                      </SeccionGenerador>
                    </form>
                  </Form>

                  {/* ── Fotografías (cada apartado abre plegado) ───────────── */}
                  <SeccionGenerador
                    estado={estadoDe('fotografias')}
                    abierta={abiertas.has('fotografias')}
                    onAbiertaChange={(v) => cambiarSeccion('fotografias', v)}
                  >
                    {apartados.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        La configuración vigente no tiene apartados de
                        fotografías.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {apartados.map((a) => (
                          <ActaFotografiasApartado
                            key={a.clave}
                            idActa={acta.id}
                            apartado={a}
                            fotografias={fotosPorApartado.get(a.clave) ?? []}
                            readOnly={readOnly}
                            abiertoAlInicio={false}
                          />
                        ))}
                      </div>
                    )}
                    {!readOnly && !minimosCumplidos && (
                      <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <Info
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          Para guardar faltan fotografías en:{' '}
                          {apartadosIncompletos.map((a) => a.titulo).join('; ')}
                          . La vista previa ya muestra las fotografías subidas.
                        </span>
                      </p>
                    )}
                  </SeccionGenerador>

                  <LeyendaObligatorios />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              {esBorrador && !readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirmarEliminar(true)}
                  disabled={ocupado}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Eliminar borrador
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={ocupado}
              >
                {readOnly ? 'Cerrar' : 'Cerrar sin guardar'}
              </Button>
              {!readOnly && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVistaPrevia}
                    disabled={ocupado || !acta}
                    aria-busy={vistaPrevia.isPending}
                  >
                    {vistaPrevia.isPending ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    Vista previa (Word)
                  </Button>
                  <Button
                    type="submit"
                    form="acta-generador-form"
                    disabled={ocupado || !acta || !minimosCumplidos}
                    aria-busy={generar.isPending}
                    title={
                      !minimosCumplidos
                        ? 'Faltan fotografías en uno o más apartados.'
                        : undefined
                    }
                  >
                    {generar.isPending ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {regenerar ? 'Guardar cambios' : 'Generar acta'}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sin comprobaciones al corte: la API pide confirmar. */}
      <AlertDialog
        open={confirmarSinRenglones}
        onOpenChange={setConfirmarSinRenglones}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              No hay comprobaciones nuevas al corte
            </AlertDialogTitle>
            <AlertDialogDescription>
              El acta se generaría sin renglones de documentación ni material:
              ninguna comprobación quedó fuera del acta aceptada anterior.
              ¿Deseas continuar de todos modos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generar.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setConfirmarSinRenglones(false);
                void enviar(true);
              }}
              disabled={generar.isPending}
            >
              Generar sin renglones
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar el borrador: desaparece con sus fotografías. */}
      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el borrador con todas sus fotografías y lo capturado
              en este generador. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarBorrador.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleEliminarBorrador();
              }}
              disabled={eliminarBorrador.isPending}
            >
              {eliminarBorrador.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Eliminar borrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Autoguardado del borrador ────────────────────────────────────────────────

/**
 * Guarda en el navegador lo capturado en el borrador (datos de la reunión y
 * asistencia) con medio segundo de espera. Es un componente aparte con
 * `useWatch` para que cada tecla vuelva a pintar solo esto y no todo el
 * generador con sus fotografías y listas.
 */
function AutoguardadoBorrador({
  control,
  idActa,
  consejerias,
  representaciones,
}: {
  control: Control<TDatosForm>;
  idActa: number;
  consejerias: IPersonaActa[];
  representaciones: IPersonaActa[];
}) {
  const datos = useWatch({ control });

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const local: IBorradorLocal = {
          datos: {
            ...DATOS_VACIOS,
            ...datos,
            vehiculo: { ...VEHICULO_VACIO, ...datos.vehiculo },
            custodia: { ...CUSTODIA_VACIA, ...datos.custodia },
          },
          consejerias,
          representaciones,
        };
        sessionStorage.setItem(claveLocal(idActa), JSON.stringify(local));
      } catch {
        /* sin almacenamiento: lo capturado se pierde al cerrar */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [idActa, datos, consejerias, representaciones]);

  return null;
}

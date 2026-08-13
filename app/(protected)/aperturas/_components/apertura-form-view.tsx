'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Loader2, Lock, Save, Trash2 } from 'lucide-react';
import { toastError } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import type { TTipoConsejo } from '@/hooks/use-proceso';
import {
  useActualizarApertura,
  useAperturaDetalle,
  useCrearApertura,
  useEliminarApertura,
} from '../_hooks/use-aperturas';
import { CerrarAperturaDialog } from '../components/cerrar-apertura-dialog';
import {
  useCatalogosAperturas,
  useIntegracionApertura,
  useRepresentantesExternosApertura,
  normalizeRepresentanteApertura,
} from '../_hooks/use-external';
import { ConsejerosAsistenciaAperturaCard } from '../_components/consejeros-asistencia-apertura-card';
import { RepresentacionesPPAperturaCard } from '../_components/representaciones-pp-apertura-card';
import { OtrasPersonasAperturaCard } from '../_components/otras-personas-apertura-card';
import { PaquetesSelectorCard } from '../_components/paquetes-selector-card';
import { uid } from '@/lib/helpers';
import type {
  IAperturaBodega,
  IAperturaBodegaDetalleAPI,
  IConsejeroApertura,
  IOtraPersona,
  IPaqueteApertura,
  IRepresentanteApertura,
  TTipoEleccion,
  TSacarPaquetesFront,
} from '@/types/aperturas-bodegas';
import { ELECCION_LABEL, SACAR_PAQUETES_OPTIONS } from '@/types/aperturas-bodegas';
import type { IRepresentanteNorm } from '../_hooks/use-external';

// ─── Estado del formulario ────────────────────────────────────────────────────

interface FormState {
  bodega: TTipoEleccion | '';
  fecha_apertura: string;       // yyyy-MM-dd
  hora_apertura: string;        // HH:mm
  motivo: string;
  observaciones: string;
  sellos_apertura: boolean;
  sacar_paquetes: TSacarPaquetesFront;
  consejeros: IConsejeroApertura[];
  representantes: IRepresentanteApertura[];
  otros: IOtraPersona[];
  paquetes: IPaqueteApertura[];
}

const EMPTY_FORM: FormState = {
  bodega: '',
  fecha_apertura: '',
  hora_apertura: '',
  motivo: '',
  observaciones: '',
  sellos_apertura: true,
  sacar_paquetes: 'NINGUNO',
  consejeros: [],
  representantes: [],
  otros: [],
  paquetes: [],
};

const TIPO_CHAR: Record<TTipoConsejo, 'D' | 'M'> = {
  distrital: 'D',
  municipal: 'M',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AperturaFormViewProps {
  idApertura?: number;
  readOnly?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AperturaFormView({ idApertura, readOnly = false }: AperturaFormViewProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isEditing = typeof idApertura === 'number';

  // ── Tipo consejo + id del JWT ────────────────────────────────────────────
  const tipoConsejoUser: TTipoConsejo | null = useMemo(() => {
    const t = user?.tipoConsejo;
    if (t === 'D') return 'distrital';
    if (t === 'M') return 'municipal';
    return null;
  }, [user?.tipoConsejo]);

  const idConsejoUser = user?.idConsejo ? parseInt(user.idConsejo, 10) : null;
  const claveConsejoUser = user?.claveConsejo ?? null;
  const tipoChar = tipoConsejoUser ? TIPO_CHAR[tipoConsejoUser] : null;

  // ── Catálogos ─────────────────────────────────────────────────────────────
  const { data: catalogos, isLoading: isLoadingCatalogos } =
    useCatalogosAperturas(true);

  // ── Catálogos externos ───────────────────────────────────────────────────
  // Solo se consultan al crear: una apertura ya registrada es un acta y se lee
  // de lo guardado, sin volver a preguntarle a los sistemas externos.
  const { data: consejerosExt = [], isLoading: loadingConsejeros } =
    useIntegracionApertura(
      isEditing ? null : tipoChar,
      !isEditing && claveConsejoUser ? parseInt(claveConsejoUser, 10) : null,
    );

  const { data: representantesExt = [], isLoading: loadingRep, isError: errorRep } =
    useRepresentantesExternosApertura(
      isEditing || !tipoConsejoUser
        ? null
        : tipoConsejoUser === 'distrital'
          ? 'd'
          : 'm',
      isEditing ? null : idConsejoUser,
    );

  const representantesNorm: IRepresentanteNorm[] = useMemo(
    () => representantesExt.map(normalizeRepresentanteApertura),
    [representantesExt],
  );

  // ── Detalle (sólo en edición) ─────────────────────────────────────────────
  const { data: detalleResult, isLoading: isLoadingDetalle } =
    useAperturaDetalle(idApertura ?? 0);

  // ── Mutaciones ────────────────────────────────────────────────────────────
  const crear = useCrearApertura();
  const actualizar = useActualizarApertura();
  const eliminar = useEliminarApertura();

  // ── Estado local ──────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(!isEditing);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [cierreAbierto, setCierreAbierto] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const initialRef = useRef<string>('');
  const dirtyRef = useRef(false);

  const SK = isEditing ? `apertura:${idApertura}` : 'apertura:nueva';

  // ── Hidratar desde el backend (modo edición) ─────────────────────────────
  useEffect(() => {
    if (!isEditing || !detalleResult) return;
    const { detalle } = detalleResult;
    const initial = formToInitial(detalle);
    setForm(initial);
    setHydrated(true);
    initialRef.current = JSON.stringify(initial);
    dirtyRef.current = false;
  }, [detalleResult, isEditing]);

  // ── Hidratar desde sessionStorage (modo nueva o re-edición) ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SK);
      if (raw) {
        const parsed = JSON.parse(raw) as FormState;
        setForm({ ...EMPTY_FORM, ...parsed });
        initialRef.current = JSON.stringify(parsed);
      }
    } catch {
      // ignore
    }
  }, [SK]);

  // ── Autoguardado silencioso (debounce 800ms) ─────────────────────────────
  useEffect(() => {
    if (!hydrated || readOnly) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(SK, JSON.stringify(form));
        dirtyRef.current = true;
      } catch {
        // ignore quota errors
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, hydrated, readOnly, SK]);

  // ── Confirmación al salir con cambios ────────────────────────────────────
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  function intentarSalir() {
    router.push('/aperturas');
  }

  function handleVolver() {
    if (!dirtyRef.current) {
      intentarSalir();
      return;
    }
    setPendingNav(() => intentarSalir);
    setConfirmarSalida(true);
  }

  // ── Siembra del padrón al crear ──────────────────────────────────────────
  // El acta guarda a todas las personas convocadas con su asistencia en
  // verdadero o falso, no solo a las presentes, para que al reabrirla se pueda
  // corregir sin depender de los sistemas externos.
  useEffect(() => {
    if (isEditing || consejerosExt.length === 0) return;
    setForm((prev) =>
      prev.consejeros.length > 0
        ? prev
        : {
            ...prev,
            consejeros: consejerosExt.map((c, i) => ({
              orden: i + 1,
              asistencia: false,
              cargo: c.cargo,
              nombre: `${c.nombre} ${c.apellidos}`.trim(),
            })),
          },
    );
  }, [isEditing, consejerosExt]);

  useEffect(() => {
    if (isEditing || representantesNorm.length === 0) return;
    setForm((prev) =>
      prev.representantes.length > 0
        ? prev
        : {
            ...prev,
            representantes: representantesNorm.map((r, i) => ({
              orden: i + 1,
              asistencia: false,
              cargo: r.cargo,
              nombre: `${r.nombre} ${r.apellidos}`.trim(),
              id_partido: r.id_partido,
              imagen: r.partyImagePath ?? null,
            })),
          },
    );
  }, [isEditing, representantesNorm]);

  // ── Asistencia (la llave es `orden`, el renglón dentro del acta) ─────────
  function setConsejeroAsistencia(orden: number, value: boolean) {
    setForm((prev) => ({
      ...prev,
      consejeros: prev.consejeros.map((c) =>
        c.orden === orden ? { ...c, asistencia: value } : c,
      ),
    }));
  }

  function setTodosConsejeros(value: boolean) {
    setForm((prev) => ({
      ...prev,
      consejeros: prev.consejeros.map((c) => ({ ...c, asistencia: value })),
    }));
  }

  function setRepresentanteAsistencia(orden: number, value: boolean) {
    setForm((prev) => ({
      ...prev,
      representantes: prev.representantes.map((r) =>
        r.orden === orden ? { ...r, asistencia: value } : r,
      ),
    }));
  }

  function setTodosRepresentantes(value: boolean) {
    setForm((prev) => ({
      ...prev,
      representantes: prev.representantes.map((r) => ({
        ...r,
        asistencia: value,
      })),
    }));
  }

  // ── Validez del formulario ─────────────────────────────────────────────────
  // Reglas:
  //  - bodega obligatorio
  //  - fecha_apertura, hora_apertura obligatorias
  //  - motivo obligatorio
  //  - al menos 1 consejería con asistencia=true
  //  - si sacar_paquetes ≠ NINGUNO: al menos 1 paquete
  const requierePaquetes = form.sacar_paquetes !== 'NINGUNO';

  // El catálogo ya llega filtrado por el tipo de consejo del usuario (los
  // administradores reciben todas), así que se consume tal cual. Si la
  // elección del acta no viniera en él —por ejemplo, al consultar la apertura
  // de otro consejo— se agrega para que el campo siempre muestre lo guardado.
  const eleccionesPermitidas = useMemo(() => {
    const items = catalogos?.elecciones ?? [];
    if (form.bodega && !items.some((e) => e.clave === form.bodega)) {
      return [
        ...items,
        {
          id: -1,
          clave: form.bodega as TTipoEleccion,
          descripcion: ELECCION_LABEL[form.bodega as TTipoEleccion] ?? form.bodega,
        },
      ];
    }
    return items;
  }, [catalogos, form.bodega]);
  const algunConsejeroAsistio = useMemo(
    () => form.consejeros.some((c) => c.asistencia === true),
    [form.consejeros],
  );

  const esValido = useMemo(() => {
    if (!form.bodega) return false;
    if (!form.fecha_apertura) return false;
    if (!form.hora_apertura) return false;
    if (form.motivo.trim() === '') return false;
    if (form.motivo.length > 2000) return false;
    if (form.observaciones.length > 2000) return false;
    if (!algunConsejeroAsistio) return false;
    if (requierePaquetes && form.paquetes.length === 0) return false;
    return true;
  }, [
    form.bodega,
    form.fecha_apertura,
    form.hora_apertura,
    form.motivo,
    form.observaciones,
    algunConsejeroAsistio,
    form.paquetes,
    requierePaquetes,
  ]);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleGuardar() {
    if (!tipoChar || !idConsejoUser || !form.bodega) {
      toastError('Faltan datos obligatorios.');
      return;
    }
    if (!esValido) {
      toastError('Completa los campos obligatorios antes de guardar.');
      return;
    }
    const payload = {
      // El backend recibe `tipo_eleccion` en el body (no `bodega`); el form-state
      // interno lo modela como `bodega` por consistencia con el response.
      tipo_eleccion: form.bodega as TTipoEleccion,
      id_consejo: idConsejoUser,
      tipo_consejo: tipoChar,
      fecha_apertura: form.fecha_apertura,
      hora_apertura: form.hora_apertura,
      motivo: form.motivo,
      observaciones: form.observaciones || undefined,
      sellos_apertura: (form.sellos_apertura ? 'true' : 'false') as 'true' | 'false',
      sacar_paquetes: form.sacar_paquetes,
      consejeros: JSON.stringify(form.consejeros),
      representantes: JSON.stringify(form.representantes),
      otros: JSON.stringify(form.otros.map((o) => ({
        cargo: o.cargo,
        nombre: o.nombre,
        id_procedencia: o.id_procedencia,
      }))),
      paquetes: JSON.stringify(
        form.paquetes.map((p) => ({
          seccion: p.seccion,
          casilla: p.casilla,
        })),
      ),
    };

    try {
      if (isEditing && idApertura != null) {
        await actualizar.mutateAsync({ id: idApertura, ...payload });
      } else {
        await crear.mutateAsync(payload);
      }
      sessionStorage.removeItem(SK);
      dirtyRef.current = false;
    } catch {
      // El toast detallado (con el primer error de `response.data.errors`)
      // ya se dispara en el `onError` de la mutation correspondiente.
    }
  }

  function handleEliminar() {
    if (!idApertura) return;
    eliminar.mutate(idApertura);
    setConfirmarEliminar(false);
  }

  // ── Permisos ─────────────────────────────────────────────────────────────
  const canActualizar = hasPermission('bodegas.aperturas.actualizar');
  const canEliminar = hasPermission('bodegas.aperturas.eliminar');
  const cabecera: IAperturaBodega | null = detalleResult?.cabecera ?? null;
  const estaAbierta = cabecera ? cabecera.abierta : true;

  // ── Ruta de navegación ───────────────────────────────────────────────────
  // En edición/consulta el consejo viene en el `meta` del detalle; al crear
  // todavía no hay registro, así que se toma del consejo del usuario.
  const consejoMeta = detalleResult?.meta?.consejo ?? null;
  const tipoPlural =
    consejoMeta?.tipo_consejo_desc ??
    (tipoConsejoUser === 'distrital'
      ? 'Distritales'
      : tipoConsejoUser === 'municipal'
        ? 'Municipales'
        : null);
  const consejoLabel = consejoMeta
    ? `${consejoMeta.clave_consejo}. ${consejoMeta.consejo}`
    : user?.consejo
      ? `${user.claveConsejo}. ${user.consejo}`
      : null;
  const paginaActual = isEditing
    ? readOnly
      ? `Apertura #${idApertura}`
      : `Editar apertura #${idApertura}`
    : 'Nueva apertura';

  const isPending =
    crear.isPending || actualizar.isPending || eliminar.isPending;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isEditing && isLoadingDetalle) {
    return (
      <Container>
        <div className="space-y-4 py-6">
          <Skeleton className="h-10 w-1/3 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-72 w-full rounded-lg animate-pulse motion-reduce:animate-none" />
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>Bodegas Electorales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/aperturas">Aperturas</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {tipoPlural && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span>{tipoPlural}</span>
                    </BreadcrumbItem>
                  </>
                )}
                {consejoLabel && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span>{consejoLabel}</span>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{paginaActual}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              type="button"
              variant="secondary"
              onClick={handleVolver}
              disabled={isPending}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            {isEditing && canActualizar && estaAbierta && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCierreAbierto(true)}
                disabled={isPending}
              >
                <Lock className="h-4 w-4" />
                Cerrar apertura
              </Button>
            )}
            {isEditing && !readOnly && canEliminar && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmarEliminar(true)}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-4 pb-8">
          {/* ── Fila 1: Datos Generales · Consejerías · Representaciones ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ── Datos Generales ─────────────────────────────────────── */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Datos generales</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCatalogos ? (
                  <Skeleton className="h-32 w-full rounded animate-pulse motion-reduce:animate-none" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="bodega">
                        Tipo de elección <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.bodega || undefined}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            bodega: v as TTipoEleccion,
                          }))
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger id="bodega" className="mt-1.5">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {eleccionesPermitidas.map((e) => (
                            <SelectItem key={e.id} value={e.clave}>
                              {e.descripcion} ({e.clave})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fecha-apertura">
                        Fecha de apertura <span className="text-destructive">*</span>
                      </Label>
                      <DateTimePicker
                        dateOnly
                        value={form.fecha_apertura}
                        onChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            fecha_apertura: v.slice(0, 10),
                          }))
                        }
                        disabled={readOnly}
                      />
                    </div>

                    <div>
                      <Label htmlFor="hora-apertura">
                        Hora de apertura <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="hora-apertura"
                        type="time"
                        className="mt-1.5"
                        value={form.hora_apertura}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            hora_apertura: e.target.value,
                          }))
                        }
                        disabled={readOnly}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sacar-paquetes">
                        Sacar paquetes <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.sacar_paquetes}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            sacar_paquetes: v as TSacarPaquetesFront,
                          }))
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger id="sacar-paquetes" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SACAR_PAQUETES_OPTIONS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                      <Label htmlFor="sellos" className="cursor-pointer">
                        Sellos de apertura
                      </Label>
                      <Switch
                        id="sellos"
                        checked={form.sellos_apertura}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, sellos_apertura: v }))
                        }
                        disabled={readOnly}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="motivo">
                        Motivo <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="motivo"
                        className="mt-1.5"
                        rows={2}
                        value={form.motivo}
                        maxLength={2000}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, motivo: e.target.value }))
                        }
                        placeholder="Motivo de la apertura de la bodega"
                        disabled={readOnly}
                      />
                      <p
                        className={[
                          'mt-1 text-[11px] text-right tabular-nums',
                          form.motivo.length > 1900
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        ].join(' ')}
                        aria-live="polite"
                      >
                        {form.motivo.length} / 2000
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        className="mt-1.5"
                        rows={2}
                        value={form.observaciones}
                        maxLength={2000}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            observaciones: e.target.value,
                          }))
                        }
                        disabled={readOnly}
                        placeholder="Observaciones (opcional)"
                      />
                      <p
                        className={[
                          'mt-1 text-[11px] text-right tabular-nums',
                          form.observaciones.length > 1900
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        ].join(' ')}
                        aria-live="polite"
                      >
                        {form.observaciones.length} / 2000
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ConsejerosAsistenciaAperturaCard
              items={form.consejeros}
              loading={!isEditing && loadingConsejeros}
              readOnly={readOnly}
              onToggle={setConsejeroAsistencia}
              onToggleAll={setTodosConsejeros}
            />

            <RepresentacionesPPAperturaCard
              items={form.representantes}
              loading={!isEditing && loadingRep}
              error={!isEditing && errorRep}
              readOnly={readOnly}
              onToggle={setRepresentanteAsistencia}
              onToggleAll={setTodosRepresentantes}
            />
          </div>

          {/* ── Fila 2: Otras Personas · Paquetes ─────────────────────── */}
          <div
            className={[
              'grid grid-cols-1 gap-4 items-stretch',
              requierePaquetes ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
            ].join(' ')}
          >
            <OtrasPersonasAperturaCard
              items={form.otros}
              onChange={(items) => setForm((p) => ({ ...p, otros: items }))}
              readOnly={readOnly}
              procedencias={catalogos?.procedencias ?? []}
            />

            {requierePaquetes && (
              <PaquetesSelectorCard
                items={form.paquetes}
                onChange={(items) =>
                  setForm((p) => ({ ...p, paquetes: items }))
                }
                readOnly={readOnly}
                casillas={catalogos?.casillas ?? []}
                secciones={catalogos?.secciones ?? []}
                required
              />
            )}
          </div>
        </div>

        {/* ── Footer con Guardar ──────────────────────────────────────── */}
        {!readOnly && (
          <div className="sticky bottom-0 z-10 -mx-5 mt-4 border-t border-border bg-card/95 backdrop-blur px-5 py-3 flex items-center justify-end gap-2">
            {hydrated && !algunConsejeroAsistio && (
              <p
                className="mr-auto text-xs font-medium text-amber-600 dark:text-amber-500"
                role="alert"
              >
                Registra la asistencia de al menos una consejería para poder
                guardar.
              </p>
            )}
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={isPending || !esValido}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        )}
      </Container>

      {/* ── Diálogos ──────────────────────────────────────────────────── */}
      <CerrarAperturaDialog
        apertura={cabecera}
        open={cierreAbierto}
        onOpenChange={setCierreAbierto}
      />

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la apertura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se marcará como eliminada en el
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarSalida} onOpenChange={setConfirmarSalida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Se conservan en el borrador de esta
              sesión, pero si sales no podrás recuperarlos al volver.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmarSalida(false);
                pendingNav?.();
                setPendingNav(null);
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Helpers de hidratación ───────────────────────────────────────────────────

function formToInitial(detalle: IAperturaBodegaDetalleAPI): FormState {
  // El backend responde plano: cabecera + *_lista al mismo nivel.
  // `IAperturaBodegaDetalleAPI extends IAperturaBodega` → `detalle` ya tiene
  // todos los campos de cabecera, y los *_lista son propiedades hermanas.
  return {
    bodega: detalle.bodega,
    fecha_apertura: detalle.fecha_apertura,
    hora_apertura: detalle.hora_apertura.slice(0, 5),
    motivo: detalle.motivo ?? '',
    observaciones: detalle.observaciones ?? '',
    sellos_apertura: !!detalle.sellos_apertura,
    // El alta maneja tres opciones; la base además marca REINGRESO cuando el
    // paquete ya había salido, que para el formulario sigue siendo un ingreso.
    sacar_paquetes:
      detalle.sacar_paquetes === 'SALIDA'
        ? 'SALIDA'
        : detalle.sacar_paquetes === 'NINGUNO'
          ? 'NINGUNO'
          : 'INGRESO',
    consejeros: (detalle.consejeros_lista ?? []).map((c, i) => ({
      orden: c.orden ?? i + 1,
      asistencia: !!c.asistencia,
      cargo: c.cargo,
      nombre: c.nombre,
    })),
    representantes: (detalle.representantes_lista ?? []).map((r, i) => ({
      orden: r.orden ?? i + 1,
      asistencia: !!r.asistencia,
      cargo: r.cargo,
      nombre: r.nombre,
      id_partido: r.id_partido,
      imagen: r.imagen ?? null,
    })),
    otros: (detalle.otros_lista ?? []).map((o) => ({
      uid: uid(),
      cargo: o.cargo,
      nombre: o.nombre,
      id_procedencia: o.id_procedencia,
    })),
    paquetes: (detalle.paquetes_lista ?? []).map((p) => ({
      uid: uid(),
      seccion: p.seccion,
      // La base guarda la casilla en `tipo_casilla`; el alta la envía como
      // `casilla`, así que aquí se traduce al nombre que usa el formulario.
      casilla: p.tipo_casilla,
      casilla_desc: '',
    })),
  };
}

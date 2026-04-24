'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown, Minus, Vote, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVotar, useObtenerVotos, type TVoto, type IVotoInput } from './session-detail-data';
import type { ISesionDetalleAPI } from '@/types/sesiones';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface IVotoApi {
  id_sesion: number;
  id_punto: number;
  id_subpunto: number;
  id_asistencia: number;
  voto: TVoto;
}

type IPunto = ISesionDetalleAPI['pod'][number];
type IConsejero = ISesionDetalleAPI['asistencia'][number];

export interface VotacionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  punto: IPunto;
  consejeros: IConsejero[];
  idSesion: string;
  readonly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VOTOS: { value: TVoto; label: string; icon: React.ReactNode; activeClass: string }[] = [
  {
    value: 'AFAVOR',
    label: 'A favor',
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    activeClass: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
  },
  {
    value: 'ENCONTRA',
    label: 'En contra',
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    activeClass: 'bg-muted-foreground text-background border-muted-foreground hover:bg-muted-foreground/90',
  },
  {
    value: 'ABSTENCION',
    label: 'Abstención',
    icon: <Minus className="h-3.5 w-3.5" />,
    activeClass: 'bg-muted text-foreground border-border',
  },
];

// ─── VotacionDialog ───────────────────────────────────────────────────────────

export function VotacionDialog({ open, onOpenChange, punto, consejeros, idSesion, readonly = false }: VotacionDialogProps) {
  const queryClient = useQueryClient();
  const { mutate: votar, isPending: votando } = useVotar(idSesion);
  const { data: votosExistentes, isLoading: cargandoVotos } = useObtenerVotos(idSesion);

  const [votos, setVotos] = useState<Record<number, TVoto>>({});

  // Limpiar votos cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      setVotos({});
    }
  }, [open]);

  // Inicializar votos con datos existentes cuando se cargan
  useEffect(() => {
    if (votosExistentes?.data) {
      const votosMap: Record<number, TVoto> = {};
      votosExistentes.data
        .filter((voto: IVotoApi) =>
          voto.id_sesion === parseInt(idSesion) &&
          voto.id_punto === punto.id_punto &&
          voto.id_subpunto === punto.id_subpunto
        )
        .forEach((voto: IVotoApi) => {
          votosMap[voto.id_asistencia] = voto.voto;
        });
      setVotos(votosMap);
    }
  }, [votosExistentes, punto.id_punto, punto.id_subpunto, idSesion]);

  const handleCerrar = () => {
    queryClient.invalidateQueries({ queryKey: ['sesiones', 'detalle', idSesion] });
    queryClient.invalidateQueries({ queryKey: ['votos', idSesion] });
    onOpenChange(false);
  };

  const handleVoto = (idAsistencia: number, voto: TVoto) => {
    // Guardar voto anterior para revertir si falla
    const votoAnterior = votos[idAsistencia];

    // Actualizar estado local inmediatamente
    setVotos((prev) => ({ ...prev, [idAsistencia]: voto }));

    // Enviar voto automáticamente
    const payload = {
      id_asistencia: idAsistencia,
      id_punto: punto.id_punto,
      id_subpunto: punto.id_subpunto,
      voto: voto,
    };

    votar(payload, {
      onError: () => {
        // Revertir al estado anterior si falla
        setVotos((prev) => {
          const next = { ...prev };
          if (votoAnterior !== undefined) {
            next[idAsistencia] = votoAnterior;
          } else {
            delete next[idAsistencia];
          }
          return next;
        });
      },
    });
  };

  const resumen = {
    afavor: Object.values(votos).filter((v) => v === 'AFAVOR').length,
    encontra: Object.values(votos).filter((v) => v === 'ENCONTRA').length,
    abstencion: Object.values(votos).filter((v) => v === 'ABSTENCION').length,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCerrar(); }}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary shrink-0" />
            Votación
          </DialogTitle>
        </DialogHeader>

        {/* Punto */}
        <div className="space-y-1 pb-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Punto:</p>
          <p className="text-sm text-foreground leading-relaxed">{punto.descripcion}</p>
        </div>

        {/* Tabla de votos */}
        <ScrollArea className="flex-1 min-h-0">
          {cargandoVotos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando votos...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-foreground py-2 pr-4 w-1/2">Consejero</th>
                <th className="text-center font-semibold text-foreground py-2">Voto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {consejeros.filter((c) => c.cargo?.toUpperCase() !== 'SECRETARÍA').map((c) => {
                const idAsistencia = c.id_asistencia!;
                const votoActual = votos[idAsistencia];
                const nombre = `${c.nombre ?? ''} ${c.apellidos ?? ''}`.trim();

                return (
                  <tr key={idAsistencia} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground leading-tight">{nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.cargo}</p>
                      {!c.asistencia && (
                        <Badge variant="secondary" appearance="light" size="sm" className="mt-1">
                          No asistió
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {VOTOS.map(({ value, label, icon, activeClass }) => (
                          <button
                            key={value}
                            type="button"
                            disabled={readonly}
                            onClick={() => !readonly && handleVoto(idAsistencia, value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                              readonly
                                ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                                : votoActual === value
                                ? activeClass
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </ScrollArea>

        {/* Resumen */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground font-medium">Resumen:</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <ThumbsUp className="h-3.5 w-3.5" /> {resumen.afavor} a favor
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <ThumbsDown className="h-3.5 w-3.5" /> {resumen.encontra} en contra
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Minus className="h-3.5 w-3.5" /> {resumen.abstencion} abstención
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCerrar}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

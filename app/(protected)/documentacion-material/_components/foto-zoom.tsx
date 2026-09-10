'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_PASO = 0.5;

/**
 * Visor con zoom de una fotografía: botones de acercar, alejar, ajustar y
 * rotar, rueda del ratón, doble clic para acercar/restablecer y arrastre para
 * desplazarse cuando la imagen está ampliada. Ocupa el alto que le dé el
 * contenedor (`className`).
 */
export function FotoZoom({
  src,
  alt,
  className = 'h-72',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  /** Giro en grados, en pasos de 90. */
  const [rotacion, setRotacion] = useState(0);
  const arrastre = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const marco = useRef<HTMLDivElement>(null);

  // Al cambiar de fotografía se vuelve al encuadre inicial.
  useEffect(() => {
    setZoom(ZOOM_MIN);
    setDesplazamiento({ x: 0, y: 0 });
    setRotacion(0);
  }, [src]);

  const ajustar = useCallback((valor: number) => {
    const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor));
    setZoom(nuevo);
    if (nuevo === ZOOM_MIN) setDesplazamiento({ x: 0, y: 0 });
  }, []);

  // La rueda del ratón acerca o aleja sin desplazar la ventana de fondo.
  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const nuevo = Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, z - Math.sign(e.deltaY) * ZOOM_PASO),
        );
        if (nuevo === ZOOM_MIN) setDesplazamiento({ x: 0, y: 0 });
        return nuevo;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom === ZOOM_MIN) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = {
      x: e.clientX,
      y: e.clientY,
      ox: desplazamiento.x,
      oy: desplazamiento.y,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastre.current) return;
    setDesplazamiento({
      x: arrastre.current.ox + (e.clientX - arrastre.current.x),
      y: arrastre.current.oy + (e.clientY - arrastre.current.y),
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    arrastre.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const ampliada = zoom > ZOOM_MIN;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={marco}
        role="img"
        aria-label={alt}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => ajustar(ampliada ? ZOOM_MIN : 2)}
        className={`${className} relative w-full overflow-hidden rounded-lg border border-border bg-muted/40 select-none touch-none ${
          ampliada ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full object-contain transition-transform duration-100 motion-reduce:transition-none"
          style={{
            transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px) scale(${zoom}) rotate(${rotacion}deg)`,
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(zoom * 100)}%{rotacion ? ` · ${rotacion}°` : ''}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Alejar"
                disabled={zoom <= ZOOM_MIN}
                onClick={() => ajustar(zoom - ZOOM_PASO)}
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alejar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Acercar"
                disabled={zoom >= ZOOM_MAX}
                onClick={() => ajustar(zoom + ZOOM_PASO)}
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Acercar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Girar 90 grados"
                onClick={() => setRotacion((r) => (r + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Girar 90°</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Ajustar a la ventana"
                disabled={!ampliada && rotacion === 0}
                onClick={() => {
                  ajustar(ZOOM_MIN);
                  setRotacion(0);
                }}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajustar a la ventana</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

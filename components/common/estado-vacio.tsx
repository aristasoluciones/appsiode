import { FolderOpen, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  /** Con búsqueda o filtros activos cambia el icono y ofrece limpiarlos. */
  busqueda?: boolean;
  onLimpiar?: () => void;
  icono?: React.ReactNode;
}

/** Lista sin datos o sin coincidencias, con el mismo aspecto en todos los módulos. */
export function EstadoVacio({
  titulo,
  descripcion,
  busqueda = false,
  onLimpiar,
  icono,
}: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div
        className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground [&>svg]:h-7 [&>svg]:w-7"
        aria-hidden="true"
      >
        {icono ?? (busqueda ? <SearchX /> : <FolderOpen />)}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-muted-foreground max-w-sm">{descripcion}</p>
      )}
      {busqueda && onLimpiar && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary mt-3"
          onClick={onLimpiar}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

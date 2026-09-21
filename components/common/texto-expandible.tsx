'use client';

import { useState } from 'react';

interface TextoExpandibleProps {
  texto: string;
  /** Caracteres visibles antes de recortar. */
  limite?: number;
  className?: string;
}

/** Texto largo recortado con «Ver más» / «Ver menos»; si cabe, se muestra completo. */
export function TextoExpandible({
  texto,
  limite = 160,
  className,
}: TextoExpandibleProps) {
  const [abierto, setAbierto] = useState(false);
  const largo = texto.length > limite;
  const visible =
    !largo || abierto ? texto : `${texto.slice(0, limite).trimEnd()}…`;

  return (
    <span className={className}>
      {visible}
      {largo && (
        <>
          {' '}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="text-xs font-medium text-primary hover:underline underline-offset-2"
          >
            {abierto ? 'Ver menos' : 'Ver más'}
          </button>
        </>
      )}
    </span>
  );
}

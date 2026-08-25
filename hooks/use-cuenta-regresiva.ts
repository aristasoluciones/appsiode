'use client';

import { useEffect, useState } from 'react';

/**
 * Cuenta regresiva hasta un momento dado (epoch ms).
 *
 * Devuelve los segundos que faltan y se detiene en cero. Con `hasta` en `null`
 * no hay cuenta corriendo. Pensado para deshabilitar un botón mientras dura el
 * bloqueo temporal por demasiados intentos.
 */
export function useCuentaRegresiva(hasta: number | null): number {
  const [restante, setRestante] = useState(() => calcular(hasta));

  useEffect(() => {
    setRestante(calcular(hasta));
    if (hasta === null) return;

    const intervalo = setInterval(() => {
      const segundos = calcular(hasta);
      setRestante(segundos);
      if (segundos <= 0) clearInterval(intervalo);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [hasta]);

  return restante;
}

function calcular(hasta: number | null): number {
  if (hasta === null) return 0;
  return Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
}

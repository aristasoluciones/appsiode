'use client';

import { useRef, useCallback } from 'react';

export function useRecaptchaV2(_siteKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback((): string | null => {
    // Stub: always returns a mock token in development
    return 'mock-recaptcha-token';
  }, []);

  const resetCaptcha = useCallback(() => {
    // Stub: no-op
  }, []);

  const initializeRecaptcha = useCallback(() => {
    // Stub: no-op
  }, []);

  return { containerRef, getToken, resetCaptcha, initializeRecaptcha };
}

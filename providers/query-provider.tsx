'use client';

import { ReactNode, useState } from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import axios from 'axios';
import { toastAxiosError } from '@/lib/toast';

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              const status = error?.response?.status as number | undefined;
              // No reintentar si el servidor respondió con un status code (4xx o 5xx)
              if (status != null) return false;
              // Solo reintentar 1 vez por problemas de red real (sin status)
              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 403) return;
            toastAxiosError(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => toastAxiosError(error),
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { QueryProvider };

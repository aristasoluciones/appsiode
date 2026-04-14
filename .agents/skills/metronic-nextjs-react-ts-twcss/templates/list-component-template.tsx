// ============================================================
// TEMPLATE: app/(protected)/[module-name]/components/[module-name]-list.tsx
// Client Component — list / table view with toolbar actions
//
// Replace all [Bracketed] placeholders before use:
//   [ModuleName]  → e.g. Sesiones
//   [module-name] → e.g. sesiones
// ============================================================
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Folder, AlertTriangle } from 'lucide-react';
import [ModuleName]Table from './[module-name]-columns';
import [ModuleName]Form from './[module-name]-form';
import { use[ModuleName]Data } from './[module-name]-data';

export default function [ModuleName]List() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = use[ModuleName]Data({ search });

  // ── Loading ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
        ))}
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-danger mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Error al cargar los datos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {error?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <Button variant="primary" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card>
        {/* ── Card Header ───────────────────────────────────── */}
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                [ModuleName]
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data?.length ?? 0} registros encontrados
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9 w-48 sm:w-64"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Create button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ── Table ─────────────────────────────────────────── */}
        <CardBody>
          {!data || data.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Sin registros
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Comienza creando el primer elemento.
              </p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Crear nuevo
              </Button>
            </div>
          ) : (
            <[ModuleName]Table data={data} />
          )}
        </CardBody>
      </Card>

      {/* ── Create / Edit Dialog ──────────────────────────── */}
      {showForm && (
        <[ModuleName]Form
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </>
  );
}

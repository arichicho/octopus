"use client";

import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log para Vercel/Hosting
    console.error('Dashboard error boundary:', { message: error.message, digest: error.digest });
    console.error('DIGEST DEL ERROR:', error.digest);
    console.error('MENSAJE DEL ERROR:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <h2 className="text-xl font-semibold">Ocurrió un error cargando el Dashboard</h2>
      {error?.digest ? (
        <p className="text-sm text-muted-foreground">Código de referencia: {error.digest}</p>
      ) : null}
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}


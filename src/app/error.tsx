"use client";

import { useEffect } from 'react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error boundary:', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Ocurrió un error</h2>
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


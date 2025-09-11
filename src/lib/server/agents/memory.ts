type UpsertItem = { id: string; text: string; metadata?: Record<string, any> };

function serviceBase(): string | null {
  const base = process.env.MIDAI_SERVICE_URL || process.env.MIDAI_VECTOR_URL || null;
  return base ? base.replace(/\/$/, '') : null;
}

export async function memUpsert(items: UpsertItem[]): Promise<{ upserted: number }>{
  const base = serviceBase();
  if (!base || items.length === 0) return { upserted: 0 };
  try {
    const res = await fetch(`${base}/mem/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) return { upserted: 0 };
    const json = await res.json();
    return { upserted: json.upserted || 0 };
  } catch {
    return { upserted: 0 };
  }
}

export async function memSearch(query: string, topK: number = 5): Promise<Array<{ id: string; score: number; metadata?: any }>>{
  const base = serviceBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/mem/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK })
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  } catch {
    return [];
  }
}


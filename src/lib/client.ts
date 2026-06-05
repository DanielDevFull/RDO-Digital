'use client';

// Cliente HTTP simples para consumir a API REST interna.
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Erro ${res.status}`);
  }
  return json.data as T;
}

export function downloadReport(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  window.open(`/api/reports?${qs}`, '_blank');
}

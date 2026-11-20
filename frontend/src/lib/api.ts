// Small fetch wrapper for the FastAPI backend. TanStack Query calls these.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`);
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Data that only changes when an import runs (places, artifacts) is exported to static JSON in
 * public/data/ by backend/scripts/export_static_data.py, and Cloudflare serves it with the site.
 * Reading it there means a visit never waits for the Render server to wake up.
 *
 * Falls back to the API when the file isn't there, e.g. in local development before an export.
 * A missing file comes back as the site's index.html (status 200), so the content type is checked.
 */
export async function staticGet<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`/data${path}.json`);
    if (res.ok && res.headers.get('content-type')?.includes('json')) return (await res.json()) as T;
  } catch {
    // Network error or bad JSON: try the API instead.
  }
  return apiGet<T>(path);
}

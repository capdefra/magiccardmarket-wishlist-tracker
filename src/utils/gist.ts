import { TrackerData } from '../types';

const TOKEN_KEY = 'cardmarket-tracker-gh-token';
const GIST_ID_KEY = 'cardmarket-tracker-gist-id';
const GIST_FILENAME = 'cardmarket-tracker-data.json';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(GIST_ID_KEY);
}

export function getGistId(): string | null {
  return localStorage.getItem(GIST_ID_KEY);
}

function setGistId(id: string): void {
  localStorage.setItem(GIST_ID_KEY, id);
}

async function apiRequest(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
  return res;
}

// Find existing gist or create a new one
async function ensureGist(token: string): Promise<string> {
  const existingId = getGistId();
  if (existingId) {
    // Verify it still exists
    try {
      await apiRequest(`/gists/${existingId}`, token);
      return existingId;
    } catch {
      // Gist deleted, create new one
    }
  }

  // Search user's gists for our file
  const res = await apiRequest('/gists?per_page=100', token);
  const gists = await res.json();
  for (const gist of gists) {
    if (gist.files[GIST_FILENAME]) {
      setGistId(gist.id);
      return gist.id;
    }
  }

  // Create new gist
  const createRes = await apiRequest('/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Cardmarket Wishlist Tracker Data',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify({ cards: {} }, null, 2),
        },
      },
    }),
  });
  const created = await createRes.json();
  setGistId(created.id);
  return created.id;
}

export async function loadFromGist(token: string): Promise<TrackerData> {
  const gistId = await ensureGist(token);
  const res = await apiRequest(`/gists/${gistId}`, token);
  const gist = await res.json();
  const file = gist.files[GIST_FILENAME];
  if (!file) {
    return { cards: {} };
  }
  return JSON.parse(file.content) as TrackerData;
}

export async function saveToGist(token: string, data: TrackerData): Promise<void> {
  const gistId = await ensureGist(token);
  await apiRequest(`/gists/${gistId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await apiRequest('/user', token);
    const user = await res.json();
    return !!user.login;
  } catch {
    return false;
  }
}

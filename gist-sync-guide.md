# GitHub Gist Sync for Client-Side Apps

Cross-device data sync for static sites (GitHub Pages, SPAs) using GitHub Gists as a free JSON store.

## Overview

- **No backend needed** — uses GitHub API directly from the browser
- **Auth** — GitHub Personal Access Token with `gist` scope, stored in `localStorage`
- **Storage** — A single private Gist containing one JSON file
- **Sync strategy** — Merge on load, debounced save on change

## Setup

User creates a GitHub PAT at `github.com/settings/tokens` with the `gist` scope, then pastes it into the app. The token is stored in `localStorage`.

## Architecture

```
localStorage (primary)  ←→  React state  ←→  GitHub Gist (remote sync)
```

Three files handle everything:

### 1. `gist.ts` — GitHub API layer

```typescript
// Change these constants for your project
const TOKEN_KEY = 'my-app-gh-token';       // e.g. 'cardmarket-tracker-gh-token'
const GIST_ID_KEY = 'my-app-gist-id';      // e.g. 'cardmarket-tracker-gist-id'
const GIST_FILENAME = 'my-app-data.json';  // e.g. 'cardmarket-tracker-data.json'

// Token management
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

// Generic GitHub API helper
async function apiRequest(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res;
}

// Find existing gist or create a new one
async function ensureGist(token: string): Promise<string> {
  // 1. Check cached gist ID
  const existingId = localStorage.getItem(GIST_ID_KEY);
  if (existingId) {
    try {
      await apiRequest(`/gists/${existingId}`, token);
      return existingId;
    } catch { /* gist deleted, continue */ }
  }

  // 2. Search user's gists for our filename
  const res = await apiRequest('/gists?per_page=100', token);
  const gists = await res.json();
  for (const gist of gists) {
    if (gist.files[GIST_FILENAME]) {
      localStorage.setItem(GIST_ID_KEY, gist.id);
      return gist.id;
    }
  }

  // 3. Create new private gist
  const createRes = await apiRequest('/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: 'My App Data',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify({}, null, 2) } },
    }),
  });
  const created = await createRes.json();
  localStorage.setItem(GIST_ID_KEY, created.id);
  return created.id;
}

// Load data from gist
export async function loadFromGist(token: string): Promise<MyData> {
  const gistId = await ensureGist(token);
  const res = await apiRequest(`/gists/${gistId}`, token);
  const gist = await res.json();
  const file = gist.files[GIST_FILENAME];
  return file ? JSON.parse(file.content) : {};
}

// Save data to gist
export async function saveToGist(token: string, data: MyData): Promise<void> {
  const gistId = await ensureGist(token);
  await apiRequest(`/gists/${gistId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
    }),
  });
}

// Validate token works
export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await apiRequest('/user', token);
    const user = await res.json();
    return !!user.login;
  } catch { return false; }
}
```

### 2. `useData.ts` — React hook with sync logic

```typescript
export function useData() {
  const [data, setData] = useState<MyData>(() => loadLocal());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const syncTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Debounced save — waits 1.5s after last change before pushing to Gist
  const syncToGist = useCallback((newData: MyData) => {
    const token = getToken();
    if (!token) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await saveToGist(token, newData);
        setSyncStatus('synced');
      } catch { setSyncStatus('error'); }
    }, 1500);
  }, []);

  // Save locally + queue gist sync
  const persist = useCallback((newData: MyData) => {
    saveLocal(newData);
    syncToGist(newData);
  }, [syncToGist]);

  // On mount: pull remote, merge both directions, push result
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setSyncStatus('syncing');
    loadFromGist(token)
      .then((remote) => {
        const local = loadLocal();
        const merged = mergeData(local, remote); // your merge logic
        saveLocal(merged);
        setData(merged);
        saveToGist(token, merged).catch(() => {});
        setSyncStatus('synced');
      })
      .catch(() => setSyncStatus('error'));
  }, []);

  // ... addData, replaceData, deleteData, clearAll, forceSync
  return { data, syncStatus, /* actions */ };
}
```

### 3. UI — Token input + sync status

```tsx
// In your settings/data management component:
{hasToken ? (
  <div>
    <span className={`sync-indicator ${syncStatus}`}>{syncLabel}</span>
    <button onClick={onForceSync}>Force Sync</button>
    <button onClick={handleDisconnect}>Disconnect</button>
  </div>
) : (
  <div>
    <input type="password" placeholder="ghp_..." value={tokenInput} onChange={...} />
    <button onClick={handleSaveToken}>Connect</button>
  </div>
)}
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `localStorage` as primary | App works offline, Gist is just sync |
| Debounce saves (1.5s) | Avoids GitHub rate limits on rapid edits |
| Bidirectional merge on load | Handles data added on different devices |
| `ensureGist` auto-creates | Zero setup for user beyond the token |
| Private gist | Data not publicly visible |
| Cache gist ID in localStorage | Avoids searching gists on every API call |

## Gotchas & Lessons Learned

1. **Merge carefully** — If you merge remote into local and local into merged in the same pass using the same object, you can double entries. Use separate merge passes with distinct input objects.

2. **Deduplication** — Even with good merge logic, have a dedup function as a safety net. Keep the last entry per unique key.

3. **GitHub API rate limit** — 5,000 requests/hour for authenticated users. The debounce helps, but `forceSync` should be manual only.

4. **Gist size limit** — Gists can hold up to 10MB per file. Fine for JSON config/tracking data, not for large datasets.

5. **Token scope** — Only `gist` scope is needed. Never request more permissions than necessary.

## Adapting to Your Project

1. Replace `MyData` with your data type
2. Change the three constants: `TOKEN_KEY`, `GIST_ID_KEY`, `GIST_FILENAME`
3. Implement `mergeData()` appropriate to your data structure
4. Wire the hook into your React app

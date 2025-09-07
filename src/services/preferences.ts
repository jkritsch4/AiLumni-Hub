export type NotificationPrefs = Record<string, boolean> & { reminderHours?: number };

export type AccountInfo = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // never send a raw password to your API
  affiliation: '' | 'Fan' | 'Alumni' | 'Relative' | 'Other' | 'Parent' | 'Student';
};

export type UserPreferences = {
  userId: string;
  notifications?: NotificationPrefs;
  account?: Omit<AccountInfo, 'password'>;
  updatedAt?: string;
};

// Default to your Invoke URL if env var is not set (used in production)
const DEFAULT_API_URL = 'https://n54ugywlg2.execute-api.us-west-2.amazonaws.com';
const API_URL = (import.meta.env.VITE_PREFS_API_URL as string | undefined) || DEFAULT_API_URL;

// In dev, use the Vite proxy base to avoid CORS; in prod, use the absolute URL.
function apiBase(): string {
  const base = import.meta.env.DEV ? '/api' : API_URL;
  return base.replace(/\/+$/, '');
}

function toLegacyNotificationTypes(n?: NotificationPrefs): string[] {
  if (!n) return [];
  const out: string[] = [];
  if ((n as any).gameReminders) out.push('pregame_reminders');
  if ((n as any).gameResults) out.push('postgame_results');
  if ((n as any).standingsUpdates) out.push('standings_updates');
  if ((n as any).emailNotifications) out.push('email_notifications');
  return out;
}

function fromLegacyNotificationTypes(types: string[] | undefined, reminderHours?: number): NotificationPrefs | undefined {
  if (!types) return undefined;
  const set = new Set(types);
  const obj: NotificationPrefs = {
    gameReminders: set.has('pregame_reminders'),
    gameResults: set.has('postgame_results'),
    standingsUpdates: set.has('standings_updates'),
    emailNotifications: set.has('email_notifications')
  };
  if (typeof reminderHours === 'number') obj.reminderHours = reminderHours;
  return obj;
}

const LS_KEY = (userId: string) => `prefs:${userId}`;

function readLocal(userId: string): UserPreferences | null {
  try {
    const raw = localStorage.getItem(LS_KEY(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(userId: string, data: Partial<UserPreferences>): UserPreferences {
  const prev = readLocal(userId) || ({ userId } as UserPreferences);
  const merged: UserPreferences = { ...prev, ...data, userId };
  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(merged));
  } catch {}
  return merged;
}

function makeUrls(userId: string) {
  const base = apiBase();
  const encoded = encodeURIComponent(userId);
  return {
    path: `${base}/preferences/${encoded}`,
    reset: `${base}/password-reset`
  };
}

async function tryFetch(url: string, init: RequestInit) {
  // Only set Content-Type for non-GET requests to avoid unnecessary preflights
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (method !== 'GET' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const finalInit: RequestInit = {
    ...init,
    method,
    headers,
    // In dev (proxy), this is same-origin; in prod, CORS is fine.
    mode: 'cors'
  };
  // Log payload only if it exists and is JSON
  let payload: any = '';
  if (finalInit.body && typeof finalInit.body === 'string') {
    try { payload = JSON.parse(finalInit.body); } catch { payload = finalInit.body; }
  }
  console.debug('[PrefsAPI] fetch', method, url, payload);
  const res = await fetch(url, finalInit);
  console.debug('[PrefsAPI] response', res.status, res.statusText, url);
  return res;
}

function normalizeFromBackend(userId: string, data: any): UserPreferences {
  const account =
    data?.account ??
    (() => {
      const name: string = data?.name || '';
      const [firstName, ...rest] = name.split(' ');
      return {
        firstName: firstName || '',
        lastName: rest.join(' ') || '',
        email: data?.email || '',
        affiliation: data?.user_type || ''
      };
    })();

  const notifications =
    data?.notifications ??
    fromLegacyNotificationTypes(data?.notification_types, data?.reminderHours);

  return {
    userId,
    account,
    notifications,
    updatedAt: data?.updatedAt
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { path } = makeUrls(userId);

  try {
    const res = await tryFetch(path, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeFromBackend(userId, data);
      writeLocal(userId, normalized);
      return normalized;
    }
    // If not found or other client errors, fall back to local cache
    if ([400, 404, 405].includes(res.status)) {
      return readLocal(userId);
    }
  } catch (e) {
    console.warn('[PrefsAPI] GET failed, returning local cache', e);
  }

  return readLocal(userId);
}

export async function saveUserPreferences(userId: string, delta: Partial<UserPreferences>): Promise<{ ok: true }> {
  // Merge and cache locally first for instant UX
  const current = await getUserPreferences(userId);
  const next: UserPreferences = { ...(current || { userId }), ...delta, userId };
  writeLocal(userId, next);

  // Build payload your backend understands (legacy-compatible)
  const name = next.account ? `${next.account.firstName ?? ''} ${next.account.lastName ?? ''}`.trim() : (current as any)?.name;
  const payload: any = {
    userId,
    name,
    email: next.account?.email ?? (current as any)?.email ?? '',
    user_type: next.account?.affiliation ?? (current as any)?.user_type ?? '',
    notification_types: toLegacyNotificationTypes(next.notifications ?? current?.notifications),
  };
  if ((next.notifications?.reminderHours ?? current?.notifications?.reminderHours) != null) {
    payload.reminderHours = next.notifications?.reminderHours ?? current?.notifications?.reminderHours;
  }
  if ((current as any)?.subscribed_teams) payload.subscribed_teams = (current as any)?.subscribed_teams;
  if ((current as any)?.phone_number)    payload.phone_number    = (current as any)?.phone_number;

  const { path } = makeUrls(userId);

  try {
    const res = await tryFetch(path, { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[PrefsAPI] save failed', res.status, text);
      // Keep local cache; backend will sync next time
    }
  } catch (e) {
    console.warn('[PrefsAPI] POST failed; keeping local cache', e);
  }

  return { ok: true };
}

export async function requestPasswordResetEmail(email: string): Promise<{ ok: true }> {
  if (!email) return { ok: true };
  const { reset } = makeUrls('unused');
  try {
    const res = await tryFetch(reset, { method: 'POST', body: JSON.stringify({ email }) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[PrefsAPI] password reset failed', res.status, text);
    }
  } catch (e) {
    console.warn('[PrefsAPI] password reset request failed', e);
  }
  return { ok: true };
}
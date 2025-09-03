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

// Fall back to provided Invoke URL if env is not set
const DEFAULT_API_URL = 'https://n54ugywlg2.execute-api.us-west-2.amazonaws.com';
const API_URL = (import.meta.env.VITE_PREFS_API_URL as string | undefined) || DEFAULT_API_URL;

function apiBase(): string {
  if (!API_URL) throw new Error('VITE_PREFS_API_URL is missing');
  return API_URL.replace(/\/+$/, '');
}

function toLegacyNotificationTypes(n?: NotificationPrefs): string[] {
  if (!n) return [];
  const out: string[] = [];
  if (n.gameReminders) out.push('pregame_reminders');
  if (n.gameResults) out.push('postgame_results');
  if (n.standingsUpdates) out.push('standings_updates');
  if (n.emailNotifications) out.push('email_notifications');
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
  const prev = readLocal(userId) || { userId } as UserPreferences;
  const merged: UserPreferences = { ...prev, ...data, userId };
  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(merged));
  } catch {}
  return merged;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const res = await fetch(`${apiBase()}/preferences/${encodeURIComponent(userId)}`, { method: 'GET' });
    if (!res.ok) {
      // fall back to cache for non-200s
      return readLocal(userId);
    }
    const data = await res.json();

    // Normalize backend response into UI shape
    const account =
      data.account ??
      (() => {
        const name: string = data.name || '';
        const [firstName, ...rest] = name.split(' ');
        return {
          firstName: firstName || '',
          lastName: rest.join(' ') || '',
          email: data.email || '',
          affiliation: data.user_type || ''
        };
      })();

    const notifications =
      data.notifications ??
      fromLegacyNotificationTypes(data.notification_types, data.reminderHours);

    const normalized: UserPreferences = {
      userId,
      account,
      notifications,
      updatedAt: data.updatedAt
    };

    // keep cache in sync
    writeLocal(userId, normalized);
    return normalized;
  } catch {
    return readLocal(userId);
  }
}

export async function saveUserPreferences(userId: string, delta: Partial<UserPreferences>): Promise<{ ok: true }> {
  // Merge and cache locally for instant UX
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

  // Optional passthroughs if you use them on the backend
  if ((current as any)?.subscribed_teams) payload.subscribed_teams = (current as any)?.subscribed_teams;
  if ((current as any)?.phone_number) payload.phone_number = (current as any)?.phone_number;

  try {
    const res = await fetch(`${apiBase()}/preferences/${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to save preferences: ${res.status} ${text}`);
    }
  } catch {
    // Keep local cache; backend will sync next time
  }

  return { ok: true };
}

export async function requestPasswordResetEmail(email: string): Promise<{ ok: true }> {
  if (!email) return { ok: true };
  const res = await fetch(`${apiBase()}/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Password reset failed: ${res.status} ${text}`);
  }
  return { ok: true };
}
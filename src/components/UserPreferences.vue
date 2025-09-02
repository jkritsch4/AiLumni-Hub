<template>
  <div class="dashboard">
    <div class="dashboard-title">
      <img
        :src="homeTeamLogo || '/images/ucsd-trident.svg'"
        alt="Team Logo"
        class="team-logo"
        style="width: 100px; height: auto; margin-top: 40px;"
        @error="(event: Event) => { 
          const target = event.target as HTMLImageElement;
          if (target) target.src = '/images/default-logo.png';
        }"
      />
      <h2 class="sport-name">{{ selectedSport }}</h2>
    </div>

    <div class="content-sections">
      <!-- 1) Push Notification Settings (from shared config) -->
      <section class="preferences-section">
        <h2 class="section-title">Notification Settings</h2>

        <div class="pref-card">
          <div class="section-header">
            <span class="section-icon">🔔</span>
            <span class="section-heading">Push Notification Settings</span>
          </div>

          <div class="rows">
            <div
              v-for="q in notificationQuestions"
              :key="q.key"
              class="row"
            >
              <div class="row-text">
                <div class="row-title">{{ q.title }}</div>
                <div class="row-sub">{{ q.description }}</div>
              </div>
              <button
                class="toggle"
                type="button"
                role="switch"
                :aria-checked="String(notifications[q.key])"
                :class="{ on: notifications[q.key] }"
                @click="toggle(q.key)"
              >
                <span class="knob" />
              </button>
            </div>

            <!-- Extra control mirrored from onboarding (if present) -->
            <div v-if="reminderHours != null" class="row field">
              <div class="row-text">
                <label class="row-title" for="reminderHours">
                  Reminder Time (hours before game)
                </label>
                <div class="row-sub">Set how early we should remind you</div>
              </div>
              <input
                id="reminderHours"
                type="number"
                min="0"
                max="48"
                step="1"
                v-model.number="reminderHours"
                class="input"
                @change="markDirty('notifications')"
              />
            </div>
          </div>

          <div class="actions">
            <button class="btn" :disabled="saving.notifications" @click="saveNotificationSettings">
              {{ saving.notifications ? 'Saving...' : 'Save Notification Settings' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 2) Account Information -->
      <section class="preferences-section">
        <h2 class="section-title">Account Information</h2>

        <div class="pref-card">
          <div class="rows grid">
            <div class="field-block">
              <label class="field-label">First Name</label>
              <input class="input" v-model.trim="account.firstName" @input="markDirty('account')" />
            </div>

            <div class="field-block">
              <label class="field-label">Last Name</label>
              <input class="input" v-model.trim="account.lastName" @input="markDirty('account')" />
            </div>

            <div class="field-block">
              <label class="field-label">Email (username)</label>
              <input class="input" type="email" v-model.trim="account.email" @input="markDirty('account')" />
            </div>

            <div class="field-block">
              <label class="field-label">Password</label>
              <input class="input" type="password" v-model.trim="account.password" @input="markDirty('account')" />
              <button class="link" type="button" @click="requestPasswordReset">Reset password</button>
            </div>

            <div class="field-block">
              <label class="field-label">Affiliation</label>
              <select class="input" v-model="account.affiliation" @change="markDirty('account')">
                <option value="">Select</option>
                <option value="Fan">Fan</option>
                <option value="Alumni">Alumni</option>
                <option value="Relative">Relative</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn" :disabled="saving.account" @click="saveAccountInfo">
              {{ saving.account ? 'Saving...' : 'Save Account Information' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { notificationQuestions } from '../config/notifications';
import {
  getUserPreferences,
  saveUserPreferences,
  requestPasswordResetEmail,
  type NotificationPrefs,
  type AccountInfo
} from '../services/preferences';

const props = defineProps({
  homeTeamLogo: { type: String, default: '' },
  selectedSport: { type: String, default: 'BASEBALL' }
});

// Identify user (replace with your auth ID if available)
const userId = ref<string>(localStorage.getItem('userId') || localStorage.getItem('email') || 'anonymous');

// State
const notifications = reactive<Record<string, boolean>>(
  Object.fromEntries(notificationQuestions.map(q => [q.key, !!q.default]))
);
const reminderHours = ref<number | null>(
  notificationQuestions.some(q => q.key === 'reminderHours') ? 2 : null
);

const account = reactive<AccountInfo>({
  firstName: '',
  lastName: '',
  email: typeof userId.value === 'string' && userId.value.includes('@') ? userId.value : '',
  password: '',
  affiliation: ''
});

const saving = reactive({ notifications: false, account: false });
const dirty = reactive({ notifications: false, account: false });

function toggle(key: string) {
  notifications[key] = !notifications[key];
  markDirty('notifications');
}

function markDirty(which: keyof typeof dirty) {
  dirty[which] = true;
}

// Load existing prefs
onMounted(async () => {
  try {
    const existing = await getUserPreferences(userId.value);
    if (existing?.notifications) {
      Object.entries(existing.notifications).forEach(([k, v]) => {
        if (k in notifications) notifications[k] = !!v;
      });
      if (typeof existing.notifications.reminderHours === 'number') {
        reminderHours.value = existing.notifications.reminderHours;
      }
      dirty.notifications = false;
    }
    if (existing?.account) {
      Object.assign(account, {
        firstName: existing.account.firstName ?? account.firstName,
        lastName: existing.account.lastName ?? account.lastName,
        email: existing.account.email ?? account.email,
        affiliation: existing.account.affiliation ?? account.affiliation
      });
      dirty.account = false;
    }
  } catch (e) {
    console.warn('[Preferences] load failed', e);
  }
});

async function saveNotificationSettings() {
  try {
    saving.notifications = true;
    const payload: NotificationPrefs = {
      ...notifications,
      ...(reminderHours.value != null ? { reminderHours: reminderHours.value } : {})
    };
    await saveUserPreferences(userId.value, { notifications: payload });
    dirty.notifications = false;
  } catch (e) {
    console.error('[Preferences] save notifications failed', e);
  } finally {
    saving.notifications = false;
  }
}

async function saveAccountInfo() {
  try {
    saving.account = true;
    // Basic client validation example (add more as needed)
    if (account.email && !/^\S+@\S+\.\S+$/.test(account.email)) {
      alert('Please enter a valid email.');
      return;
    }
    await saveUserPreferences(userId.value, {
      account: {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        affiliation: account.affiliation
        // Never send raw passwords directly unless you have a secure flow.
      }
    });
    // If password was provided, call a dedicated endpoint to handle secure reset/update server-side.
    if (account.password) {
      await requestPasswordResetEmail(account.email);
      account.password = '';
    }
    dirty.account = false;
  } catch (e) {
    console.error('[Preferences] save account failed', e);
  } finally {
    saving.account = false;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

.dashboard {
  height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 5rem;
  box-sizing: border-box;
}
.dashboard::before {
  content: ''; position: fixed; inset: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85)); z-index: 0;
}
.dashboard > div, .content-sections { position: relative; z-index: 1; }

.dashboard-title {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 20px; padding-bottom: 15px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
}
.team-logo { max-width: 100px; margin-top: 20px; }
.sport-name {
  font-size: 2.0em; font-family: 'Bebas Neue', sans-serif;
  margin: 10px 0; color: white; text-transform: uppercase;
}

.content-sections { max-width: 900px; margin: 0 auto; }
.preferences-section { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px dashed rgba(255,255,255,0.2); }
.section-title {
  text-align: center; color: white; font-size: 2em; margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 1.5px; text-transform: uppercase;
  position: relative; padding-bottom: 0.5rem;
}
.section-title::after {
  content: ''; position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
  width: 100px; height: 3px; background-color: var(--secondary-color, #ffcd00);
}

/* Typography alignment with Standings (use Arial for body/UI; keep Bebas for headings) */
.pref-card,
.pref-card .row-title,
.pref-card .row-sub,
.pref-card .field-label,
.pref-card .input,
.pref-card select,
.pref-card button,
.pref-card .btn,
.pref-card .link {
  font-family: 'Arial', sans-serif;
}

/* Card styling (dark transparent hue, matches Fundraising aesthetic) */
.pref-card {
  background:
    linear-gradient(
      180deg,
      rgba(var(--primary-color-rgb, 24,43,73), 0.28) 0%,
      rgba(var(--primary-color-rgb, 24,43,73), 0.22) 100%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--secondary-color, #ffcd00) 12%, transparent) 0%,
      color-mix(in srgb, var(--secondary-color, #ffcd00) 8%, transparent) 100%
    );
  background:
    linear-gradient(
      180deg,
      rgba(var(--primary-color-rgb, 24,43,73), 0.28) 0%,
      rgba(var(--primary-color-rgb, 24,43,73), 0.22) 100%
    ),
    linear-gradient(
      180deg,
      rgba(var(--secondary-color-rgb, 255,205,0), 0.12) 0%,
      rgba(var(--secondary-color-rgb, 255,205,0), 0.08) 100%
    );
  border: 1px solid rgba(var(--secondary-color-rgb, 255,205,0), 0.25);
  border-radius: 14px;
  padding: 20px;
  color: white;
}

.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.section-icon { font-size: 1.2rem; }
.section-heading { font-weight: 800; letter-spacing: 0.4px; }

/* Rows */
.rows { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.row.field { align-items: flex-start; }
.row-text { display: grid; gap: 4px; }
.row-title { font-weight: 700; letter-spacing: 0.2px; }
.row-sub { opacity: 0.85; font-size: 0.95rem; }

/* Toggle Switch */
.toggle {
  inline-size: 52px; block-size: 28px; border-radius: 999px; border: none;
  background: rgba(255,255,255,0.22);
  position: relative; cursor: pointer; transition: background-color .2s ease;
}
.toggle .knob {
  position: absolute; top: 3px; left: 3px; inline-size: 22px; block-size: 22px; border-radius: 50%;
  background: #fff; transition: transform .2s ease;
}
.toggle.on { background: var(--secondary-color, #ffcd00); }
.toggle.on .knob { transform: translateX(24px); }

/* Inputs */
.input {
  width: clamp(220px, 40vw, 360px);
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 8px;
  color: #fff;
  padding: 10px 12px;
  outline: none;
}
.input:focus { border-color: color-mix(in srgb, var(--secondary-color, #ffcd00) 75%, white); }

/* Account grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.field-block { display: grid; gap: 6px; }
.field-label { opacity: 0.9; }

/* Actions */
.actions { margin-top: 16px; display: flex; gap: 10px; }
.btn {
  background: var(--secondary-color, #ffcd00);
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  font-weight: 800;
  padding: 10px 14px; border-radius: 10px;
  cursor: pointer;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.link {
  background: transparent; border: none; color: color-mix(in srgb, var(--secondary-color, #ffcd00) 90%, white);
  text-decoration: underline; cursor: pointer; padding: 0; margin-top: 6px; width: fit-content;
}
</style>
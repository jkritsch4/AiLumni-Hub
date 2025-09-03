<template>
  <div class="landing">
    <header class="brand">
      <div class="logo-wrap">
        <div v-if="!showLogo" class="logo-skeleton" aria-hidden="true"></div>
        <img
          v-else
          :src="logoUrl"
          :alt="uni.name"
          class="logo"
          @error="onLogoTagError"
        />
      </div>

      <h1 class="title">{{ uni.name }}</h1>

      <button class="start-btn" @click="startOnboarding">Get Started</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applyUniversityTheme, getUniversityBySlug } from '../services/universityTheme';
import { getTeamData } from '../services/teamService';

const route = useRoute();
const router = useRouter();

const uniSlug = (route.params.uniSlug as string) || '';
const invite = (route.query.code as string) || (route.query.invite as string) || '';
const uni = getUniversityBySlug(uniSlug);

const error = ref('');
const showLogo = ref(false);
const logoUrl = ref<string>(''); // do not set a visible default to prevent a flash

const CACHE_KEY = `teamLogo:${uni.slug}`;

function onLogoTagError(e: Event) {
  // If the visible <img> ever errors after preloading (rare), hard fallback
  const el = e.target as HTMLImageElement;
  el.src = '/images/default-logo.png';
}

function startOnboarding() {
  if (invite) localStorage.setItem('inviteCode', invite);
  localStorage.setItem('uniSlug', uni.slug);
  router.push({
    path: `/onboarding/${encodeURIComponent(uni.slug)}`,
    query: invite ? { invite } : {}
  });
}

function preload(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function resolveDynamicLogo(): Promise<string> {
  // 1) cached value
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) return cached;

  // 2) try feed (prefer team name starting with prefix e.g., "UCSD ...")
  try {
    const data = await getTeamData();
    const prefix = uni.teamPrefix || uni.name;
    const team = Array.isArray(data)
      ? data.find(item => item?.team_name?.startsWith(prefix + ' '))
      : undefined;
    if (team?.team_logo_url) {
      sessionStorage.setItem(CACHE_KEY, team.team_logo_url);
      return team.team_logo_url;
    }
  } catch {
    // ignore, we’ll fall back
  }

  // 3) configured university logo
  return uni.logo || '/images/default-logo.png';
}

onMounted(async () => {
  applyUniversityTheme(uni);

  // Preload in priority order and only reveal once a valid image is ready
  const dynamicUrl = await resolveDynamicLogo();
  if (await preload(dynamicUrl)) {
    logoUrl.value = dynamicUrl;
    showLogo.value = true;
    return;
  }

  // Fallback: configured university logo
  if (await preload(uni.logo)) {
    logoUrl.value = uni.logo;
    showLogo.value = true;
    return;
  }

  // Final fallback: default asset
  if (await preload('/images/default-logo.png')) {
    logoUrl.value = '/images/default-logo.png';
    showLogo.value = true;
  } else {
    // If even default fails, reveal nothing (extremely unlikely)
    error.value = 'Unable to load logo.';
  }
});
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.landing::before {
  content: '';
  position: absolute; inset: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
}

/* Content stack */
.brand, .error { position: relative; z-index: 1; }

.brand {
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 14px;               /* a little air between items */
  width: min(560px, 92vw); /* less cramped on desktop, fits on mobile */
  margin: 0 auto;
}

/* Reserve space to avoid layout shift while preloading */
.logo-wrap { height: 110px; display: grid; place-items: center; }
.logo-skeleton {
  width: 96px; height: 96px; border-radius: 8px;
  background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08));
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  border: 1px solid rgba(255,255,255,0.15);
}
@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

.logo { width: 110px; height: 110px; object-fit: contain; }

.title {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  font-size: clamp(28px, 4.2vw, 40px);
  text-transform: uppercase;
  margin: 0;
}

/* Centered CTA under title */
.start-btn {
  background: var(--secondary-color, #ffcd00);
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  font-weight: 800;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-block;
}

.error { color: #ffcd00; }
</style>
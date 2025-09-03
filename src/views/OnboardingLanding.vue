<template>
  <div class="landing">
    <header class="brand">
      <img :src="logoUrl" :alt="uni.name" class="logo" @error="onLogoError" />
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
const logoUrl = ref<string>(uni.logo); // start with configured logo

function onLogoError(e: Event) {
  const el = e.target as HTMLImageElement;
  // Fallback chain: dynamic -> configured uni logo -> default
  if (logoUrl.value !== uni.logo) {
    logoUrl.value = uni.logo;
  } else {
    el.src = '/images/default-logo.png';
  }
}

function startOnboarding() {
  if (invite) localStorage.setItem('inviteCode', invite);
  localStorage.setItem('uniSlug', uni.slug);
  router.push({ path: `/onboarding/${encodeURIComponent(uni.slug)}`, query: invite ? { invite } : {} });
}

onMounted(async () => {
  applyUniversityTheme(uni);

  // Fetch a team logo dynamically for this university
  try {
    const data = await getTeamData();
    const prefix = uni.teamPrefix || uni.name;
    // Prefer any team whose name starts with "UCSD ..." (or configured prefix)
    const team = data.find(item => item.team_name?.startsWith(prefix + ' '));
    if (team?.team_logo_url) {
      logoUrl.value = team.team_logo_url;
    }
  } catch (e) {
    console.warn('[OnboardingLanding] Dynamic logo fetch failed:', e);
    // keep configured logo, show no blocking error
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

.brand, .error { position: relative; z-index: 1; }

/* Tighter stack so the button sits right beneath the name */
.brand {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.logo { width: 96px; height: auto; object-fit: contain; }
.title {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  font-size: 2.2rem;
  text-transform: uppercase;
  margin: 0;
}

/* Centered call-to-action under the title */
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
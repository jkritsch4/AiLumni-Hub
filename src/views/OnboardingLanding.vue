<template>
  <div class="landing">
    <header class="brand">
      <img :src="uni.logo" :alt="uni.name" class="logo" @error="onLogoError" />
      <h1 class="title">{{ uni.name }}</h1>
    </header>

    <section class="cta">
      <p class="tagline">Join the {{ uni.name }} Fan Community</p>
      <button class="start-btn" @click="startOnboarding">Get Started</button>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applyUniversityTheme, getUniversityBySlug } from '../services/universityTheme';

const route = useRoute();
const router = useRouter();
const uniSlug = (route.params.uniSlug as string) || '';
const invite = (route.query.code as string) || (route.query.invite as string) || '';
const uni = getUniversityBySlug(uniSlug);
const error = ref('');

function onLogoError(e: Event) {
  const el = e.target as HTMLImageElement;
  el.src = '/images/default-logo.png';
}

function startOnboarding() {
  // Persist invite metadata for later attribution during save
  if (invite) localStorage.setItem('inviteCode', invite);
  localStorage.setItem('uniSlug', uni.slug);
  router.push({ path: `/onboarding/${encodeURIComponent(uni.slug)}`, query: invite ? { invite } : {} });
}

onMounted(() => {
  applyUniversityTheme(uni);
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
.brand, .cta, .error { position: relative; z-index: 1; }
.brand { display: grid; justify-items: center; gap: 10px; margin-bottom: 1rem; }
.logo { width: 96px; height: auto; }
.title { color: #fff; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-size: 2.2rem; text-transform: uppercase; }
.tagline { color: #fff; opacity: 0.9; margin: 0.5rem 0 1.5rem; }
.start-btn {
  background: var(--secondary-color, #ffcd00);
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  font-weight: 800;
  padding: 12px 18px; border-radius: 10px; cursor: pointer;
}
.error { color: #ffcd00; }
</style>
<template>
  <div class="onb">
    <header class="hdr">
      <img :src="logo" alt="logo" class="logo" @error="onLogoError" />
      <h2 class="school">{{ name }}</h2>
    </header>
    <main class="slot">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ name: string; logo: string }>();
function onLogoError(e: Event) {
  const el = e.target as HTMLImageElement;
  el.src = '/images/default-logo.png';
}
</script>

<style scoped>
.onb {
  min-height: 100vh; position: relative;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover; background-position: center;
  padding: 2rem;
}
.onb::before { content: ''; position: absolute; inset: 0; background: var(--background-overlay, rgba(24,43,73,0.85)); }
.hdr { position: relative; z-index: 1; display: grid; justify-items: center; gap: 8px; margin-bottom: 1rem; }
.logo { width: 80px; height: auto; }
.school { color: #fff; font-family: 'Bebas Neue', sans-serif; text-transform: uppercase; letter-spacing: 1px; }
.slot { position: relative; z-index: 1; }
</style>
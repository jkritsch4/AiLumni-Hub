<template>
  <div class="onboarding-shell">
    <div class="bg" aria-hidden="true"></div>

    <header class="header">
      <img
        class="logo"
        :src="resolvedLogo"
        :alt="`${name} logo`"
        @error="onLogoError"
      />
      <div class="title">{{ name }}</div>
    </header>

    <main class="content" role="main">
      <div class="content-inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  name: string;
  logo: string;
}>()

const route = useRoute()
const resolvedLogo = ref(props.logo)

function onLogoError(e: Event) {
  const el = e.target as HTMLImageElement
  el.src = '/images/default-logo.png'
}

function getSlug(): string {
  return String((route.params as any)?.uniSlug || localStorage.getItem('uniSlug') || '')
}

function getStoredTeamLogo(): string | null {
  const slug = getSlug()
  if (!slug) return null
  return sessionStorage.getItem(`teamLogo:${slug}`)
}

function preload(url?: string | null): Promise<boolean> {
  return new Promise((resolve) => {
    const src = String(url || '').trim()
    if (!src) return resolve(false)
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

async function resolveLogo() {
  const fromStore = getStoredTeamLogo()
  if (await preload(fromStore)) {
    resolvedLogo.value = fromStore as string
    return
  }
  if (await preload(props.logo)) {
    resolvedLogo.value = props.logo
    return
  }
  if (await preload('/images/default-logo.png')) {
    resolvedLogo.value = '/images/default-logo.png'
  }
}

onMounted(resolveLogo)
watch(() => props.logo, resolveLogo)
</script>

<style scoped>
.onboarding-shell {
  --header-h: 56px;
  position: fixed;
  inset: 0;
  height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--header-h) + 8px);
  display: grid;
  grid-template-rows: auto 1fr;
  background-color: var(--primary-color, #182B49);
}
.bg {
  position: fixed;
  inset: 0;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  z-index: 0;
}
.bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
}
.header {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: var(--header-h);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  backdrop-filter: blur(6px);
  background: color-mix(in srgb, var(--primary-color, #182B49) 78%, transparent);
  border-bottom: 1px solid rgba(255,255,255,0.12);
}
.logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.title {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.6px;
  font-size: clamp(18px, 2.6vw, 22px);
  text-transform: uppercase;
}
.content { position: relative; z-index: 1; padding: 16px 12px 24px; }
.content-inner { width: min(640px, 100%); margin: 0 auto; }
</style>
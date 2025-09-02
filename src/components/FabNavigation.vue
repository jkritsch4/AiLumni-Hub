<template>
  <div class="app-shell">
    <div class="main-content-container">
      <!-- Global FAB: fixed to viewport top-right with safe-area + content-aware padding -->
      <div class="fab-container" role="region" aria-label="Quick actions">
        <button
          class="fab-main"
          type="button"
          @click="toggleFab"
          aria-haspopup="true"
          :aria-expanded="String(fabOpen)"
          aria-controls="fab-options"
          aria-label="Open menu"
        >
          <span v-if="!fabOpen">Menu</span>
          <span v-else>Close</span>
        </button>

        <transition-group name="fab-option" tag="div" id="fab-options" class="fab-options" aria-live="polite">
          <button
            v-if="fabOpen"
            key="schedule"
            type="button"
            :class="['fab-option', { active: currentTab === 'schedule' }]"
            @click="selectTab('schedule')"
          >
            Schedule
          </button>
          <button
            v-if="fabOpen"
            key="fundraising"
            type="button"
            :class="['fab-option', { active: currentTab === 'fundraising' }]"
            @click="selectTab('fundraising')"
          >
            Fundraising
          </button>
        </transition-group>
      </div>

      <transition name="fade-slide" mode="out-in">
        <component
          :is="currentTabComponent"
          :home-team-logo="logoUrl"
          :university-name="universityName"
          @team-logo-loaded="handleTeamLogoLoaded"
        />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Dashboard from './Dashboard.vue';
import UserPreferences from './UserPreferences.vue';

const props = defineProps({
  teamLogoUrl: { type: String, default: '/images/ucsd-trident.svg' },
  teamName: { type: String, default: 'UCSD Baseball' },
});

const currentTab = ref('schedule');
const fabOpen = ref(false);
const logoUrl = ref(props.teamLogoUrl);
const universityName = ref(props.teamName);

const currentTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'schedule': return Dashboard;
    case 'fundraising': return UserPreferences;
    default: return Dashboard;
  }
});

const toggleFab = () => { fabOpen.value = !fabOpen.value; };
const selectTab = (tab) => { currentTab.value = tab; fabOpen.value = false; };
const handleTeamLogoLoaded = (newLogoUrl) => { if (newLogoUrl) logoUrl.value = newLogoUrl; };

onMounted(() => {});
</script>

<!-- Global (unscoped) CSS variables so they apply on all routes -->
<style>
:root {
  /* Align to Dashboard’s inner content column (content-sections max-width: 1080px) */
  --content-max: 1080px;
  /* If you change Dashboard’s horizontal padding, update this too */
  --content-pad-x: 16px;
  /* Increased top padding so the FAB sits lower */
  --fab-top: 32px;
  --fab-inset: 12px;
}
</style>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--background-color, #0b0b0b);
  position: relative;
}

.main-content-container {
  position: relative;
  height: 100vh;
  overflow-y: auto;
  padding: 0 1rem;
  box-sizing: border-box;
  max-width: 1200px;   /* overall shell; FAB aligns to inner 1080px via --content-max */
  margin: 0 auto;
}

/* Mirror of the “left works” math, but on the RIGHT side */
.fab-container {
  position: fixed;

  /* Top offset + safe-area */
  top: calc(var(--fab-top) + env(safe-area-inset-top, 0px));

  /* Force right anchoring (avoid any left rules elsewhere) */
  left: auto !important;

  /* Right gutter = (100vw - min(100vw, --content-max)) / 2
     Place the FAB inside that inner column by pad + inset. */
  right: max(
    var(--fab-inset),
    calc(
      (100vw - min(100vw, var(--content-max))) / 2
      + var(--content-pad-x)
      + var(--fab-inset)
      + env(safe-area-inset-right, 0px)
    )
  );

  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;

  z-index: 2000;
  pointer-events: none;
}
.fab-container > * { pointer-events: auto; }

/* FAB button */
.fab-main {
  inline-size: clamp(44px, 7.2vw, 60px);
  block-size: clamp(44px, 7.2vw, 60px);
  border-radius: 50%;
  background-color: var(--fab-color, var(--secondary-color, #FFCD00));
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: clamp(12px, 1.6vw, 15px);
  letter-spacing: 0.3px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: saturate(110%);
}

.fab-main:hover {
  transform: translateY(-1px) scale(1.05);
  background-color: var(--fab-hover-color, var(--accent-hover-color, #FFC107));
  color: var(--primary-color, #182B49);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.32);
}

.fab-main:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.85),
    0 0 0 6px var(--ring-secondary, rgba(255, 205, 0, 0.45));
}

/* Options under the main FAB */
.fab-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.fab-option {
  width: auto;
  max-width: 70vw;
  padding: 0.6rem 1.1rem;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.98);
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  cursor: pointer;
  font-weight: 700;
  font-size: clamp(12px, 1.6vw, 14px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
  backdrop-filter: saturate(110%);
}

.fab-option:hover,
.fab-option.active {
  background-color: var(--accent-color, var(--secondary-color, #FFCD00));
  border-color: var(--accent-color, var(--secondary-color, #FFCD00));
  color: var(--primary-color, #182B49);
  transform: translateY(-1px);
}

.fab-option:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.85),
    0 0 0 6px var(--ring-secondary, rgba(255, 205, 0, 0.45));
}

/* Page transition */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(14px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-14px); }

/* FAB option transitions */
.fab-option-enter-active,
.fab-option-leave-active { transition: all 0.2s ease; }
.fab-option-enter-from,
.fab-option-leave-to { opacity: 0; transform: scale(0.92) translateY(6px); }

/* Small phones tweak */
@media (max-width: 380px) {
  :global(:root) { --fab-inset: 10px; }
}

/* Print */
@media print {
  .fab-container { display: none !important; }
}
</style>
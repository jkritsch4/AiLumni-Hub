<template>
  <div class="step-container">
    <h2>Select Your Favorite Sport</h2>
    <p class="subtitle">Choose a sport to follow</p>

    <div class="sports-list">
      <div
        v-for="sport in sports"
        :key="sport"
        :class="['sport-card', { selected: selectedSport === sport }]"
        @click="selectSport(sport)"
      >
        {{ sport }}
      </div>
    </div>

    <div class="navigation-buttons">
      <button class="secondary-button" @click="$emit('previous-step')">Back</button>
      <button
        class="primary-button"
        @click="continueToNextStep"
        :disabled="!selectedSport"
      >
        Continue
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getUniversityBySlug, applyUniversityTheme } from '../../services/universityTheme';
import { DEFAULT_UNIVERSITY } from '../../config/universities';

const route = useRoute();
const uniSlug = (route.params.uniSlug as string) || localStorage.getItem('uniSlug') || '';
const uni = getUniversityBySlug(uniSlug);
applyUniversityTheme(uni);

const selectedSport = ref<string>('');
const sports = computed<string[]>(() => uni.sports?.length ? uni.sports : DEFAULT_UNIVERSITY.sports);

function selectSport(sport: string) {
  selectedSport.value = sport;
}

function continueToNextStep() {
  if (!selectedSport.value) return;
  // Emit using existing contract used by your wizard
  // If your parent stepper expects a different event, keep it consistent
  // @ts-ignore
  emit('next-step', { step: 'sport', data: { selectedSport: selectedSport.value, university: uni.slug } });
}

const emit = defineEmits<{ (e: 'next-step', payload: any): void; (e: 'previous-step'): void }>();
</script>

<style scoped>
/* Keep your existing styles; they already use CSS variables/colors */
.step-container {
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.step-container::before {
  content: ''; position: absolute; inset: 0; background: var(--background-overlay, rgba(24, 43, 73, 0.85));
  z-index: 1;
}
.step-container > * { position: relative; z-index: 2; }
h2 {
  color: white; margin-bottom: 1rem; font-size: 2.5rem; font-family: 'Bebas Neue', sans-serif; text-transform: uppercase;
}
.subtitle { color: #fff; margin-bottom: 2rem; font-size: 1.1rem; opacity: 0.9; }
.sports-list { width: 100%; max-width: 600px; margin: 0 auto 2rem; display: flex; flex-direction: column; gap: 1rem; }
.sport-card {
  background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 1.5rem; cursor: pointer;
  transition: all .3s ease; border: 2px solid transparent; color: white; font-size: 1.1rem;
}
.sport-card:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
.sport-card.selected { border-color: var(--secondary-color, #ffcd00); box-shadow: 0 0 0 3px rgba(255,205,0,0.25); }
.navigation-buttons { display: flex; gap: 12px; justify-content: center; }
.primary-button {
  background: var(--secondary-color, #ffcd00); color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49); font-weight: 800; padding: 10px 16px; border-radius: 10px; cursor: pointer;
}
.secondary-button {
  background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); padding: 10px 16px; border-radius: 10px; cursor: pointer;
}
</style>
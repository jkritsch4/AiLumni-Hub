<template>
  <div class="app-shell">
    <!-- App header/logo/background always visible -->
    <slot name="header">
      <div class="header">
        <img :src="homeTeamLogo" alt="Logo" class="main-logo" />
        <h1 class="main-title">BASEBALL</h1>
      </div>
    </slot>
    <div class="main-content-container">
      <transition name="fade-slide" mode="out-in">
        <component :is="currentTabComponent" :home-team-logo="homeTeamLogo" />
      </transition>
      <div class="fab-container">
        <button class="fab-main" @click="toggleTab">
          {{ currentTab === 'schedule' ? 'Fundraising' : 'Schedule' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Dashboard from './Dashboard.vue';
import UserPreferences from './UserPreferences.vue';

const currentTab = ref('schedule');
const homeTeamLogo = ref(''); // Default empty

// Example: fetch or set your home team logo here
onMounted(() => {
  // Replace this with your actual logic to get the home team logo
  homeTeamLogo.value = '/images/your-home-team-logo.png';
});

const currentTabComponent = computed(() =>
  currentTab.value === 'schedule' ? Dashboard : UserPreferences
);

function toggleTab() {
  currentTab.value = currentTab.value === 'schedule' ? 'fundraising' : 'schedule';
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #181818 url('/images/bg-pattern.png');
  padding: 0;
  position: relative;
}
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 16px;
}
.main-logo {
  width: 96px;
  margin-bottom: 8px;
}
.main-title {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.5em;
  margin: 0;
  letter-spacing: 2px;
}
.main-content-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: #181818 url('/images/bg-pattern.png');
  padding-top: 48px;
}
.fab-container {
  position: absolute;
  top: 24px;
  right: 32px;
  z-index: 100;
  pointer-events: none;
}
.fab-main {
  background: #ffb300;
  color: #181818;
  border: none;
  border-radius: 24px;
  min-width: 120px;
  height: 44px;
  font-size: 1.1em;
  font-family: 'Bebas Neue', sans-serif;
  box-shadow: 0 8px 32px #0008;
  cursor: pointer;
  pointer-events: auto;
  padding: 0 24px;
  transition: background 0.2s;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(.4,2,.6,1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
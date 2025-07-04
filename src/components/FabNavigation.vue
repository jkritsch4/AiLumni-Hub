<template>
  <div class="app-shell">
    <div class="main-content-container">
      <div class="fab-container">
        <button class="fab-main" @click="toggleFab">
          <span v-if="!fabOpen">Menu</span>
          <span v-else>Close</span>
        </button>
        <transition-group name="fab-option" tag="div">
          <button
            v-if="fabOpen"
            key="schedule"
            :class="['fab-option', { active: currentTab === 'schedule' }]"
            @click="selectTab('schedule')"
          >
            Schedule
          </button>
          <button
            v-if="fabOpen"
            key="fundraising"
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
import { themeColors } from '../services/theme';

const props = defineProps({
  teamLogoUrl: {
    type: String,
    default: '/images/ucsd-trident.svg',
  },
  teamName: {
    type: String,
    default: 'UCSD Baseball',
  },
});

const currentTab = ref('schedule');
const fabOpen = ref(false);
const logoUrl = ref(props.teamLogoUrl);
const universityName = ref(props.teamName);

const currentTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'schedule':
      return Dashboard;
    case 'fundraising':
      return UserPreferences;
    default:
      return Dashboard;
  }
});

const toggleFab = () => {
  fabOpen.value = !fabOpen.value;
};

const selectTab = (tab) => {
  currentTab.value = tab;
  fabOpen.value = false;
};

const handleTeamLogoLoaded = (newLogoUrl) => {
  if (newLogoUrl) {
    logoUrl.value = newLogoUrl;
  }
};

onMounted(() => {
  // Any additional initialization if needed
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--background-color, #f5f5f5);
  position: relative;
}

.main-content-container {
  position: relative;
  height: 100vh;
  overflow-y: auto;
  padding: 0 1rem;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
}

.fab-container {
  position: fixed;
  top: 1.5rem; 
  right: 3.5rem; /* Further increased padding on the right */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  z-index: 1000;
  max-width: 90%; /* Ensure it's within viewport */
}

.fab-main {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--fab-color, var(--secondary-color, #FFCD00));
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.fab-main:hover {
  transform: scale(1.1);
  background-color: var(--fab-hover-color, var(--accent-hover-color, #FFC107));
  color: var(--primary-color, #182B49);
}

.fab-option {
  width: auto;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  background-color: white;
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.fab-option:hover,
.fab-option.active {
  background-color: var(--accent-color, var(--secondary-color, #FFCD00));
  border-color: var(--accent-color, var(--secondary-color, #FFCD00));
  color: var(--primary-color, #182B49);
  transform: scale(1.05);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fab-option-enter-active,
.fab-option-leave-active {
  transition: all 0.3s ease;
}

.fab-option-enter-from,
.fab-option-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
</style>
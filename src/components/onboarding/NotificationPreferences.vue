<template>
  <div class="step-container">
    <h2>Choose Your Notifications</h2>
    <p class="subtitle">Select how you'd like to be notified</p>
    
    <div class="preferences-list">
      <div 
        v-for="pref in preferences"
        :key="pref.id"
        class="preference-item"
        :class="{ selected: selectedPreferences.includes(pref.id) }"
        @click="togglePreference(pref.id)"
      >
        <div class="preference-content">
          <h3>{{ pref.title }}</h3>
          <p>{{ pref.description }}</p>
        </div>
        <div class="checkbox">
          <div class="checkbox-inner" v-if="selectedPreferences.includes(pref.id)"></div>
        </div>
      </div>
    </div>

    <div class="navigation-buttons">
      <button class="secondary-button" @click="$emit('previous-step')">
        Back
      </button>
      <button 
        class="primary-button" 
        @click="completeOnboarding"
        :disabled="selectedPreferences.length === 0"
      >
        Get Started
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationPreferences',
  data() {
    return {
      selectedPreferences: [],
      preferences: [
        {
          id: 'game-reminders',
          title: 'Game Reminders',
          description: 'Get notified before your team plays'
        },
        {
          id: 'score-updates',
          title: 'Score Updates',
          description: 'Receive live score updates during games'
        },
        {
          id: 'news',
          title: 'Team News',
          description: 'Stay updated with the latest team news'
        },
        {
          id: 'highlights',
          title: 'Game Highlights',
          description: 'Get post-game highlights and summaries'
        }
      ]
    }
  },
  methods: {
    togglePreference(prefId) {
      const index = this.selectedPreferences.indexOf(prefId)
      if (index === -1) {
        this.selectedPreferences.push(prefId)
      } else {
        this.selectedPreferences.splice(index, 1)
      }
    },
    completeOnboarding() {
      if (this.selectedPreferences.length > 0) {
        this.$emit('next-step', {
          step: 'notifications',
          data: { notificationPreferences: this.selectedPreferences },
          isComplete: true
        })
      }
    }
  }
}
</script>

<style scoped>
.step-container {
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
  z-index: 1;
}

.step-container > * {
  position: relative;
  z-index: 2;
}

h2 {
  color: white;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
}

.subtitle {
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  opacity: 0.9;
}

.preferences-list {
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preference-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preference-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.preference-item.selected {
  border-color: var(--accent-color, var(--secondary-color, #FFB81C));
  background: var(--background-overlay-light, rgba(255, 184, 28, 0.1));
}

.preference-content {
  text-align: left;
}

.preference-content h3 {
  color: white;
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.preference-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 0.9rem;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--accent-color, var(--secondary-color, #FFB81C));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-inner {
  width: 14px;
  height: 14px;
  background-color: var(--accent-color, var(--secondary-color, #FFB81C));
  border-radius: 3px;
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.secondary-button,
.primary-button {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.primary-button {
  background: var(--accent-color, var(--secondary-color, #FFB81C));
  color: var(--primary-color, #000);
  font-weight: 600;
}

.primary-button:hover {
  background: var(--accent-hover-color, #ffc64c);
  transform: translateY(-2px);
}

.primary-button:disabled {
  background: #9b9b9b;
  cursor: not-allowed;
  transform: none;
}
</style>

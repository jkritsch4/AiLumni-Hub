<template>
  <div class="step-container">
    <h2>Choose Your Notification Preferences</h2>
    <p class="subtitle">Tailor your experience by selecting your preferred notifications below.</p>
    
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
        @click="continueToNext"
        :disabled="selectedPreferences.length === 0"
      >
        Continue
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationPreferences',
  emits: ['update-data', 'next-step', 'previous-step'],
  data() {
    return {
      selectedPreferences: [],
      preferences: [
        { id: 'game-reminders', title: 'Game Reminders', description: 'Get notified before your team plays' },
        { id: 'game-results',   title: 'Game Results',   description: 'Receive post-game scores' },
        { id: 'news',           title: 'Conference Standings Updates', description: 'Stay updated with the latest conference standings (weekly)' },
        { id: 'none',           title: 'None', description: 'No notifications will be sent' },
      ]
    }
  },
  methods: {
    togglePreference(prefId) {
      const index = this.selectedPreferences.indexOf(prefId)
      if (index === -1) this.selectedPreferences.push(prefId)
      else this.selectedPreferences.splice(index, 1)
    },
    normalize(arr) {
      // If "none" selected, force all off
      if (arr.includes('none')) {
        return { gameReminders: false, gameResults: false, standingsUpdates: false }
      }
      return {
        gameReminders: arr.includes('game-reminders'),
        gameResults:   arr.includes('game-results'),
        // Map "news" → standingsUpdates to align with backend field
        standingsUpdates: arr.includes('news') || arr.includes('standings')
      }
    },
    continueToNext() {
      const prefs = this.normalize(this.selectedPreferences)
      // Let the wizard store and show immediately
      this.$emit('update-data', { notifications: prefs })
      // Also send as payload for immediate step transition
      this.$emit('next-step',   { notifications: prefs })
    }
  }
}
</script>

<style scoped>
/* Your styles unchanged (kept from your version) */
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
.step-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: var(--background-overlay, rgba(24, 43, 73, 0.85)); z-index: 1; }
.step-container > * { position: relative; z-index: 2; }
h2 { color: white; margin-bottom: 1rem; font-size: 2rem; font-family: 'Bebas Neue', sans-serif; text-transform: uppercase; }
.subtitle { color: #ffffff; margin-bottom: 2rem; font-size: 1.1rem; opacity: 0.9; }
.preferences-list { width: 100%; max-width: 720px; margin: 0 auto 2rem; display: flex; flex-direction: column; gap: 1rem; }
.preference-item {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.25rem 1.25rem; border-radius: 16px; cursor: pointer;
  background: color-mix(in srgb, var(--primary-color, #182B49) 22%, transparent);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: 0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
  -webkit-backdrop-filter: saturate(115%) brightness(0.95);
  backdrop-filter: saturate(115%) brightness(0.95);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease, background-color .15s ease;
}
.preference-item:hover {
  background: color-mix(in srgb, var(--primary-color, #182B49) 28%, transparent);
  border-color: rgba(255,255,255,0.22);
  box-shadow: 0 8px 22px rgba(0,0,0,0.16);
  transform: translateY(-1px);
}
.preference-item.selected {
  outline: 2px solid var(--secondary-color, #FFCD00);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary-color, #FFCD00) 30%, transparent);
  border-color: color-mix(in srgb, var(--secondary-color, #FFCD00) 70%, white);
}
.preference-content { text-align: left; flex: 1 1 auto; }
.preference-content h3 { color: white; margin: 0 0 0.25rem; font-size: 1.2rem; font-weight: 700; }
.preference-content p { color: rgba(255,255,255,0.86); margin: 0; font-size: 0.95rem; }
.checkbox { width: 26px; height: 26px; border: 2px solid var(--accent-color, var(--secondary-color, #FFCD00)); border-radius: 6px; display: grid; place-items: center; background: transparent; }
.checkbox-inner { width: 16px; height: 16px; background: var(--accent-color, var(--secondary-color, #FFCD00)); border-radius: 3px; }
.navigation-buttons { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }
.secondary-button, .primary-button { padding: 0.8rem 2rem; font-size: 1rem; border-radius: 9999px; cursor: pointer; transition: all 0.3s ease; font-family: 'Bebas Neue', sans-serif; text-transform: uppercase; letter-spacing: 1px; border: none; }
.secondary-button { background: rgba(255, 255, 255, 0.1); color: white; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.secondary-button:hover { background: rgba(255, 255, 255, 0.2); }
.primary-button { background: var(--accent-color, var(--secondary-color, #FFCD00)); color: var(--primary-color, #000); font-weight: 700; }
.primary-button:hover { background: var(--accent-hover-color, #ffc64c); transform: translateY(-2px); }
.primary-button:disabled { background: #9b9b9b; cursor: not-allowed; transform: none; }
</style>
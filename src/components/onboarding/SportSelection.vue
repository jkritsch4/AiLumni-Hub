<template>
  <div class="step-container">
    <h2>Select your sport</h2>
    <p class="subtitle">Choose a sport to follow</p>

    <div class="group">
      <h3 class="group-title">Men's Sports</h3>
      <ul class="sports-list">
        <li v-for="sport in mensSports" :key="'m-'+sport">
          <button
            type="button"
            class="sport-card"
            :class="{ selected: selectedLabel === labelFor(sport, 'men') }"
            @click="selectSport(sport, 'men')"
          >
            <span class="label">{{ sport }}</span>
            <img
              v-if="logoByLabel[labelFor(sport, 'men')]"
              class="team-logo"
              :src="logoByLabel[labelFor(sport, 'men')]"
              :alt="`${uni.name} ${sport} (Men's) logo`"
              @error="onSportLogoError(labelFor(sport, 'men'))"
            />
          </button>
        </li>
      </ul>
    </div>

    <div class="group" v-if="womensSports.length">
      <h3 class="group-title">Women's Sports</h3>
      <ul class="sports-list">
        <li v-for="sport in womensSports" :key="'w-'+sport">
          <button
            type="button"
            class="sport-card"
            :class="{ selected: selectedLabel === labelFor(sport, 'women') }"
            @click="selectSport(sport, 'women')"
          >
            <span class="label">{{ sport }}</span>
            <img
              v-if="logoByLabel[labelFor(sport, 'women')]"
              class="team-logo"
              :src="logoByLabel[labelFor(sport, 'women')]"
              :alt="`${uni.name} ${sport} (Women's) logo`"
              @error="onSportLogoError(labelFor(sport, 'women'))"
            />
          </button>
        </li>
      </ul>
    </div>

    <div class="navigation-buttons">
      <button class="secondary-button" @click="goBack">Back</button>
      <button class="primary-button" :disabled="!selectedLabel" @click="continueToNextStep">
        Continue
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import { getUniversityBySlug } from '../../services/universityTheme'
import { DEFAULT_UNIVERSITY, getSportsGroups } from '../../config/universities'

export default {
  name: 'SportSelection',
  data() {
    return {
      uni: DEFAULT_UNIVERSITY,
      selectedLabel: '',        // e.g., "Soccer (Men's)"
      mensSports: [],
      womensSports: [],
      logoByLabel: {},          // Map<label, logoUrl>
      error: ''
    }
  },
  created() {
    const slug =
      (this.$route?.params?.uniSlug) ||
      localStorage.getItem('uniSlug') ||
      ''

    // Current university + theme vars already applied earlier in the flow
    this.uni = getUniversityBySlug(String(slug))

    // Normalize to grouped lists
    const groups = getSportsGroups(this.uni)
    this.mensSports = groups.mens || []
    this.womensSports = groups.womens || []

    // Load dynamic team logos the same way the app does (sports-events API)
    this.fetchLogos()
  },
  methods: {
    labelFor(sport, gender) {
      // Produce labels consistent with API team_name remainders, e.g., "Soccer (Men's)"
      if (gender === 'men') return `${sport} (Men's)`
      if (gender === 'women') return `${sport} (Women's)`
      return sport
    },
    selectSport(sport, gender) {
      this.selectedLabel = this.labelFor(sport, gender)
      this.error = ''
    },
    async fetchLogos() {
      try {
        const resp = await fetch('https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events')
        const data = await resp.json()

        const prefix = this.uni.teamPrefix || this.uni.name
        const map = {}

        if (Array.isArray(data)) {
          for (const item of data) {
            const team = item?.team_name || ''
            const logo = item?.team_logo_url || ''
            if (!team || !logo) continue

            // Match "UCSD Baseball", "UCSD Soccer (Men's)" etc.
            if (team.startsWith(prefix + ' ')) {
              const remainder = team.substring(prefix.length + 1).trim()
              map[remainder] = logo
            }
          }
        }
        this.logoByLabel = map
      } catch (e) {
        // Non-fatal; show no logos if fetch fails
        console.warn('[SportSelection] fetchLogos failed:', e)
      }
    },
    onSportLogoError(label) {
      const next = { ...this.logoByLabel }
      delete next[label]
      this.logoByLabel = next
    },
    goBack() {
      // If this component is used inside the wizard routes, go back a step
      if (this.$router && this.$route?.name === 'SportStep') {
        // Navigate back to the landing if that's your desired UX
        this.$router.push({ name: 'OnboardingLanding', params: { uniSlug: this.$route.params.uniSlug } })
        return
      }
      // Fallback: emit for legacy usage
      this.$emit('previous-step')
    },
    continueToNextStep() {
      if (!this.selectedLabel) {
        this.error = 'Please pick a sport to continue.'
        return
      }
      // Route-based wizard: go to Notifications step
      if (this.$router && this.$route?.name === 'SportStep') {
        this.$router.push({
          name: 'NotificationsStep',
          params: { uniSlug: this.$route.params.uniSlug },
          query: { sport: this.selectedLabel }
        })
      }
      // Also emit for legacy overlay usage if still present
      this.$emit('next-step', { step: 'sport', data: { selectedSport: this.selectedLabel } })
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
  justify-content: flex-start;
}

.step-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
  z-index: 1;
}

.step-container > * {
  position: relative;
  z-index: 2;
}

h2 {
  color: white;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
}

.subtitle {
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  opacity: 0.9;
}

.group { width: 100%; max-width: 640px; margin: 0 auto 1.5rem; }
.group-title {
  color: #fff; text-align: left; margin: 0 0 0.5rem 0;
  font-weight: 800; letter-spacing: 0.3px;
}

.sports-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 0.75rem;
}

.sport-card {
  width: 100%;
  display: grid; grid-template-columns: 1fr auto; align-items: center;
  gap: 12px;
  padding: 1rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  color: white;
  text-align: left;
}

.sport-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.sport-card.selected {
  border-color: var(--secondary-color, #ffcd00);
  box-shadow: 0 0 0 3px rgba(255,205,0,0.25);
}

.label { font-size: 1.05rem; font-weight: 700; }
.team-logo { width: 44px; height: 44px; object-fit: contain; }

.navigation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 1rem;
}

.primary-button {
  background: var(--secondary-color, #ffcd00);
  color: var(--primary-color, #182B49);
  border: 2px solid var(--primary-color, #182B49);
  font-weight: 800;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.secondary-button {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255,255,255,0.5);
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.error { color: #ffcd00; text-align: center; margin-top: 8px; }
</style>
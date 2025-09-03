<template>
  <div class="step-container">
    <h2>Select your sport</h2>
    <p class="subtitle">Choose a sport to follow</p>

    <section class="group">
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
          </button>
        </li>
      </ul>
    </section>

    <section class="group" v-if="womensSports.length">
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
          </button>
        </li>
      </ul>
    </section>

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
      selectedLabel: '',
      mensSports: [],
      womensSports: [],
      // Kept in case we later re-enable per-row logos, but not rendered now.
      logoByLabel: {},
      error: ''
    }
  },
  created() {
    const slug =
      (this.$route?.params?.uniSlug) ||
      localStorage.getItem('uniSlug') ||
      ''

    this.uni = getUniversityBySlug(String(slug))
    const groups = getSportsGroups(this.uni)
    this.mensSports = groups.mens || []
    this.womensSports = groups.womens || []
    // We can still fetch logos for future use; not shown in UI.
    this.fetchLogos()
  },
  methods: {
    labelFor(sport, gender) {
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

        const normalize = (remainder) => {
          const r = String(remainder || '').trim()
          if (!r) return []
          const mens = r.match(/^Men's\s+(.+)/i)
          if (mens) return [`${mens[1].trim()} (Men's)`]
          const womens = r.match(/^Women's\s+(.+)/i)
          if (womens) return [`${womens[1].trim()} (Women's)`]
          return [r, `${r} (Men's)`, `${r} (Women's)`]
        }

        const map = {}
        if (Array.isArray(data)) {
          for (const item of data) {
            const team = item?.team_name || ''
            const logo = item?.team_logo_url || ''
            if (!team || !logo) continue
            if (team.startsWith(prefix + ' ')) {
              const remainder = team.substring(prefix.length + 1).trim()
              for (const key of normalize(remainder)) map[key] = logo
            }
          }
        }
        this.logoByLabel = map
      } catch (e) {
        console.warn('[SportSelection] fetchLogos failed:', e)
      }
    },
    goBack() {
      if (this.$router && this.$route?.name === 'SportStep') {
        this.$router.push({ name: 'OnboardingLanding', params: { uniSlug: this.$route.params.uniSlug } })
        return
      }
      this.$emit('previous-step')
    },
    continueToNextStep() {
      if (!this.selectedLabel) {
        this.error = 'Please pick a sport to continue.'
        return
      }
      if (this.$router && this.$route?.name === 'SportStep') {
        this.$router.push({
          name: 'NotificationsStep',
          params: { uniSlug: this.$route.params.uniSlug },
          query: { sport: this.selectedLabel }
        })
      }
      this.$emit('next-step', { step: 'sport', data: { selectedSport: this.selectedLabel } })
    }
  }
}
</script>

<style scoped>
/* Layout */
.step-container {
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: grid;
  gap: 8px;
}

h2 {
  color: #fff;
  margin: 4px 0;
  font-size: clamp(24px, 3.5vw, 36px);
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subtitle {
  color: #ffffff;
  margin-bottom: 10px;
  font-size: 1.05rem;
  opacity: 0.9;
}

/* Section */
.group {
  width: 100%;
  margin: 12px auto 16px;
  text-align: center; /* center section heading */
}

.group-title {
  color: #fff;
  margin: 0 0 8px 0;
  font-weight: 800;
  letter-spacing: 0.3px;
}

/* List container – center items */
.sports-list {
  list-style: none;
  margin: 0 !important;
  padding: 0 !important;
  display: grid !important;
  gap: 10px !important;
  justify-items: center !important;  /* center each row */

  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  overflow: visible !important;
}

/* Reset any li defaults */
.sports-list li {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

/* Sport card – 50% of the viewport width, centered, darker translucent tint */
.sports-list button.sport-card {
  appearance: none;
  -webkit-appearance: none;

  width: 50vw;                /* requested: half the screen width */
  max-width: 560px;           /* keep from getting too large on desktop */
  border-radius: 14px !important;

  display: flex;
  align-items: center;
  justify-content: center;    /* center the text horizontally */
  padding: 12px 14px;

  background: rgba(var(--primary-color-rgb, 24, 43, 73), 0.28) !important; /* darker, still transparent */
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #fff;
  text-align: center;

  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease, border-color 120ms ease;

  /* neutralize global button styles */
  box-shadow: none !important;
  background-image: none !important;
}

.sports-list button.sport-card:hover {
  background: rgba(var(--primary-color-rgb, 24, 43, 73), 0.36) !important;
  transform: translateY(-1px);
}
.sports-list button.sport-card:focus-visible {
  outline: 2px solid var(--secondary-color, #ffcd00);
  outline-offset: 2px;
}
.sports-list button.sport-card.selected {
  border-color: var(--secondary-color, #ffcd00) !important;
  box-shadow: 0 0 0 3px rgba(255,205,0,0.22) !important;
}

/* Typography */
.label { font-size: 1rem; font-weight: 700; text-align: center; }

/* Buttons below */
.navigation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 8px 0 0;
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
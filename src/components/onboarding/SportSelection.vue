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
import { getUniversityBySlug, applyUniversityTheme } from '../../services/universityTheme'
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

    // Apply dynamic onboarding theme immediately
    try {
      applyUniversityTheme(this.uni)
    } catch (e) {
      // Non-fatal if CSS vars cannot be set yet
      console.warn('[SportSelection] applyUniversityTheme failed:', e)
    }

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
          return [r.replace(/\s+/g, ' ')]
        }

        // Left as-is; not rendered currently
        this.logoByLabel = {}
        for (const item of data ?? []) {
          const teamName = String(item?.team_name || '')
          if (teamName.startsWith(prefix)) {
            const remainder = teamName.slice(prefix.length).trim()
            for (const label of normalize(remainder)) {
              this.logoByLabel[label] = item?.team_logo_url || '/images/default-logo.png'
            }
          }
        }
      } catch (e) {
        console.warn('[SportSelection] fetchLogos failed:', e)
      }
    },
    goBack() {
      // Use router for the wizard flow; falls back to history if unavailable
      if (this.$router && this.uni?.slug) {
        this.$router.push({ name: 'OnboardingLanding', params: { uniSlug: this.uni.slug } })
      } else {
        window.history.back()
      }
    },
    continueToNextStep() {
      if (!this.selectedLabel) {
        this.error = 'Please select a sport to continue'
        return
      }
      // Router-based wizard: go to the notifications step
      if (this.$router && this.uni?.slug) {
        this.$router.push({ name: 'NotificationsStep', params: { uniSlug: this.uni.slug } })
      } else {
        // Fallback: emit for legacy container
        this.$emit('next-step', {
          step: 'sport',
          data: { selectedSportLabel: this.selectedLabel }
        })
      }
    }
  }
}
</script>

<style scoped>
.step-container {
  min-height: 100vh;
  padding: 2rem 1rem;
  text-align: center;
  position: relative;
}

.group {
  margin-top: 1.25rem;
}

.group-title {
  color: #fff;
  text-align: left;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin: 0.75rem 0 0.5rem;
}

.sports-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
  margin: 0;
}

.sport-card {
  width: 100%;
  text-align: center;
  background: color-mix(in srgb, var(--primary-color, #182B49) 18%, white);
  border: 1px solid color-mix(in srgb, var(--secondary-color, #FFCD00) 38%, transparent);
  color: white;
  padding: 12px 10px;
  border-radius: 10px;
  transition: transform .15s ease, filter .15s ease, box-shadow .15s ease;
}

.sport-card:hover { transform: translateY(-1px); }
.sport-card.selected {
  outline: 2px solid var(--secondary-color, #FFCD00);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary-color, #FFCD00) 30%, transparent);
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1rem;
}

.primary-button {
  background: var(--secondary-color, #FFCD00);
  color: #122;
  border: none;
  padding: 10px 16px;
  border-radius: 9999px;
  font-weight: 700;
}
.secondary-button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.35);
  padding: 10px 16px;
  border-radius: 9999px;
}
.error {
  color: #ff9aa2;
  margin-top: .75rem;
}
</style>
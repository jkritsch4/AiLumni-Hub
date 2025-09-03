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
  // New: accept props from the wizard wrapper and emit navigation/data events
  props: {
    universityData: { type: Object, default: () => ({ name: '', logo: '' }) },
    selectedData: { type: Object, default: () => ({}) }
  },
  emits: ['previous-step', 'next-step', 'update-data'],
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

    // Restore a pre-selected sport if present
    const pre = Array.isArray(this.selectedData?.sports) && this.selectedData.sports[0]
    if (pre) this.selectedLabel = pre

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
      // Persist selection immediately so Back/Forward retains state
      this.$emit('update-data', { sports: [this.selectedLabel] })
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
      this.$emit('previous-step')
    },
    continueToNextStep() {
      if (!this.selectedLabel) {
        this.error = 'Please select a sport to continue'
        return
      }
      // Let the wizard handle routing and history
      this.$emit('update-data', { sports: [this.selectedLabel] })
      this.$emit('next-step', { sports: [this.selectedLabel] })
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

/* Titles in white */
.step-container > h2 {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 0.25rem;
}
.subtitle {
  color: rgba(255,255,255,0.92);
  margin: 0 0 1rem;
}

.group { margin-top: 1.25rem; }

/* Center section titles */
.group-title {
  color: #fff;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin: 0.75rem 0 0.75rem;
}

/* Transparent containers */
.group,
.sports-list {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}
.sports-list,
.sports-list > li {
  background-color: transparent !important;
}
.sports-list::before,
.sports-list::after,
.sports-list > li::before,
.sports-list > li::after {
  content: none !important;
}

/* Grid */
.sports-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 12px;
  padding: 0;
  margin: 0;
}
.sports-list > li {
  margin: 0;
  padding: 0;
  border: 0;
}

/* Transparent tiles with darker tint */
.sport-card {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  cursor: pointer;
  isolation: isolate;

  /* Fallback: rgba tint so pattern remains visible */
  background-color: rgba(var(--primary-color-rgb, 24,43,73), 0.16);
  /* Modern: slightly richer mix if supported */
  background: rgba(var(--primary-color-rgb, 24,43,73), 0.16);
  background: color-mix(in srgb, var(--primary-color, #182B49) 80%, transparent);

  border: 1px solid rgba(255,255,255,0.16);
  color: #fff;
  padding: 14px 12px;
  border-radius: 16px;

  /* Depth + subtle glass effect to darken behind without hiding pattern */
  box-shadow: 0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
  -webkit-backdrop-filter: saturate(115%) brightness(0.95);
  backdrop-filter: saturate(115%) brightness(0.95);

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    border-color .15s ease,
    background-color .15s ease,
    opacity .15s ease;
  min-height: 56px;
}

/* Text as-is */
.label { font-weight: 800; letter-spacing: 0.2px; }

/* Hover: slightly stronger tint + lift */
.sport-card:hover {
  background-color: rgba(var(--primary-color-rgb, 24,43,73), 0.22);
  background: rgba(var(--primary-color-rgb, 24,43,73), 0.22);
  background: color-mix(in srgb, var(--primary-color, #182B49) 28%, transparent);

  border-color: rgba(255,255,255,0.22);
  box-shadow: 0 8px 22px rgba(0,0,0,0.16);
}

/* Focus ring */
.sport-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255,255,255,.85),
    0 0 0 6px var(--ring-secondary, rgba(255,205,0,.45));
}

/* Active */
.sport-card:active { transform: translateY(0); }

/* Selected: keep the accent outline, maintain subtle tint */
.sport-card.selected {
  outline: 2px solid var(--secondary-color, #FFCD00);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary-color, #FFCD00) 30%, transparent);
  border-color: color-mix(in srgb, var(--secondary-color, #FFCD00) 70%, white);
}

/* Footer buttons */
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

.error { color: #ff9aa2; margin-top: .75rem; }

/* One column on small screens */
@media (max-width: 520px) {
  .sports-list { grid-template-columns: 1fr; }
}
</style>
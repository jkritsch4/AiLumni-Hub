<script setup>
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue';
import { getStandings, getCurrentTeam, getTeamInfo } from '../services/api';
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

const standings = ref([]);
const loading = ref(true);
const error = ref(null);
const conferenceFilter = ref('');

const props = defineProps({
  subscribedTeams: {
    type: Array,
    required: true,
    default: () => []
  },
  primaryColor: {
    type: String,
    default: '#007bff'
  },
  selectedSport: {
    type: String,
    required: true
  }
});

// Sport variant helper (covers common feed label differences)
function sportVariants(sport) {
  const s = (sport || '').toLowerCase();
  if (s === 'basketball') {
    return ['Basketball', "Men's Basketball", 'Mens Basketball', 'M Basketball'];
  }
  if (s === 'golf') {
    return ['Golf', "Men's Golf", 'Mens Golf'];
  }
  return [sport];
}

/**
 * Name matching helpers
 * - Robust canonicalization
 * - Explicit synonym groups so "USF" != "San Francisco State"
 * - No substring matching to avoid cross-team collisions
 */

// Canonicalize a school string into a comparable form
function canonicalize(input = '') {
  return String(input)
    .toLowerCase()
    // normalize unicode apostrophes/quotes and dots
    .replace(/[’'`]/g, '')
    .replace(/\./g, '')
    // normalize saint/st forms
    .replace(/\b(st|saint)\b/g, 'saint')
    // remove sport tokens
    .replace(/\b(mens|men?s|womens|women?s)\b/g, '')
    .replace(/\b(baseball|basketball|golf|soccer|volleyball|football|team)\b/g, '')
    // normalize university abbreviations
    .replace(/\buniv(?:ersity)?\b/g, 'university')
    .replace(/\bcal poly san luis obispo\b/g, 'cal poly')
    // collapse whitespace and non-alphanumerics
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Synonym groups: each inner array represents the same school
const SYNONYM_GROUPS = [
  // WCC examples
  ['USF', 'San Francisco', 'University of San Francisco', 'Dons'],
  ['USD', 'San Diego', 'University of San Diego', 'Toreros'],
  ['LMU', 'Loyola Marymount', 'Loyola Marymount University'],
  ['Saint Mary\'s', 'St Marys', 'St Mary\'s', 'Saint Marys', 'SMC', 'Saint Mary\'s College'],
  ['Gonzaga', 'GU', 'Zags'],
  ['Pacific', 'University of the Pacific', 'UOP', 'Tigers'],
  ['Portland', 'University of Portland', 'Pilots'],
  ['Santa Clara', 'SCU', 'Santa Clara University', 'Broncos'],
  ['Pepperdine', 'Pepperdine University', 'Waves'],

  // Big West / CSU examples
  ['SF State', 'San Francisco State', 'San Francisco St', 'SFSU', 'Gators'],
  ['UCSD', 'UC San Diego', 'University of California San Diego', 'Tritons'],
  ['Cal Poly', 'Cal Poly SLO', 'California Polytechnic', 'Mustangs'],
  ['Long Beach State', 'Long Beach', 'LBSU', 'Beach'],

  // Add more as you expand schools
];

// Build a map from canonical variant to group index for fast lookup
const GROUP_INDEX = (() => {
  const map = new Map();
  SYNONYM_GROUPS.forEach((group, idx) => {
    group.forEach(v => map.set(canonicalize(v), idx));
  });
  return map;
})();

// Expand a label into canonical variants using the groups
function expandSynonyms(label = '') {
  const canon = canonicalize(label);
  const result = new Set([canon]);

  // From group mapping
  const groupIdx = GROUP_INDEX.get(canon);
  if (groupIdx !== undefined) {
    for (const v of SYNONYM_GROUPS[groupIdx]) {
      result.add(canonicalize(v));
    }
  }

  // Heuristics for common forms
  // Example: "university of x" vs "x"
  const uniDrop = canon.replace(/\buniversity of\b/g, '').trim();
  if (uniDrop && uniDrop !== canon) result.add(uniDrop);

  // Example: "san diego" vs "sd", "san francisco state" vs "sf state"
  const abbrev = uniDrop
    .replace(/\bsan francisco state\b/g, 'sf state')
    .replace(/\bsan francisco\b/g, 'sf')
    .replace(/\bsan diego\b/g, 'sd')
    .replace(/\blong beach state\b/g, 'lbsu');
  if (abbrev && abbrev !== canon) result.add(abbrev);

  return Array.from(result);
}

// True if two team labels refer to the same school (using groups and canon equality)
function isSameSchool(a, b) {
  const ca = canonicalize(a);
  const cb = canonicalize(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;

  const ga = GROUP_INDEX.get(ca);
  const gb = GROUP_INDEX.get(cb);
  if (ga !== undefined && gb !== undefined && ga === gb) return true;

  // Cross-check expansions for exact equality (no substring matching)
  const expandA = expandSynonyms(a);
  const expandB = expandSynonyms(b);
  const setB = new Set(expandB);
  return expandA.some(v => setB.has(v));
}

// Use user’s current team or any subscribed team as the highlight target(s)
function isTeamMatch(standingTeamName, teamLabel) {
  if (!standingTeamName || !teamLabel) return false;
  return isSameSchool(standingTeamName, teamLabel);
}

async function loadStandings() {
  const activeTeam = getCurrentTeam();
  const context = createDebugContext('Standings', 'loadStandings', { selectedSport: props.selectedSport, activeTeam });
  
  loading.value = true;
  error.value = null;
  
  try {
    // Try multiple sport labels and merge
    const variants = sportVariants(props.selectedSport);
    const seenKey = new Set();
    const merged = [];

    for (const v of variants) {
      const arr = await getStandings(v);
      for (const item of (arr || [])) {
        const key = `${(item.team_name || '').toLowerCase()}|${(item.standing_type || '').toLowerCase()}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          merged.push(item);
        }
      }
    }

    debug.info(context, `Merged ${merged.length} standings records across sport variants: ${variants.join(', ')}`);

    if (merged.length === 0) {
      standings.value = [];
      conferenceFilter.value = '';
      debug.warn(context, 'No standings data found for any sport variant');
      return;
    }

    // Prefer conference from TeamInfo; if not present, infer by matching a row
    let userConference = '';
    let inferredSport = props.selectedSport;

    try {
      const info = await getTeamInfo(activeTeam);
      if (info?.conference_name) {
        userConference = info.conference_name;
        debug.info(context, `Using conference from TeamInfo: ${userConference}`);
      }
      if (info?.sport) {
        inferredSport = info.sport;
      }
    } catch {
      // ignore and infer from rows
    }

    if (!userConference) {
      const row = merged.find(row => isTeamMatch(row.team_name, activeTeam) || props.subscribedTeams.some(t => isTeamMatch(row.team_name, t)));
      if (row?.standing_type) {
        userConference = row.standing_type;
        debug.info(context, `Inferred conference from standings row: ${userConference} via team ${row.team_name}`);
      }
    }

    // Absolute fallback: first conference available
    if (!userConference && merged.length > 0) {
      userConference = merged[0].standing_type || '';
      debug.info(context, `Fallback conference: ${userConference}`);
    }

    conferenceFilter.value = userConference;

    // Filter by conference and sort by wins (desc), then losses (asc)
    const conferenceStandings = merged
      .filter(team => team.standing_type === userConference)
      .sort((a, b) => {
        const winsA = parseInt(a.conf_wins) || 0;
        const lossesA = parseInt(a.conf_losses) || 0;
        const winsB = parseInt(b.conf_wins) || 0;
        const lossesB = parseInt(b.conf_losses) || 0;
        if (winsB !== winsA) return winsB - winsA;
        return lossesA - lossesB;
      });

    standings.value = conferenceStandings;
    debug.info(context, `Loaded ${conferenceStandings.length} standings entries for ${userConference}`);
  } catch (err) {
    handleComponentError(context, err);
    error.value = err;
    standings.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStandings();

  // Also refresh when URL navigation likely changed the current team (query params)
  window.addEventListener('popstate', loadStandings);
  window.addEventListener('hashchange', loadStandings);
  // Custom hook broadcast by Dashboard
  window.addEventListener('aihub:team-changed', loadStandings);
});

onUnmounted(() => {
  window.removeEventListener('popstate', loadStandings);
  window.removeEventListener('hashchange', loadStandings);
  window.removeEventListener('aihub:team-changed', loadStandings);
});

// Watchers to reload when sport or subscribed teams change
watch(() => props.selectedSport, () => {
  loadStandings();
});

watch(() => props.subscribedTeams, () => {
  loadStandings();
}, { deep: true });

// Keep the percentage helper the same
function calculatePercentage(wins, losses) {
  const totalGames = wins + losses;
  if (isNaN(totalGames) || totalGames === 0) return 'N/A';
  return (wins / totalGames).toFixed(3).substring(1);
}

// Highlight if current team or any subscribed team matches (with synonym logic)
function isUserTeam(standingTeamName) {
  const activeTeam = getCurrentTeam();
  if (activeTeam && isTeamMatch(standingTeamName, activeTeam)) return true;
  return props.subscribedTeams.some(t => isTeamMatch(standingTeamName, t));
}
</script>

<template>
  <div class="standings-section">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading standings...</p>
    </div>
    <div v-if="error">Error loading standings: {{ error.message }}</div>

    <transition name="fade">
      <div v-if="!loading && !error && standings.length > 0" class="standings-table-container">
        <ul class="standings-table">
          <li class="table-header" :style="{ backgroundColor: primaryColor }">
            <span class="column-school">School</span>
            <span class="column-conf-record">Conf. Record</span>
            <span class="column-conf-pct">Conf. PCT</span>
            <span class="column-overall-record">Overall Record</span>
            <span class="column-overall-pct">Overall PCT</span>
            <span class="column-streak">Streak</span>
          </li>
          <li v-for="team in standings" 
              :key="team.team_name + team.standing_type" 
              class="table-row"
              :class="{ 'highlight-row': isUserTeam(team.team_name) }">
            <span class="column-school">{{ team.team_name }}</span>
            <span class="column-conf-record">{{ team.conf_wins }}-{{ team.conf_losses }}</span>
            <span class="column-conf-pct">{{ calculatePercentage(parseInt(team.conf_wins), parseInt(team.conf_losses)) }}</span>
            <span class="column-overall-record">{{ team.overall_wins }}-{{ team.overall_losses }}</span>
            <span class="column-overall-pct">{{ calculatePercentage(parseInt(team.overall_wins), parseInt(team.overall_losses)) }}</span>
            <span class="column-streak">{{ team.streak }}</span>
          </li>
        </ul>
      </div>
    </transition>

    <p v-if="!loading && !error && standings.length === 0" class="no-data-message">
      No standings data found for {{ props.selectedSport }}{{ conferenceFilter ? ` in the ${conferenceFilter}` : '' }}.
    </p>
  </div>
</template>

<style scoped>
.standings-section {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  background-color: transparent;
  border-radius: 8px;
  color: white;
}
.standings-table-container {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
  margin-top: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Table background now transparent; rows provide the tinted surface */
.standings-table {
  list-style: none;
  padding: 0;
  width: 100%;
  border-collapse: collapse;
  background-color: transparent;
  color: white;
  border-radius: 8px;
  font-size: 0.9em;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
  margin: 0 auto;
  text-align: center;
  overflow: hidden;
}
.table-header, .table-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

/* Header remains as-is via inline binding */
.table-header {
  font-weight: bold;
  color: white;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
}

/* Data rows: darker translucent hue of primary */
.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  background-color: rgba(var(--primary-color-rgb, 24, 43, 73), 0.6);
  transition: background-color 0.2s ease;
}
.table-row:hover {
  background-color: rgba(var(--primary-color-rgb, 24, 43, 73), 0.6);
}
.table-row:last-child { border-bottom: none; }

/* Highlight uses secondary accent (edge + inner glow), no change needed */
.table-row.highlight-row:hover {
  background-color: rgba(var(--secondary-color-rgb, 255, 205, 0), 0.25);
  box-shadow: 
    inset 0 0 16px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.5),
    inset 0 0 8px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.9);
}
.highlight-row {
  background-color: rgba(var(--secondary-color-rgb, 255, 205, 0), 0.15);
  border-left: 6px solid var(--secondary-color, #FFCD00);
  border-radius: 0 4px 4px 0;
  font-weight: 600;
  position: relative;
  box-shadow: 
    inset 0 0 12px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.4),
    inset 0 0 5px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.8);
  transition: all 0.3s ease;
}

/* Columns */
.column-school,
.column-conf-record,
.column-conf-pct,
.column-overall-record,
.column-overall-pct,
.column-streak {
  padding: 12px;
  text-align: center;
  box-sizing: border-box;
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.column-school {
  flex-basis: 25%;
  flex-grow: 1;
  text-align: left;
}

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-to, .fade-leave-from { opacity: 1; }

/* Loading */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  margin-top: 20px;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

/* Empty state */
.no-data-message {
  color: white;
  padding: 15px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 15px auto;
  max-width: 80%;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
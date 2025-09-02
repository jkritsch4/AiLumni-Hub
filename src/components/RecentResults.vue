<template>
  <div class="recent-results-section">
    <!-- Card-style loading (matches Upcoming Game feel) -->
    <div v-if="loading" class="loading-card fade-in-card" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading-text">Loading Recent Results...</p>
    </div>

    <div v-if="error" class="error">Error loading results: {{ error?.message }}</div>

    <div v-if="!loading && !error && recentResults.length > 0" class="results-table-container">
      <table class="results-table">
        <thead>
          <tr :style="{ backgroundColor: props.primaryColor }">
            <th>Opponent</th>
            <th>Date</th>
            <th>Location</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in recentResults" :key="result.game_id">
            <td class="opponent-cell">
              <img
                :src="result.opponent_logo_url || '/images/default-logo.png'"
                :alt="result.opponent_name + ' Logo'"
                class="opponent-logo"
                @error="(event: Event) => { 
                  const target = event.target as HTMLImageElement;
                  if (target) {
                    target.src = '/images/default-logo.png';
                  }
                }"
              />
              <span class="opponent-name">{{ result.opponent_name }}</span>
            </td>
            <td>{{ formatDate(result.game_date) }}</td>
            <td>{{ getLocationText(result) }}</td>
            <td :class="outcomeClass(result.game_outcome)">
              {{ formatGameResult(result) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && !error && recentResults.length === 0" class="no-results">
      No recent results found for {{ props.subscribedTeams.join(', ') }}.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue';
import { getRecentGames, getCurrentTeam, type Game } from '../services/api';
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

const recentResults = ref<Game[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);
const limit = 5;

// Receive subscribedTeams and primaryColor props
const props = defineProps({
  subscribedTeams: {
    type: Array as () => string[],
    required: true,
    default: () => []
  },
  primaryColor: {
    type: String,
    default: '#007bff'
  }
});

async function loadRecentResults() {
  const context = createDebugContext('RecentResults', 'loadRecentResults', { subscribedTeams: props.subscribedTeams });
  
  try {
    loading.value = true;
    error.value = null;
    
    const currentTeam = getCurrentTeam();
    const teamToFetch = currentTeam || props.subscribedTeams[0] || '';
    
    if (!teamToFetch) {
      debug.warn(context, 'No team specified for recent results');
      recentResults.value = [];
      return;
    }
    
    debug.info(context, `Fetching recent games for team: ${teamToFetch}`);
    const games = await getRecentGames(teamToFetch);
    
    recentResults.value = games.slice(0, limit);
    debug.info(context, `Loaded ${recentResults.value.length} recent results`);
    
  } catch (err) {
    handleComponentError(context, err);
    error.value = err instanceof Error ? err : new Error('Failed to load recent results');
  } finally {
    loading.value = false;
  }
}

function refetch() {
  loadRecentResults();
}

onMounted(() => {
  loadRecentResults();
  // Re-fetch when the current team changes via URL nav or custom event
  window.addEventListener('popstate', refetch);
  window.addEventListener('hashchange', refetch);
  window.addEventListener('aihub:team-changed', refetch as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('popstate', refetch);
  window.removeEventListener('hashchange', refetch);
  window.removeEventListener('aihub:team-changed', refetch as EventListener);
});

// Watch for changes in subscribed teams
watch(() => props.subscribedTeams, () => {
  debug.info(createDebugContext('RecentResults', 'watch'), 'Subscribed teams changed, reloading results');
  loadRecentResults();
}, { deep: true });

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Normalize and display ONLY the raw game_outcome value (no appending)
function normalizeOutcomeOnly(outcomeRaw: string | undefined | null): string {
  const raw = String(outcomeRaw ?? '').trim();
  if (!raw) return '';
  // Ensure spacing like "L 2-13" instead of "L2-13" and normalize dash spacing
  const spaced = raw.replace(/^([WLT])\s*(\d)/i, '$1 $2');
  const dashTight = spaced.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
  return dashTight.toUpperCase();
}

function formatGameResult(game: Game): string {
  return normalizeOutcomeOnly(game.game_outcome);
}

function outcomeClass(outcomeRaw?: string): string {
  const first = (outcomeRaw || '').trim().charAt(0).toUpperCase();
  if (first === 'W') return 'win';
  if (first === 'L') return 'loss';
  if (first === 'T') return 'tie';
  return '';
}

function getLocationText(game: Game): string {
  // Use game_location if available, otherwise fall back to home/away logic
  if (game.game_location) {
    return game.game_location;
  }
  return game.home_away === 'Home' ? 'Home' : `@ ${game.opponent_name}`;
}
</script>

<style scoped>
.recent-results-section {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  background-color: transparent;
  border-radius: 8px;
  color: white;
}

/* Card-style loading (matches Upcoming Game "box fade-in") */
.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 14px;
  background: var(--primary-40a, rgba(24,43,73,0.40));
  border: 1px solid var(--secondary-25a, rgba(255,205,0,0.25));
  border-radius: 16px;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.04);
}
.fade-in-card { animation: cardFade 220ms ease-in; }
@keyframes cardFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: conic-gradient(var(--secondary-color, #FFCD00) 0 90deg, var(--primary-color, #182B49) 90deg 360deg);
  -webkit-mask: radial-gradient(farthest-side, #0000 58%, #000 60%);
          mask: radial-gradient(farthest-side, #0000 58%, #000 60%);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(1turn); } }

.loading-text {
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1.05rem;
}

.error {
  text-align: center;
  padding: 20px;
  color: #ff6b6b;
  font-family: 'Bebas Neue', sans-serif;
}

.results-table-container {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
  margin-top: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Table uses transparent background; rows will carry the tinted surface */
.results-table {
  width: 100%;
  border-collapse: collapse;
  background-color: transparent;
  color: white;
  border-radius: 8px;
  font-size: 1em;
  font-family: 'Bebas Neue', sans-serif;
  box-sizing: border-box;
  margin: 0 auto;
  text-align: left;
  overflow: hidden;
}

/* Header stays as-is (bound to primaryColor prop) */
.results-table th,
.results-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 1.1em;
  letter-spacing: 0.5px;
}
.results-table th {
  font-weight: bold;
  color: white;
  background-color: var(--primary-color, #182B49);
  text-transform: uppercase;
  font-size: 1em;
}

/* Data rows: darker translucent hue of the primary color */
.results-table tbody tr {
  background-color: rgba(var(--primary-color-rgb, 24, 43, 73), 0.35);
  transition: background-color 0.2s ease;
}
.results-table tbody tr:hover {
  background-color: rgba(var(--primary-color-rgb, 24, 43, 73), 0.45);
}
.results-table tr:last-child td { border-bottom: none; }

.opponent-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  text-align: left !important;
}
.opponent-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: transparent;
  border-radius: 4px;
}
.opponent-name { font-weight: 500; font-size: 1em; }

.no-results {
  color: white;
  padding: 15px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 15px auto;
  max-width: 80%;
}

@media (max-width: 768px) {
  .results-table { font-size: 0.8em; }
  .results-table th, .results-table td { padding: 8px 4px; }
  .opponent-cell { flex-direction: column; gap: 4px; text-align: center !important; }
  .school-logo { width: 20px; height: 20px; }
}
</style>
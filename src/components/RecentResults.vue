<template>
  <div class="recent-results-section">
    <div v-if="loading">Loading recent results...</div>
    <div v-if="error">Error loading results: {{ error?.message }}</div>
    <div v-if="!loading && !error && recentResults.length > 0" class="results-table-container">
      <table class="results-table">
        <thead>
          <tr :style="{ backgroundColor: primaryColor }">
            <th>Opponent</th>
            <th>Date</th>
            <th>Location</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in recentResults" :key="result.id">
            <td class="opponent-cell">
              <img
                :src="result.opponent_logo_url || '/images/default-logo.png'"
                :alt="result.opponent_name + ' Logo'"
                class="school-logo"
                @error="(event: Event) => { 
                  const target = event.target as HTMLImageElement;
                  if (target) {
                    target.src = '/images/default-logo.png';
                  }
                }"
              />
            </td>
            <td>{{ formatDate(result.start_time_utc) }}</td>
            <td>{{ result.game_location }}</td>
            <td>{{ result.game_outcome }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && !error && recentResults.length === 0">No recent results found for {{ props.subscribedTeams.join(', ') }}.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

// Define types
interface GameResult {
  id: string;
  dataType: string;
  team_name: string;
  opponent_name: string;
  opponent_logo_url: string;
  start_time_utc: string;
  game_location: string;
  game_outcome: string;
  [key: string]: any; // For any other properties
}

const recentResults = ref<GameResult[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';
const limit = 5;

// Step 2: Receive subscribedTeams and primaryColor props
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

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    console.log('[RecentResults] Fetching data from API...');
    const response = await fetch(apiUrl);
    console.log('[RecentResults] API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[RecentResults] Raw API data:', data);
    
    let gameResults = data.filter((item: any) => item.dataType === 'gameResult');
    console.log('[RecentResults] Filtered game results:', gameResults);

    // Step 3: Filter to the subscribed teams (should include UCSD Baseball)
    if (props.subscribedTeams && props.subscribedTeams.length > 0) {
      gameResults = gameResults.filter((game: any) => props.subscribedTeams.includes(game.team_name));
      console.log(`[RecentResults] Games for subscribed teams ${props.subscribedTeams}:`, gameResults);
    }

    const nowUtc = new Date().toISOString();
    const pastGames = gameResults.filter((game: any) => game.start_time_utc < nowUtc && game.game_outcome !== 'Pending');
    console.log('[RecentResults] Past games:', pastGames);

    if (pastGames.length > 0) {
      pastGames.sort((a: any, b: any) => {
        return new Date(b.start_time_utc).getTime() - new Date(a.start_time_utc).getTime();
      });
      recentResults.value = pastGames.slice(0, limit);
      console.log('[RecentResults] Final recent results:', recentResults.value);
    } else {
      recentResults.value = [];
      console.log('[RecentResults] No recent results found');
    }
  } catch (err) {
    error.value = err as Error;
    console.error('[RecentResults] Error fetching recent results:', err);
  } finally {
    loading.value = false;
    console.log('[RecentResults] Loading complete, state:', { 
      loading: loading.value,
      error: error.value,
      resultsCount: recentResults.value.length 
    });
  }
});

function formatDate(utcString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  return new Date(utcString).toLocaleDateString('en-US', options);
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

.results-table-container {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(24, 43, 73, 0.7);
  color: white;
  border-radius: 8px;
  overflow: hidden;
}

.results-table th,
.results-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.results-table th {
  color: white;
  font-weight: 600;
  background-color: #182B49;
}

.opponent-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.school-logo {
  width: 35px;
  height: 35px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

@media (max-width: 768px) {
  .results-table th,
  .results-table td {
    padding: 8px;
    font-size: 14px;
  }

  .school-logo {
    width: 24px;
    height: 24px;
  }
}
</style>

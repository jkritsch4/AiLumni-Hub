<script setup>
import { ref, onMounted, defineProps } from 'vue';

const recentResults = ref([]);
const loading = ref(true);
const error = ref(null);
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';
const limit = 5;

// Step 2: Receive subscribedTeams and primaryColor props
const props = defineProps({
  subscribedTeams: {
    type: Array,
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
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let gameResults = data.filter(item => item.dataType === 'gameResult');

    // Step 3: Filter to ONLY UCSD Baseball games
    gameResults = gameResults.filter(game => game.team_name === 'UCSD Baseball');

    const nowUtc = new Date().toISOString();
    const pastGames = gameResults.filter(game => game.start_time_utc < nowUtc && game.game_outcome !== 'Pending');

    if (pastGames.length > 0) {
      pastGames.sort((a, b) => (new Date(b.start_time_utc) - new Date(a.start_time_utc)));
      recentResults.value = pastGames.slice(0, limit);
    } else {
      recentResults.value = [];
    }
  } catch (err) {
    error.value = err;
    console.error("Error fetching recent results:", err);
  } finally {
    loading.value = false;
  }
});

function formatDate(utcString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(utcString).toLocaleDateString('en-US', options);
}
</script>

<template>
  <div class="recent-results-section">
    <div v-if="loading">Loading recent results...</div>
    <div v-if="error">Error loading results: {{ error.message }}</div>
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
                @error="event => event.target.src = '/images/default-logo.png'"
              />
              <span>{{ result.opponent_name }}</span>
            </td>
            <td>{{ formatDate(result.start_time_utc) }}</td>
            <td>{{ result.game_location }}</td>
            <td>{{ result.game_outcome }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && !error && recentResults.length === 0">No recent results found for UCSD Baseball.</p>
  </div>
</template>

<style scoped>
.recent-results-section {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.results-table-container {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
}

.results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #222;
  border-radius: 8px;
  font-size: 1em;
  font-family: 'Arial', sans-serif;
  margin: 0 auto 10px auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.results-table th, .results-table td {
  padding: 12px 10px;
  text-align: left;
  color: #fff;
  vertical-align: middle;
}

.results-table th {
  font-weight: bold;
  font-size: 1.1em;
  letter-spacing: 1px;
  border-bottom: 2px solid #333;
}

.results-table tr {
  border-bottom: 1px solid #333;
  transition: background 0.2s;
}

.results-table tr:last-child {
  border-bottom: none;
}

.results-table tr:hover {
  background: #292929;
}

.opponent-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.school-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  vertical-align: middle;
  /* Remove background and border for transparency */
  background: transparent;
  border-radius: 4px;
  border: none;
}
</style>

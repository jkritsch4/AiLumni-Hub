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
      <ul class="results-table">
        <li class="table-header" :style="{ backgroundColor: primaryColor }">
          <span class="column-opponent">Opponent</span>
          <span class="column-date">Date</span>
          <span class="column-location">Location</span>
          <span class="column-result">Result</span>
        </li>
        <li v-for="result in recentResults" :key="result.id" class="table-row">
          <span class="column-opponent">
            <img v-if="result.opponent_logo_url" :src="result.opponent_logo_url" :alt="result.opponent_name + ' Logo'" class="school-logo" style="max-width: 50px; max-height: 50px; vertical-align: middle;">
            <span v-else style="font-size: 0.9em;">{{ result.opponent_name }}</span>
          </span>
          <span class="column-date" style="font-size: 0.9em;">{{ formatDate(result.start_time_utc) }}</span>
          <span class="column-location" style="font-size: 0.9em;">{{ result.game_location }}</span>
          <span class="column-result" style="font-size: 0.9em;">{{ result.game_outcome }}</span>
        </li>
      </ul>
    </div>
    <p v-if="!loading && !error && recentResults.length === 0">No recent results found for UCSD Baseball.</p>
  </div>
</template>

<style scoped>
/*  Styling is mostly in Dashboard.vue */
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
  list-style: none;
  padding: 0;
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  background-color: #2a2a2a;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
  margin: 0 auto;
}
.table-header, .table-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}
.table-header {
  font-weight: bold;
  color: white;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
}
.table-row {
  border-bottom: 1px solid #444;
  background-color: #252525;
  box-sizing: border-box;
}
.table-row:last-child {
  border-bottom: none;
}
/*  DIRECT and SPECIFIC column styling for centering and wrapping */
.column-opponent,
.column-date,
.column-location,
.column-result {
  padding: 6px 4px;
  text-align: center;
  box-sizing: border-box;
  min-width: 80px;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
/* More compact column widths - REMOVE flex properties */
.column-date {
  min-width: 70px;
  text-align: center;
}
.column-result {
  min-width: 50px;
  text-align: center;
}
.school-logo {
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 0 auto;
  vertical-align: middle;
}
/* Ensure text wrapping for Location column specifically */
.column-location {
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
</style>

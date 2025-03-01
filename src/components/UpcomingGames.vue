<script setup>
import { ref, onMounted } from 'vue';

const upcomingGames = ref([]);
const loading = ref(true);
const error = ref(null);
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events'; // ✅ ACTUAL API URL - REPLACE IF DIFFERENT

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    upcomingGames.value = data.filter(item => item.dataType === 'gameResult'); // Filter for game results
  } catch (err) {
    error.value = err;
    console.error("Error fetching upcoming games:", err);
  } finally {
    loading.value = false;
  }
});

function formatDate(utcString) {
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  return new Date(utcString).toLocaleDateString('en-US', options);
}

</script>

<template>
  <div>
    <h2>Upcoming Games</h2>
    <div v-if="loading">Loading upcoming games...</div>
    <div v-if="error">Error loading games: {{ error.message }}</div>
    <ul v-if="!loading && !error && upcomingGames.length > 0">
      <li v-for="game in upcomingGames" :key="game.id">
        {{ game.team_name }} vs {{ game.opponent_name }} -
        {{ formatDate(game.start_time_utc) }}
      </li>
    </ul>
    <p v-if="!loading && !error && upcomingGames.length === 0">No upcoming games found.</p>
  </div>
</template>

<style scoped>
/* Add component-specific styles here */
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
}
</style>

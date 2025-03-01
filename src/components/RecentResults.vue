<script setup>
import { ref, onMounted } from 'vue';

const recentResults = ref([]);
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
    recentResults.value = data.filter(item => item.dataType === 'gameResult'); // Filter for game results - adjust if needed
  } catch (err) {
    error.value = err;
    console.error("Error fetching recent results:", err);
  } finally {
    loading.value = false;
  }
});

function formatDate(utcString) {
  const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  return new Date(utcString).toLocaleDateString('en-US', options);
}

</script>

<template>
  <div>
    <h2>Recent Results</h2>
    <div v-if="loading">Loading recent results...</div>
    <div v-if="error">Error loading results: {{ error.message }}</div>
    <ul v-if="!loading && !error && recentResults.length > 0">
      <li v-for="result in recentResults" :key="result.id">
        {{ result.team_name }} vs {{ result.opponent_name }} -
        {{ result.game_outcome }} - {{ formatDate(result.start_time_utc) }}
      </li>
    </ul>
    <p v-if="!loading && !error && recentResults.length === 0">No recent results available.</p>
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

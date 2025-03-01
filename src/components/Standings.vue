<script setup>
import { ref, onMounted } from 'vue';

const standingsData = ref([]);
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
    standingsData.value = data.filter(item => item.dataType === 'standings'); // Filter for standings data
  } catch (err) {
    error.value = err;
    console.error("Error fetching standings data:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2>Conference Standings</h2>
    <div v-if="loading">Loading standings...</div>
    <div v-if="error">Error loading standings: {{ error.message }}</div>
    <ul v-if="!loading && !error && standingsData.length > 0">
      <li v-for="standing in standingsData" :key="standing.team_name">
        {{ standing.team_name }} - {{ standing.standing_type }} Conference: Wins: {{ standing.overall_wins }}, Losses: {{ standing.overall_losses }}
      </li>
    </ul>
    <p v-if="!loading && !error && standingsData.length === 0">No standings data available.</p>
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

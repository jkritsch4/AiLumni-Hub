<template>
  <div>
    <h2>Recent Results</h2>
    <ul v-if="recentResults.length > 0">
      <li v-for="game in recentResults" :key="game.start_time_utc">
        {{ formatDate(game.start_time_utc) }}: {{ game.team_name }}
        {{ game.game_outcome }} vs {{ game.opponent_name }}
      </li>
    </ul>
    <p v-else>No recent game results available.</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { API } from 'aws-amplify';

export default {
  setup() {
    const recentResults = ref([]);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const resultsData = await API.get('SportsDataAPI', '/games/recent');
        setRecentResults(resultsData);
        loading.value = false;
      } catch (err) {
        error.value = err;
        loading.value = false;
        console.error("Error fetching recent results:", err);
      }
    });
    function setRecentResults(data) {
        recentResults.value = data;
    }

    const formatDate = (utcString) => {
      const options = { month: 'short', day: 'numeric' };
      return new Date(utcString).toLocaleDateString('en-US', options);
    };

    return {
      recentResults,
      loading,
      error,
      formatDate
    };
  }
};
</script>

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

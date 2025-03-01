<template>
  <div>
    <h2>Upcoming Games</h2>
    <ul v-if="upcomingGames.length > 0">
      <li v-for="game in upcomingGames" :key="game.start_time_utc">
        {{ game.team_name }} vs {{ game.opponent_name }} -
        {{ formatDate(game.start_time_utc) }}
        <span v-if="game.streaming_link">
          <a :href="game.streaming_link" target="_blank" rel="noopener noreferrer">Watch Live</a>
        </span>
      </li>
    </ul>
    <p v-else>No upcoming games scheduled.</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { API } from 'aws-amplify';

export default {
  setup() {
    const upcomingGames = ref([]);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const gamesData = await API.get('SportsDataAPI', '/games/upcoming');
        setUpcomingGames(gamesData);
        loading.value = false;
      } catch (err) {
        error.value = err;
        loading.value = false;
        console.error("Error fetching upcoming games:", err);
      }
    });

    function setUpcomingGames(data) {
        upcomingGames.value = data;
    }

    const formatDate = (utcString) => {
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
      return new Date(utcString).toLocaleDateString('en-US', options);
    };

    return {
      upcomingGames,
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
a {
  margin-left: 10px;
}
</style>

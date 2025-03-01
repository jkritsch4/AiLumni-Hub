<template>
  <div class="dashboard">
    <h1>Sports Dashboard</h1>
    <div class="sections">
      <div class="section">
        <upcoming-games />
      </div>
      <div class="section">
        <recent-results />
      </div>
      <div class="section">
        <standings />
      </div>
    </div>
  </div>
</template>

<script>
import UpcomingGames from './UpcomingGames.vue';
import RecentResults from './RecentResults.vue';
import Standings from './Standings.vue';

export default {
  components: {
    UpcomingGames,
    RecentResults,
    Standings
  }
};
</script>

<style scoped>
/* Basic dashboard layout styles */
.dashboard {
  font-family: sans-serif;
  padding: 20px;
}

.sections {
  display: flex;
  flex-direction: column; /* Stack sections vertically */
  gap: 20px; /* Spacing between sections */
}

.section {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* You can customize these styles further to match your desired dashboard look */
</style>

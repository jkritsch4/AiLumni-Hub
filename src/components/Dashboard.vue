<script setup>
import UpcomingGames from './UpcomingGames.vue';
import Standings from './Standings.vue';
import RecentResults from './RecentResults.vue';
</script>

<template>
  <div class="dashboard">
    <h1>Sports Dashboard</h1>
    <div class="sections">
      <section class="section">
        <UpcomingGames />
      </section>
      <section class="section">
        <RecentResults />
      </section>
      <section class="section">
        <Standings />
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.dashboard h1 {
  text-align: center;
  margin-bottom: 20px;
}

.sections {
  display: flex;
  flex-direction: column; /* Arrange sections vertically */
  gap: 20px; /* Spacing between sections */
}

.section {
  background-color: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

/* You can add more specific styling for lists, list items, etc. within each section */
</style>

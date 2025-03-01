<template>
  <div>
    <h2>Standings</h2>
    <table v-if="standingsData.length > 0" class="standings-table">
      <thead>
        <tr>
          <th>Team</th>
          <th>Conf. Record</th>
          <th>Overall Record</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="team in standingsData" :key="team.team_name">
          <td>{{ team.team_name }}</td>
          <td>{{ team.conf_wins }}-{{ team.conf_losses }}</td>
          <td>{{ team.overall_wins }}-{{ team.overall_losses }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>Standings data not available.</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { API } from 'aws-amplify';

export default {
  setup() {
    const standingsData = ref([]);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const data = await API.get('SportsDataAPI', '/standings');
        setStandingsData(data);
        loading.value = false;
      } catch (err) {
        error.value = err;
        loading.value = false;
        console.error("Error fetching standings:", err);
      }
    });

    function setStandingsData(data) {
        standingsData.value = data;
    }

    return {
      standingsData,
      loading,
      error
    };
  }
};
</script>

<style scoped>
/* Add component-specific styles here */
.standings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.standings-table th, .standings-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.standings-table th {
  background-color: #f0f0f0;
}
</style>

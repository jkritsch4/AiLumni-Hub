<script setup>
import { ref, onMounted, defineProps } from 'vue';

const standings = ref();
const loading = ref(true);
const error = ref(null);
const conferenceFilter = ref('');
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

const props = defineProps({
  subscribedTeams: {
    type: Array,
    required: true,
    default: () => []
  },
  primaryColor: {
    type: String,
    default: '#007bff'
  },
  selectedSport: {
    type: String,
    required: true
  }
});

onMounted(async () => {
  console.log("Selected Sport Prop in Standings:", props.selectedSport);
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("API Response Data:", data);
    let teamStandings = data.filter(item => item.dataType === 'standings');
    console.log("Filtered Standings Data (dataType=standings):", teamStandings);
    teamStandings = teamStandings.filter(team => team.sport === props.selectedSport);
    console.log("Standings after Sport Filter:", teamStandings);
    
    // Find the team data for the current team to get the conference from standing_type
    const currentTeamData = data.find(item => 
      props.subscribedTeams.includes(item.team_name) && 
      item.sport === props.selectedSport
    );
    
    if (currentTeamData?.standing_type) {
      conferenceFilter.value = currentTeamData.standing_type;
      console.log(`Found conference name for ${currentTeamData.team_name}: ${conferenceFilter.value}`);
    } else {
      // If no standing_type found, try to get any conference from standings data
      const anyConference = teamStandings.length > 0 ? teamStandings[0].standing_type : 'Big West Conference';
      conferenceFilter.value = anyConference;
      console.log(`Using default conference name: ${conferenceFilter.value}`);
    }
    
    teamStandings = teamStandings.filter(team => team.standing_type === conferenceFilter.value);
    console.log(`Standings after Conference Filter (${conferenceFilter.value}):`, teamStandings);
    if (teamStandings.length > 0) {
      teamStandings.sort((a, b) => {
        const winsA = parseInt(a.conf_wins);
        const lossesA = parseInt(a.conf_losses);
        const winsB = parseInt(b.conf_wins);
        const lossesB = parseInt(b.conf_losses);
        if (winsB !== winsA) {
          return winsB - winsA;
        } else {
          return lossesA - lossesB;
        }
      });
      standings.value = teamStandings;
    } else {
      standings.value = [];
    }
  } catch (err) {
    error.value = err;
    console.error("Error fetching standings:", err);
  } finally {
    loading.value = false;
  }
});

function calculatePercentage(wins, losses) {
  const totalGames = wins + losses;
  if (isNaN(totalGames) || totalGames === 0) return 'N/A';
  return (wins / totalGames).toFixed(3).substring(1);
}
</script>

<template>
  <div class="standings-section">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading standings...</p>
    </div>
    <div v-if="error">Error loading standings: {{ error.message }}</div>
    <transition name="fade">
      <div v-if="!loading && !error && standings.length > 0" class="standings-table-container">
        <ul class="standings-table">
          <li class="table-header" :style="{ backgroundColor: primaryColor }">
            <span class="column-school">School</span>
            <span class="column-conf-record">Conf. Record</span>
            <span class="column-conf-pct">Conf. PCT</span>
            <span class="column-overall-record">Overall Record</span>
            <span class="column-overall-pct">Overall PCT</span>
            <span class="column-streak">Streak</span>
          </li>
          <li v-for="team in standings" 
            :key="team.team_name" 
            class="table-row"
            :class="{ 'highlight-row': props.subscribedTeams.includes(team.team_name) }">
            <span class="column-school">{{ team.team_name }}</span>
            <span class="column-conf-record">{{ team.conf_wins }}-{{ team.conf_losses }}</span>
            <span class="column-conf-pct">{{ calculatePercentage(parseInt(team.conf_wins), parseInt(team.conf_losses)) }}</span>
            <span class="column-overall-record">{{ team.overall_wins }}-{{ team.overall_losses }}</span>
            <span class="column-overall-pct">{{ calculatePercentage(parseInt(team.overall_wins), parseInt(team.overall_losses)) }}</span>
            <span class="column-streak">{{ team.streak }}</span>
          </li>
        </ul>
      </div>
    </transition>
    <p v-if="!loading && !error && standings.length === 0" class="no-data-message">
      No standings data found for {{ props.selectedSport }} in the {{ conferenceFilter.value || 'division' }}.
    </p>
  </div>
</template>

<style scoped>
.standings-section {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  background-color: transparent;
  border-radius: 8px;
  color: white;
}
.standings-table-container {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
  margin-top: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.standings-table {
  list-style: none;
  padding: 0;
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(24, 43, 73, 0.7);
  color: white;
  border-radius: 8px;
  font-size: 0.9em;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
  margin: 0 auto;
  text-align: center;
  overflow: hidden;
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
  background-color: #182B49;
}
.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  background-color: rgba(24, 43, 73, 0.7);
}
.table-row:last-child {
  border-bottom: none;
}
.column-school,
.column-conf-record,
.column-conf-pct,
.column-overall-record,
.column-overall-pct,
.column-streak,
.column-home,
.column-away,
.column-neutral {
  padding: 12px;
  text-align: center;
  box-sizing: border-box;
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.column-school {
  flex-basis: 25%;
  flex-grow: 1;
  text-align: left;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  margin-top: 20px;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
.highlight-row {
  background-color: rgba(255, 205, 0, 0.2); /* UCSD Gold with transparency */
  border-left: 3px solid var(--ucsd-gold, #FFCD00);
  font-weight: 600;
}
.no-data-message {
  color: white;
  padding: 15px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 15px auto;
  max-width: 80%;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

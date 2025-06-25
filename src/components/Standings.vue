<script setup>
import { ref, onMounted, defineProps } from 'vue';
import { themeColors } from '../services/theme';

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

// Helper function to match user's subscribed team with the standings data
// This handles different naming formats between subscribed teams and standings data
function isUserTeam(teamName) {
  // Direct match - if the team name is exactly in the subscribedTeams array
  if (props.subscribedTeams.includes(teamName)) {
    return true;
  }
  
  // Check for alternative formats of the same team name
  for (const subscribedTeam of props.subscribedTeams) {
    // Case 1: "UCSD Baseball" vs "UC San Diego"
    if (subscribedTeam.includes('UCSD') && teamName.includes('UC San Diego')) {
      return true;
    }
    
    // Case 2: Check if the main part of the name matches (e.g., "UCLA" in "UCLA Basketball")
    const subscribedMainName = subscribedTeam.split(' ')[0]; // Get first part of name
    if (teamName.includes(subscribedMainName)) {
      return true;
    }
    
    // Case 3: Handle abbreviations vs full names
    // Check if the team name contains any word from subscribedTeam
    const subscribedWords = subscribedTeam.split(' ');
    for (const word of subscribedWords) {
      if (word.length > 2 && teamName.includes(word)) { // Only check words with 3+ chars
        return true;
      }
    }
  }
  
  return false;
}
</script>

<template>
  <div class="standings-section">
    <div v-if="loading" class="loading-container">
      <div class="modern-loader">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
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
            :class="{ 'highlight-row': isUserTeam(team.team_name) }">
            <span class="column-school">
              {{ team.team_name }}
            </span>
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
  background-color: var(--primary-color, #182B49);
}
.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  background-color: rgba(24, 43, 73, 0.7);
  transition: all 0.3s ease;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row.highlight-row:hover {
  background-color: rgba(var(--secondary-color-rgb, 255, 205, 0), 0.25);
  box-shadow: 
    inset 0 0 16px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.5),
    inset 0 0 8px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.9);
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
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  margin-top: 30px;
  margin-bottom: 30px;
}

.modern-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: white;
  opacity: 0.7;
  animation: pulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
  background-color: var(--secondary-color, #FFCD00);
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
  background-color: white;
}

.dot:nth-child(3) {
  animation-delay: 0s;
  background-color: var(--primary-color, #182B49);
}
.highlight-row {
  background-color: rgba(var(--secondary-color-rgb, 255, 205, 0), 0.15); /* Secondary color with transparency */
  border-left: 6px solid var(--secondary-color, #FFCD00);
  border-radius: 0 4px 4px 0;
  font-weight: 600;
  position: relative;
  box-shadow: 
    inset 0 0 12px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.4),
    inset 0 0 5px rgba(var(--secondary-color-rgb, 255, 205, 0), 0.8);
  transition: all 0.3s ease;
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
@keyframes pulse {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>

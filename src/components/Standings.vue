<script setup>
import { ref, onMounted, defineProps, watch } from 'vue';
import { themeColors } from '../services/theme';
import { getStandings } from '../services/api';
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

const standings = ref([]);
const loading = ref(true);
const error = ref(null);
const conferenceFilter = ref('');

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

async function loadStandings() {
  const context = createDebugContext('Standings', 'loadStandings', { selectedSport: props.selectedSport });
  
  loading.value = true;
  error.value = null;
  
  try {
    debug.info(context, `Loading standings for sport: ${props.selectedSport}`);
    const standingsData = await getStandings(props.selectedSport);
    debug.info(context, `Retrieved ${standingsData.length} standings records`);
    
    if (standingsData.length === 0) {
      standings.value = [];
      conferenceFilter.value = '';
      debug.warn(context, 'No standings data found');
      return;
    }
    
    // Find the conference for the user's subscribed teams
    let userConference = '';
    for (const team of props.subscribedTeams) {
      const teamStanding = standingsData.find(standing => 
        isUserTeam(standing.team_name, team)
      );
      if (teamStanding) {
        userConference = teamStanding.standing_type;
        debug.info(context, `Found user conference: ${userConference} for team: ${team}`);
        break;
      }
    }
    
    // If no user conference found, use the first available conference
    if (!userConference && standingsData.length > 0) {
      userConference = standingsData[0].standing_type;
      debug.info(context, `Using default conference: ${userConference}`);
    }
    
    conferenceFilter.value = userConference;
    
    // Filter by conference and sort by wins
    const conferenceStandings = standingsData
      .filter(team => team.standing_type === userConference)
      .sort((a, b) => {
        const winsA = parseInt(a.conf_wins) || 0;
        const lossesA = parseInt(a.conf_losses) || 0;
        const winsB = parseInt(b.conf_wins) || 0;
        const lossesB = parseInt(b.conf_losses) || 0;
        
        if (winsB !== winsA) {
          return winsB - winsA; // Sort by wins descending
        } else {
          return lossesA - lossesB; // Then by losses ascending
        }
      });
    
    standings.value = conferenceStandings;
    debug.info(context, `Loaded ${conferenceStandings.length} standings for conference: ${userConference}`);
  } catch (err) {
    handleComponentError(context, err);
    standings.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStandings();
});

// Watch for sport changes and reload standings
watch(() => props.selectedSport, () => {
  loadStandings();
});

function calculatePercentage(wins, losses) {
  const totalGames = wins + losses;
  if (isNaN(totalGames) || totalGames === 0) return 'N/A';
  return (wins / totalGames).toFixed(3).substring(1);
}

// Helper function to check if a team is the user's subscribed team
function isUserTeam(standingTeamName, subscribedTeam = null) {
  // If specific subscribedTeam is provided, check against it
  if (subscribedTeam) {
    return isTeamMatch(standingTeamName, subscribedTeam);
  }
  
  // Otherwise check against all subscribed teams
  return props.subscribedTeams.some(team => isTeamMatch(standingTeamName, team));
}

// Helper function to match team names with various formats
function isTeamMatch(standingTeamName, subscribedTeam) {
  // Direct match
  if (standingTeamName === subscribedTeam) {
    return true;
  }
  
  // Case insensitive match
  if (standingTeamName.toLowerCase() === subscribedTeam.toLowerCase()) {
    return true;
  }
  
  // Handle common variations
  const variations = [
    // UCSD variations
    { patterns: ['UCSD', 'UC San Diego'], match: ['UCSD', 'UC San Diego', 'University of California San Diego'] },
    // UCLA variations  
    { patterns: ['UCLA'], match: ['UCLA', 'University of California Los Angeles'] },
    // USC variations
    { patterns: ['USC'], match: ['USC', 'University of Southern California'] }
  ];
  
  for (const variation of variations) {
    const standingMatches = variation.match.some(pattern => 
      standingTeamName.toLowerCase().includes(pattern.toLowerCase())
    );
    const subscribedMatches = variation.patterns.some(pattern =>
      subscribedTeam.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (standingMatches && subscribedMatches) {
      return true;
    }
  }
  
  // Check if main words match (for cases like "UCSD Baseball" vs "UC San Diego")
  const standingWords = standingTeamName.toLowerCase().split(' ');
  const subscribedWords = subscribedTeam.toLowerCase().split(' ');
  
  for (const word of subscribedWords) {
    if (word.length > 2 && standingWords.some(sw => sw.includes(word))) {
      return true;
    }
  }
  
  return false;
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
      No standings data found for {{ props.selectedSport }}{{ conferenceFilter ? ` in the ${conferenceFilter}` : '' }}.
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
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

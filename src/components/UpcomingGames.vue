<script setup>
import { ref, onMounted, defineProps, defineEmits, computed } from 'vue';
import { getUpcomingGames, getCurrentTeam, getRecentGames, getTeamInfo } from '../services/api';
import { themeColors } from '../services/theme';
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

const props = defineProps({
  subscribedTeams: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['team-logo-loaded']);

const upcomingGame = ref(null);
const loading = ref(true);
const error = ref(null);
const showingPastGame = ref(false);

onMounted(async () => {
  await fetchUpcomingGame();
});

const fetchUpcomingGame = async () => {
  loading.value = true;
  error.value = null;
  showingPastGame.value = false;
  
  try {
    const currentTeam = getCurrentTeam();
    console.log('[UpcomingGames] Fetching games for team:', currentTeam);
    
    // Try to get upcoming games first
    let games = await getUpcomingGames(currentTeam);
    console.log('[UpcomingGames] Upcoming games:', games);
    
    let nextGame = null;
    
    if (games && games.length > 0) {
      // Sort by game date and get the next upcoming game
      nextGame = games.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())[0];
    } else {
      // If no upcoming games, get the most recent past game
      const recentGames = await getRecentGames(currentTeam);
      console.log('[UpcomingGames] Recent games (fallback):', recentGames);
      
      if (recentGames && recentGames.length > 0) {
        nextGame = recentGames[0]; // Already sorted by most recent
        showingPastGame.value = true;
      }
    }

    if (nextGame) {
      console.log('[UpcomingGames] Selected game:', nextGame);
      
      // Get team info to get the correct logo
      const teamInfo = await getTeamInfo(nextGame.team_name);
      const teamLogo = teamInfo?.team_logo_url || '/images/default-logo.png';
      
      upcomingGame.value = {
        ...nextGame,
        ucsdLogo: teamLogo, // Always UCSD logo on the left
        opponentLogo: nextGame.opponent_logo_url || '/images/default-logo.png', // Opponent logo on the right
        startTime: nextGame.game_date,
        location: nextGame.game_location || (nextGame.home_away === 'Home' ? 'Home' : `@ ${nextGame.opponent_name}`)
      };
      
      // Emit the team logo for the selected team (our team, not opponent)
      emit('team-logo-loaded', teamLogo);
    } else {
      console.log('[UpcomingGames] No games found');
      upcomingGame.value = null;
    }
  } catch (e) {
    console.error('[UpcomingGames] Error fetching games:', e);
    error.value = e;
  } finally {
    loading.value = false;
  }
};

const formattedTime = computed(() => {
  if (!upcomingGame.value?.startTime) return '';
  const date = new Date(upcomingGame.value.startTime);
  // Format: FRI, MAR 14 AT 6:30 PM PDT
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).toUpperCase().replace(',', ',');
});

const formattedLocation = computed(() => {
  if (!upcomingGame.value?.location) return '';
  return upcomingGame.value.location.toUpperCase();
});

// UCSD is always shown on the left, opponent on the right
const ucsdTeamName = computed(() => {
  if (!upcomingGame.value) return '';
  return upcomingGame.value.team_name; // This should be UCSD Baseball
});

const opponentTeamName = computed(() => {
  if (!upcomingGame.value) return '';
  return upcomingGame.value.opponent_name;
});

const gameResult = computed(() => {
  if (!upcomingGame.value || !showingPastGame.value) return '';
  if (upcomingGame.value.game_outcome) {
    const score = upcomingGame.value.team_score !== undefined && upcomingGame.value.opponent_score !== undefined
      ? ` ${upcomingGame.value.team_score}-${upcomingGame.value.opponent_score}`
      : '';
    return `${upcomingGame.value.game_outcome}${score}`;
  }
  return '';
});
</script>

<template>
  <div class="upcoming-game-container">
    <div v-if="loading" class="loading">
      Loading game information...
    </div>
    
    <div v-else-if="error" class="error">
      Error loading game data
    </div>
    
    <div v-else-if="upcomingGame" class="upcoming-game">
      <div class="teams">
        <div class="team ucsd-team">
          <img :src="upcomingGame.ucsdLogo" :alt="ucsdTeamName" />
        </div>
        
        <div class="vs-section">
          <span class="vs-text">{{ showingPastGame ? 'FINAL' : 'VS.' }}</span>
          <div v-if="showingPastGame && gameResult" class="game-result">
            {{ gameResult }}
          </div>
        </div>
        
        <div class="team opponent-team">
          <img :src="upcomingGame.opponentLogo" :alt="opponentTeamName" />
        </div>
      </div>
      
      <div class="game-info">
        <div class="game-time">
          <strong>TIME:</strong> {{ formattedTime }}
        </div>
        <div class="game-location">
          <strong>LOCATION:</strong> {{ formattedLocation }}
        </div>
        <div v-if="showingPastGame" class="past-indicator">
          MOST RECENT GAME (NEW SCHEDULE PENDING)
        </div>
      </div>
    </div>
    
    <div v-else class="no-games">
      No upcoming games scheduled
    </div>
  </div>
</template>

<style scoped>
.upcoming-game-container {
  padding: 1rem;
  color: white;
  text-align: center;
}

.loading, .error, .no-games {
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  text-align: center;
  padding: 2rem;
}

.upcoming-game {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
  padding: 1rem 0;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.team img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
}

.vs-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
}

.vs-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2em;
  font-weight: bold;
  color: var(--secondary-color, #ffcd00);
  letter-spacing: 2px;
}

.game-result {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4em;
  color: var(--secondary-color, #ffcd00);
  font-weight: bold;
}

.game-info {
  font-family: 'Bebas Neue', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
  margin-top: 1.5rem;
}

.game-time, .game-location {
  font-size: 1.4em;
  font-weight: bold;
  letter-spacing: 1px;
}

.game-time strong, .game-location strong {
  color: white;
  margin-right: 0.5rem;
}

.past-indicator {
  font-size: 1em;
  color: var(--secondary-color, #ffcd00);
  margin-top: 1rem;
  font-weight: bold;
  letter-spacing: 1px;
}

@media (max-width: 480px) {
  .teams {
    flex-direction: column;
    gap: 1rem;
  }
  
  .vs-section {
    transform: rotate(90deg);
    margin: 0.5rem 0;
  }
  
  .team img {
    width: 50px;
    height: 50px;
  }
}
</style>
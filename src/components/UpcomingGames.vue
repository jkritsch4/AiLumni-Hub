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
    console.log('[UpcomingGames] === FETCH UPCOMING GAME START ===');
    console.log('[UpcomingGames] Current team:', currentTeam);
    
    // Try to get upcoming games first
    let games = await getUpcomingGames(currentTeam);
    console.log('[UpcomingGames] API response - upcoming games:', {
      count: games?.length || 0,
      games: games?.map(g => ({
        opponent: g.opponent_name,
        date: g.game_date,
        hasOpponentLogo: !!g.opponent_logo_url,
        opponentLogoUrl: g.opponent_logo_url
      })) || []
    });
    
    let nextGame = null;
    
    if (games && games.length > 0) {
      // Sort by game date and get the next upcoming game
      nextGame = games.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())[0];
      console.log('[UpcomingGames] Found upcoming game:', {
        opponent: nextGame.opponent_name,
        date: nextGame.game_date,
        hasOpponentLogo: !!nextGame.opponent_logo_url
      });
    } else {
      console.log('[UpcomingGames] No upcoming games found, fetching recent games for fallback...');
      // If no upcoming games, get the most recent past game
      const recentGames = await getRecentGames(currentTeam);
      console.log('[UpcomingGames] API response - recent games (fallback):', {
        count: recentGames?.length || 0,
        games: recentGames?.slice(0, 3).map(g => ({
          opponent: g.opponent_name,
          date: g.game_date,
          hasOpponentLogo: !!g.opponent_logo_url,
          opponentLogoUrl: g.opponent_logo_url
        })) || []
      });
      
      if (recentGames && recentGames.length > 0) {
        nextGame = recentGames[0]; // Already sorted by most recent
        showingPastGame.value = true;
        console.log('[UpcomingGames] Using most recent game as fallback:', {
          opponent: nextGame.opponent_name,
          date: nextGame.game_date,
          hasOpponentLogo: !!nextGame.opponent_logo_url
        });
      }
    }

    if (nextGame) {
      console.log('[UpcomingGames] Selected game details:', {
        game_id: nextGame.game_id,
        opponent_name: nextGame.opponent_name,
        opponent_logo_url: nextGame.opponent_logo_url,
        game_date: nextGame.game_date,
        game_location: nextGame.game_location,
        showingPastGame: showingPastGame.value,
        // Full object for debugging
        fullGameObject: JSON.stringify(nextGame, null, 2)
      });
      
      // Get team info to get the correct logo
      const teamInfo = await getTeamInfo(nextGame.team_name);
      const teamLogo = teamInfo?.team_logo_url || '/images/default-logo.png';
      console.log('[UpcomingGames] Team logo URL:', teamLogo);
      
      // Use opponent_logo_url directly from API - no fallbacks
      const opponentLogo = nextGame.opponent_logo_url && nextGame.opponent_logo_url.trim() !== '' 
        ? nextGame.opponent_logo_url 
        : null;
      console.log('[UpcomingGames] Opponent logo availability:', {
        hasOpponentLogo: !!opponentLogo,
        opponentLogoUrl: opponentLogo,
        opponentLogoType: typeof opponentLogo,
        opponentLogoLength: opponentLogo ? opponentLogo.length : 0,
        willShowPendingText: !opponentLogo,
        rawOpponentLogoValue: JSON.stringify(nextGame.opponent_logo_url),
        afterTrimCheck: nextGame.opponent_logo_url ? `"${nextGame.opponent_logo_url.trim()}"` : 'null/undefined'
      });
      
      upcomingGame.value = {
        ...nextGame,
        ucsdLogo: teamLogo, // Always UCSD logo on the left
        opponentLogo: opponentLogo, // Only use API provided logo, null if not available
        startTime: nextGame.game_date,
        location: nextGame.game_location || (nextGame.home_away === 'Home' ? 'Home' : `@ ${nextGame.opponent_name}`)
      };
      
      // Emit the team logo for the selected team (our team, not opponent)
      emit('team-logo-loaded', teamLogo);
    } else {
      console.log('[UpcomingGames] No games found (neither upcoming nor recent)');
      upcomingGame.value = null;
    }
    
    console.log('[UpcomingGames] === FETCH COMPLETE ===');
    console.log('[UpcomingGames] Final state:', {
      hasGame: !!upcomingGame.value,
      showingPastGame: showingPastGame.value,
      opponentName: upcomingGame.value?.opponent_name,
      hasOpponentLogo: !!upcomingGame.value?.opponentLogo
    });
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

// Image loading handlers for debugging
const handleImageError = (event) => {
  console.error('[UpcomingGames] Image failed to load:', event.target.src);
  console.error('[UpcomingGames] Image error details:', {
    src: event.target.src,
    alt: event.target.alt,
    naturalWidth: event.target.naturalWidth,
    naturalHeight: event.target.naturalHeight
  });
};

const handleImageLoad = (event) => {
  console.log('[UpcomingGames] Image loaded successfully:', event.target.src);
};
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
          <img v-if="upcomingGame.opponentLogo && upcomingGame.opponentLogo.trim() !== ''" 
               :src="upcomingGame.opponentLogo" 
               :alt="opponentTeamName" 
               @error="handleImageError"
               @load="handleImageLoad" />
          <div v-else class="pending-logo">
            <span class="pending-text">PENDING</span>
          </div>
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
          ⚠️ SHOWING MOST RECENT GAME - NEW SCHEDULE PENDING
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

.pending-logo {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #666666;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
}

.pending-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.9em;
  color: #888888;
  font-weight: bold;
  letter-spacing: 1px;
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
  font-size: 1.4em;
  font-weight: bold;
  color: white;
  letter-spacing: 2px;
}

.game-result {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  color: white;
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
  font-size: 1.1em;
  font-weight: bold;
  letter-spacing: 1px;
  color: #cccccc;
}

.game-time strong, .game-location strong {
  color: white;
  margin-right: 0.5rem;
}

.past-indicator {
  font-size: 0.9em;
  color: #888888;
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
  
  .team img, .pending-logo {
    width: 50px;
    height: 50px;
  }
  
  .pending-text {
    font-size: 0.7em;
  }
}
</style>
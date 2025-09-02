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

// Helpers
const isFuture = (isoLike) => {
  if (!isoLike) return false;
  const t = new Date(isoLike).getTime();
  return Number.isFinite(t) && t > Date.now();
};
const hasScore = (g) => {
  const a = g?.team_score;
  const b = g?.opponent_score;
  const parse = (n) => {
    if (n === null || n === undefined || n === '') return null;
    const v = typeof n === 'string' ? parseInt(n, 10) : n;
    return Number.isFinite(v) ? v : null;
  };
  return parse(a) !== null && parse(b) !== null;
};

// Normalize "game_outcome" to avoid duplicates and ensure spacing, e.g. "L2-13" -> "L 2-13"
const normalizeOutcome = (outcomeRaw, myScore, oppScore) => {
  const raw = String(outcomeRaw ?? '').trim();
  if (raw) {
    return raw.replace(/^([WLT])\s*(\d)/i, '$1 $2').toUpperCase();
  }
  // Fallback only if outcome is missing but scores are present
  const parse = (n) => {
    if (n === null || n === undefined || n === '') return null;
    const v = typeof n === 'string' ? parseInt(n, 10) : n;
    return Number.isFinite(v) ? v : null;
  };
  const my = parse(myScore);
  const opp = parse(oppScore);
  if (my !== null && opp !== null) {
    const letter = my > opp ? 'W' : my < opp ? 'L' : 'T';
    return `${letter} ${my}-${opp}`.toUpperCase();
  }
  return '';
};

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

    // Only consider future-dated games as "upcoming"
    const futureGames = (games || [])
      .filter(g => isFuture(g.game_date || g.start_time))
      .sort((a, b) => new Date(a.game_date || a.start_time).getTime() - new Date(b.game_date || b.start_time).getTime());

    if (futureGames.length > 0) {
      nextGame = futureGames[0];
      showingPastGame.value = false;
      console.log('[UpcomingGames] Found future upcoming game:', {
        opponent: nextGame.opponent_name,
        date: nextGame.game_date,
        hasOpponentLogo: !!nextGame.opponent_logo_url
      });
    } else {
      console.log('[UpcomingGames] No future games found, fetching recent games for fallback...');
      // If no upcoming games, get the most recent past game WITH a score
      const recentGames = await getRecentGames(currentTeam);
      console.log('[UpcomingGames] API response - recent games (fallback):', {
        count: recentGames?.length || 0,
        games: recentGames?.slice(0, 5).map(g => ({
          opponent: g.opponent_name,
          date: g.game_date,
          parsedDate: new Date(g.game_date).toLocaleDateString(),
          outcome: g.game_outcome,
          hasOpponentLogo: !!g.opponent_logo_url,
          opponentLogoUrl: g.opponent_logo_url,
          team_score: g.team_score,
          opponent_score: g.opponent_score
        })) || []
      });
      
      // Sort most recent first and prefer those with a score
      const sorted = (recentGames || []).slice().sort(
        (a, b) => new Date(b.game_date || b.start_time).getTime() - new Date(a.game_date || a.start_time).getTime()
      );
      const withScores = sorted.filter(hasScore);
      if (withScores.length > 0) {
        nextGame = withScores[0];
      } else if (sorted.length > 0) {
        // Last resort: show most recent even if score missing
        nextGame = sorted[0];
      }
      showingPastGame.value = !!nextGame;
      console.log('[UpcomingGames] Using most recent game as fallback:', nextGame ? {
        opponent: nextGame.opponent_name,
        date: nextGame.game_date,
        hasOpponentLogo: !!nextGame.opponent_logo_url,
        hasScore: hasScore(nextGame)
      } : 'none available');
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
        startTime: nextGame.game_date || nextGame.start_time,
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

const opponentInitials = computed(() => {
  const name = opponentTeamName.value || '';
  if (!name.trim()) return 'TBD';
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
});

// Use only game_outcome when present to avoid duplicate scores
const gameResult = computed(() => {
  if (!upcomingGame.value || !showingPastGame.value) return '';
  return normalizeOutcome(
    upcomingGame.value.game_outcome,
    upcomingGame.value.team_score,
    upcomingGame.value.opponent_score
  );
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
          <!-- In fallback mode, avoid the dashed 'PENDING' box; show initials/text -->
          <div v-else-if="showingPastGame" class="opponent-fallback">
            {{ opponentInitials }}
          </div>
          <!-- Only show the dashed pending box for true upcoming mode -->
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
          Showing most recent game, new schedule pending
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

.opponent-fallback {
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1em;
  letter-spacing: 1px;
  color: #e6e6e6;
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
  color: #cccccc;
  margin-top: 1rem;
  font-weight: bold;
  letter-spacing: 0.5px;
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
  
  .team img, .pending-logo, .opponent-fallback {
    width: 50px;
    height: 50px;
  }
  
  .pending-text {
    font-size: 0.7em;
  }
}
</style>
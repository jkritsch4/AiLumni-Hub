<script setup>
import { ref, onMounted, defineProps, defineEmits, computed } from 'vue';
import { themeColors } from '../services/theme';

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
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';
const showingPastGame = ref(false);

onMounted(async () => {
  await fetchUpcomingGame();
});

const fetchUpcomingGame = async () => {
  loading.value = true;
  error.value = null;
  showingPastGame.value = false;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Filter for games involving the subscribed teams
    const teamName = props.subscribedTeams[0] || 'UCSD Baseball';
    const games = data.filter(game =>
      game.team_name === teamName
    );

    const now = new Date();

    // Find the next upcoming game
    let nextGame = games
      .filter(game => new Date(game.start_time_utc) > now)
      .sort((a, b) => new Date(a.start_time_utc) - new Date(b.start_time_utc))[0];

    // If no upcoming game, find the most recent past game
    if (!nextGame) {
      nextGame = games
        .filter(game => new Date(game.start_time_utc) <= now)
        .sort((a, b) => new Date(b.start_time_utc) - new Date(a.start_time_utc))[0];
      if (nextGame) {
        showingPastGame.value = true;
      }
    }

    if (nextGame) {
      console.log('Home logo:', nextGame.team_logo_url);
      console.log('Away logo:', nextGame.opponent_logo_url);
      upcomingGame.value = {
        ...nextGame,
        homeTeamLogo: nextGame.team_logo_url && nextGame.team_logo_url !== '' ? nextGame.team_logo_url : '/images/default-logo.png',
        awayTeamLogo: nextGame.opponent_logo_url && nextGame.opponent_logo_url !== '' ? nextGame.opponent_logo_url : '/images/default-logo.png',
        startTime: nextGame.start_time_utc,
        location: nextGame.game_location
      };
      emit('team-logo-loaded', upcomingGame.value.homeTeamLogo);
    } else {
      upcomingGame.value = null;
    }
  } catch (e) {
    error.value = e;
  } finally {
    loading.value = false;
  }
};

const formattedTime = computed(() => {
  if (!upcomingGame.value?.startTime) return '';
  const date = new Date(upcomingGame.value.startTime);
  // Format: Friday, March 14th at 6:30PM PST
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
});

const formattedLocation = computed(() => {
  if (!upcomingGame.value?.location) return '';
  // Only show city/state (before comma)
  const parts = upcomingGame.value.location.split(',');
  return parts.length > 1 ? `${parts[0]},${parts[1]}`.replace('/','').trim() : upcomingGame.value.location;
});
</script>

<template>
  <div class="upcoming-game" v-if="upcomingGame">
    <div class="logos">
      <img :src="upcomingGame.homeTeamLogo" alt="Home Team Logo" />
      <span>VS.</span>
      <img :src="upcomingGame.awayTeamLogo" alt="Away Team Logo" />
    </div>
    <div class="game-info">
      <div class="game-time">
        TIME: {{ formattedTime }}
      </div>
      <div class="game-location">
        LOCATION: {{ formattedLocation }}
      </div>
      <div v-if="showingPastGame" class="past-indicator">
        MOST RECENT GAME (NEW SCHEDULE PENDING)
      </div>
    </div>
  </div>
</template>

<style scoped>
.upcoming-game {
  text-align: center;
  margin: 20px 0;
}
.logos {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  gap: 24px;
}
img {
  max-height: 64px;
  max-width: 64px;
  border-radius: 8px;
  background: transparent;
}
span {
  color: white;
  font-size: 2em;
  font-family: 'Bebas Neue', sans-serif;
}
.game-info {
  color: white;
  font-family: 'Bebas Neue', sans-serif;
}
.game-time {
  font-size: 1.2em;
}
.game-location {
  font-size: 1em;
  color: #aaa;
}
.past-indicator {
  color: var(--secondary-color, #FFCD00);
  font-size: 1em;
  margin-top: 10px;
  background-color: transparent;
  display: inline-block;
  padding: 10px 20px;
  border-radius: 0;
  font-weight: bold;
  width: 100%;
  box-sizing: border-box;
  max-width: 425px;
}
</style>
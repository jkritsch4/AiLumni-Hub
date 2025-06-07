<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';

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

onMounted(async () => {
  await fetchUpcomingGame();
});

const fetchUpcomingGame = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Filter for the first upcoming game of a subscribed team
    upcomingGame.value = data.find(game =>
      props.subscribedTeams.includes(game.homeTeam) || props.subscribedTeams.includes(game.awayTeam)
    ) || null;
    if (upcomingGame.value) {
      // Extract team names for logo fetch
      const teamNameForLogo = props.subscribedTeams[0].replace(' ', '-').toLowerCase();
      const logoApiUrl = `https://site.api.espn.com/apis/logos/ncaacommons/teams/${teamNameForLogo}?alt=ucsd`;
      try {
        const logoResponse = await fetch(logoApiUrl);
        if (logoResponse.ok) {
          const logoData = await logoResponse.json();
          if (logoData && logoData.logo) {
            emit('team-logo-loaded', logoData.logo);
          }
        } else {
          console.error('Failed to fetch team logo');
        }
      } catch (logoError) {
        console.error('Error fetching team logo:', logoError);
      }
    }
  } catch (e) {
    error.value = e;
  } finally {
    loading.value = false;
  }
};

const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' };
  return date.toLocaleDateString('en-US', options).toUpperCase();
};

</script>

<template>
  <div v-if="loading">Loading upcoming game...</div>
  <div v-else-if="error">Error loading upcoming game: {{ error.message }}</div>
  <div v-else-if="upcomingGame">
    <div class="game-details-container">
      <div class="teams-logos">
        <img :src="upcomingGame.homeTeamLogo" alt="Home Team Logo" class="team-logo" v-if="upcomingGame.homeTeamLogo" />
        <span v-else class="team-placeholder">{{ upcomingGame.homeTeam }}</span>
        <span class="vs-text">VS</span>
        <img :src="upcomingGame.awayTeamLogo" alt="Away Team Logo" class="opponent-logo" v-if="upcomingGame.awayTeamLogo" />
        <span v-else class="team-placeholder">{{ upcomingGame.awayTeam }}</span>
      </div>
      <div class="game-info">
        <p class="time">TIME: {{ formatDate(upcomingGame.startTime) }}</p>
        <p class="location">LOCATION: {{ upcomingGame.location.toUpperCase() }}</p>
      </div>
    </div>
  </div>
  <div v-else>No upcoming games scheduled for your subscribed teams.</div>
</template>

<style scoped>
/* Styling is mostly in Dashboard.vue */

.upcoming-game-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: #000; /* Ensure black background */
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  width: 100%; /* ✅✅✅ Explicitly set width to 100% */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
}

.section-title {
  color: white;
  font-size: 1.4em;
  margin-bottom: 15px;
  font-family: 'Bebas Neue', sans-serif;
  text-align: center;
  width: 100%; /* ✅✅✅ Ensure title also takes full width */
}


.game-details-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%; /* ✅✅✅ Ensure container takes full width */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
}

.teams-logos {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 10px;
  width: 100%; /* ✅✅✅ Ensure logos container takes full width */
  max-width: none; /* ✅✅✅ Remove max-width to allow full expansion */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
}

.team-logo, .opponent-logo {
  max-height: 50px; /* Reduced maximum height */
  max-width: 50px; /* Reduced maximum width */
  margin: 0;
  border-radius: 8px;
}

.vs-text {
  color: white;
  font-size: 1.8em;
  font-family: 'Bebas Neue', sans-serif;
  margin: 0 20px;
}


.game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%; /* ✅✅✅ Ensure game info container takes full width */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
}

.game-info p {
  margin: 4px 0;
  font-size: 1.1em;
  text-align: center;
  width: 100%; /* ✅✅✅ Ensure game info paragraphs take full width */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
}

.location {
  font-weight: normal;
  color: white;
  font-size: 1.0em;
  width: 100%; /* ✅✅✅ Ensure location text takes full width */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
  font-family: 'Bebas Neue', sans-serif; /* Added font-family */
}

.time {
  color: #aaa;
  font-size: 1.0em;
  width: 100%; /* ✅✅✅ Ensure time text takes full width */
  box-sizing: border-box; /* ✅✅✅ Include padding and border in the width */
  font-family: 'Bebas Neue', sans-serif; /* Added font-family */
}
</style>
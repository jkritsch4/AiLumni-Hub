<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, inject } from 'vue';
import UpcomingGames from './UpcomingGames.vue';
import Standings from './Standings.vue';
import RecentResults from './RecentResults.vue';
import SkeletonLoader from './ui/SkeletonLoader.vue';
import { 
  getCurrentTeam, 
  setCurrentTeam, 
  setCurrentTeamById,
  getTeamInfo, 
  getAllTeams,
  type TeamInfo 
} from '../services/api';
import { themeColors, loadTeamTheme } from '../services/theme';
import { debug, createDebugContext, handleComponentError } from '../utils/debug';

// Props
const props = defineProps({
  homeTeamLogo: {
    type: String,
    default: ''
  }
});

// Try to get route, but handle gracefully if not available
const route = inject('$route', null) as any;

// Function to get URL parameters manually if route is not available
const getUrlParams = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      team_id: urlParams.get('team_id'),
      sport: urlParams.get('sport')
    };
  }
  return { team_id: null, sport: null };
};

// State management
const isLoading = ref(true);
const currentTeamInfo = ref<TeamInfo | null>(null);
const allTeams = ref<TeamInfo[]>([]);
const homeTeamLogo = ref(props.homeTeamLogo || '/images/default-logo.png');
const userPreferences = reactive({
  selectedSport: 'Baseball',
  notificationPreferences: [],
  receiveDailyDashboardLink: false
});

// Use dynamic team colors
const primaryColor = computed(() => themeColors.primary);
const secondaryColor = computed(() => themeColors.secondary);

// Current team name for display and API calls
const currentTeamName = computed(() => currentTeamInfo.value?.team_name || 'UCSD Baseball');
const subscribedTeams = computed(() => [currentTeamName.value]);

// Load team data on mount
onMounted(async () => {
  const context = createDebugContext('Dashboard', 'onMounted');
  
  try {
    debug.info(context, 'Starting Dashboard initialization');
    
    // Read URL parameters for team_id and sport
    const urlParams = route?.query || getUrlParams();
    const teamId = urlParams.team_id as string;
    const sport = urlParams.sport as string;
    
    debug.info(context, 'URL Parameters:', { teamId, sport });
    
    // Load all available teams
    allTeams.value = await getAllTeams();
    debug.info(context, `Loaded ${allTeams.value.length} teams`);
    
    // Set current team based on URL parameters or default
    let currentTeam = getCurrentTeam();
    if (teamId) {
      debug.info(context, `Setting team from URL parameter: ${teamId}`);
      setCurrentTeamById(teamId);
      currentTeam = getCurrentTeam();
    }
    debug.info(context, `Current team: ${currentTeam}`);
    
    // Load team info for the current team
    currentTeamInfo.value = await getTeamInfo(currentTeam);
    debug.info(context, 'Current team info loaded', currentTeamInfo.value);
    
    // Update logo
    if (currentTeamInfo.value?.team_logo_url) {
      homeTeamLogo.value = currentTeamInfo.value.team_logo_url;
      debug.info(context, 'Team logo updated', { logoUrl: homeTeamLogo.value });
    }
    
    // Load team theme colors
    if (currentTeamInfo.value) {
      await loadTeamTheme(currentTeamInfo.value);
      debug.info(context, `Theme loaded for: ${currentTeamInfo.value.team_name}`);
    }
    
    // Update user preferences sport (use URL parameter if provided, otherwise use team's sport)
    if (sport) {
      userPreferences.selectedSport = sport;
      debug.info(context, `Sport set from URL parameter: ${sport}`);
    } else if (currentTeamInfo.value?.sport) {
      userPreferences.selectedSport = currentTeamInfo.value.sport;
      debug.info(context, `Sport updated to: ${userPreferences.selectedSport}`);
    }
    
    isLoading.value = false;
    debug.info(context, 'Dashboard initialization completed successfully');
  } catch (error) {
    handleComponentError(context, error);
    isLoading.value = false;
  }
});

// Watch for theme changes
watch(() => themeColors, (newColors) => {
  debug.info(createDebugContext('Dashboard', 'themeWatch'), 'Theme colors updated', newColors);
}, { deep: true });

// Watch for route changes to handle URL parameter updates
watch(() => route?.query || getUrlParams(), async (newQuery) => {
  const context = createDebugContext('Dashboard', 'routeWatch');
  debug.info(context, 'Route query changed', newQuery);
  
  const teamId = newQuery.team_id as string;
  const sport = newQuery.sport as string;
  
  if (teamId) {
    try {
      isLoading.value = true;
      
      // Set new team
      setCurrentTeamById(teamId);
      const currentTeam = getCurrentTeam();
      
      // Load new team info
      currentTeamInfo.value = await getTeamInfo(currentTeam);
      
      // Update logo
      if (currentTeamInfo.value?.team_logo_url) {
        homeTeamLogo.value = currentTeamInfo.value.team_logo_url;
      }
      
      // Load new theme
      if (currentTeamInfo.value) {
        await loadTeamTheme(currentTeamInfo.value);
      }
      
      // Update sport preference
      if (sport) {
        userPreferences.selectedSport = sport;
      } else if (currentTeamInfo.value?.sport) {
        userPreferences.selectedSport = currentTeamInfo.value.sport;
      }
      
      isLoading.value = false;
      debug.info(context, `Successfully updated to team: ${currentTeam}`);
    } catch (error) {
      handleComponentError(context, error);
      isLoading.value = false;
    }
  }
}, { deep: true });

const emit = defineEmits(['team-logo-loaded', 'team-changed']);

const handleTeamLogoLoaded = (newLogoUrl: string) => {
  console.log('[Dashboard] Team logo loaded:', newLogoUrl);
  if (newLogoUrl) {
    homeTeamLogo.value = newLogoUrl;
    emit('team-logo-loaded', newLogoUrl);
  }
};

// Function to switch teams (can be called from outside or dev tools)
const switchTeam = async (teamName: string) => {
  console.log('[Dashboard] Switching to team:', teamName);
  
  try {
    isLoading.value = true;
    
    // Set the new current team
    setCurrentTeam(teamName);
    
    // Load new team info
    currentTeamInfo.value = await getTeamInfo(teamName);
    
    // Update logo
    if (currentTeamInfo.value?.team_logo_url) {
      homeTeamLogo.value = currentTeamInfo.value.team_logo_url;
    }
    
    // Load new theme
    await loadTeamTheme(teamName);
    
    // Update sport preference
    if (currentTeamInfo.value?.sport) {
      userPreferences.selectedSport = currentTeamInfo.value.sport;
    }
    
    // Emit team change event
    emit('team-changed', teamName);
    
    isLoading.value = false;
    
    console.log('[Dashboard] Successfully switched to:', teamName);
  } catch (error) {
    console.error('[Dashboard] Error switching team:', error);
    isLoading.value = false;
  }
};

// Expose switchTeam function for external use (dev tools, etc.)
defineExpose({
  switchTeam,
  currentTeamName,
  allTeams
});

// Add to window for dev console access
if (typeof window !== 'undefined') {
  (window as any).dashboardSwitchTeam = switchTeam;
  (window as any).getAllTeams = () => allTeams.value;
}
</script>

<template>
  <div class="dashboard-container">
    <!-- Dashboard Content -->
    <div class="dashboard fade-in">
      <div class="content-sections">
        <!-- Logo with sport underneath -->
        <section class="dashboard-section">
          <div class="logo-container">
            <img
              :src="homeTeamLogo"
              alt="Team Logo"
              class="team-logo"
              @error="(event: Event) => { 
                const target = event.target as HTMLImageElement;
                if (target) {
                  target.src = '/images/default-logo.png';
                }
              }"
            />
            <h3 class="team-name">
              {{ userPreferences.selectedSport }}
            </h3>
          </div>
        </section>

        <!-- Upcoming Game Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Upcoming Game</h2>
          <template v-if="isLoading">
            <SkeletonLoader :height="120" />
          </template>
          <template v-else>
            <UpcomingGames 
              :subscribed-teams="subscribedTeams" 
              @team-logo-loaded="handleTeamLogoLoaded" 
            />
          </template>
        </section>

        <!-- Recent Results Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Recent Results</h2>
          <RecentResults 
            :subscribed-teams="subscribedTeams" 
            :primary-color="primaryColor" 
            style="width: 100%;"
          />
        </section>

        <!-- Standings Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Standings</h2>
          <Standings 
            :primary-color="primaryColor" 
            :subscribed-teams="subscribedTeams"
            :selected-sport="userPreferences.selectedSport"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.dashboard {
  height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 5rem;
  box-sizing: border-box;
}

.dashboard::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
  z-index: 0;
}

.dashboard > div {
  position: relative;
  z-index: 1;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dashboard-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #888;
}

.sport-name {
  margin-bottom: 10px;
}

.top-sections {
  flex-direction: column;
  gap: 0;
}

.top-section {
  width: 100%;
  margin-bottom: 0;
  padding-top: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #888;
}

.recent-results-section {
  padding-bottom: 20px;
}

.standings-section {
  overflow-x: auto;
  padding-top: 10px;
  padding-bottom: 15px;
  border-top: none;
  border-bottom: none;
}

.team-logo {
  width: 100px;
  height: auto;
  margin-top: 40px;
  background: transparent;
  filter: drop-shadow(0 0 10px rgba(255, 205, 0, 0.3));
}

.sport-name {
  font-size: 1.8em;
}

.recent-results-section h2,
.standings-section h2,
.upcoming-game-section h2 {
  font-size: 1.1em;
  margin-bottom: 6px;
}

.dashboard-section {
  margin-bottom: 3rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  padding-bottom: 2rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.dashboard-section:last-child {
  border-bottom: none;
  margin-bottom: 4rem;
}

.section-title {
  text-align: center;
  color: white;
  font-size: 2em;
  margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: var(--secondary-color, #ffcd00);
}

@media (max-width: 480px) {
  .sport-name {
    font-size: 1.6em;
  }
  .team-logo {
    max-width: 80px;
    margin-top: 15px;
  }
}

.standings-section .standings-table {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.standings-section .standings-table > li {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #444;
  padding: 0.5em 0;
}

.standings-section .standings-table > li.header-row {
  font-weight: bold;
  border-bottom: 2px solid #666;
  padding-bottom: 0.7em;
}

.standings-section .standings-table > li > span {
  text-align: center;
  padding: 0.3em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standings-section .standings-table > li > span:nth-child(1) {
  text-align: left;
}

.standings-section table,
.standings-section th,
.standings-section td {
  font-family: 'Arial', sans-serif;
  font-size: 1em;
  color: #fff;
}

.user-preferences-section {
  padding: 20px;
  background-color: #282828;
  color: white;
  border-radius: 5px;
}

.loading-placeholder {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  background: transparent;
}

.team-name {
  text-align: center;
  color: white;
  font-size: 1.5em;
  font-family: 'Bebas Neue', sans-serif;
  margin-top: 10px;
}
</style>
<template>
  <div class="step-container">
    <div class="logo-container">
      <div v-if="isLoading" class="loading-placeholder">
        <div class="loading-spinner"></div>
      </div>
      <img
        v-else
        :src="logoUrl"
        alt="University Logo"
        class="team-logo"
        @error="handleLogoError"
      />
    </div>
    <h2>Welcome to your portal</h2>
    <p class="subtitle">UCSD</p>
    
    <div class="button-container">
      <button class="primary-button" @click="handleConfirm">
        Yes, this is my school
      </button>
      <button class="secondary-button" @click="wrongUniversity">
        No, I need to change it
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeamData } from '../../services/teamService'

const props = defineProps<{
  universityData: {
    name: string;
    logo: string;
  }
}>()

const emit = defineEmits(['next-step'])
const isLoading = ref(true)
const logoUrl = ref(props.universityData.logo)

onMounted(async () => {
  try {
    const data = await getTeamData()
    if (data.length > 0) {
      const teamData = data.find(item => item.team_name === 'UCSD Baseball')
      if (teamData?.team_logo_url) {
        logoUrl.value = teamData.team_logo_url
      }
    }
  } catch (error) {
    console.error('Failed to load team data:', error)
  } finally {
    isLoading.value = false
  }
})

const handleConfirm = () => {
  emit('next-step', {
    university: {
      name: 'UCSD Baseball',
      logo: logoUrl.value
    }
  })
}
</script>

<style scoped>
.step-container {
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fff;
}

.step-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.logo-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 2rem;
  z-index: 1;
}

.team-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #FFB81C; /* UCSD Gold */
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #FFCD00;
  position: relative;
  z-index: 1;
}

.subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.button-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.primary-button, .secondary-button {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.primary-button {
  background-color: #FFCD00;
  color: #000;
  border: none;
}

.primary-button:hover {
  background-color: #FFD700;
  transform: translateY(-2px);
}

.secondary-button {
  background-color: transparent;
  color: #fff;
  border: 2px solid #fff;
}

.secondary-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
</style>

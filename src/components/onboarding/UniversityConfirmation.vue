<template>
  <div class="university-confirmation">
    <div v-if="isLoading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading university data...</p>
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-else class="content">
      <img :src="logoUrl" alt="UCSD Logo" class="university-logo" />
      <h2>Welcome to UCSD Baseball</h2>
      <p>Please confirm your university to continue</p>
      <button @click="handleConfirm" class="confirm-button">
        Confirm and Continue
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeamData } from '../../services/teamService'

const isLoading = ref(true)
const error = ref<string | null>(null)
const logoUrl = ref('/images/ucsd-trident.svg')
const emit = defineEmits(['next-step'])

onMounted(async () => {
  try {
    const data = await getTeamData()
    console.log('[UniversityConfirmation] API Response:', data)
    const teamData = data.find(item => item.team_name === 'UCSD Baseball')
    if (teamData?.team_logo_url) {
      logoUrl.value = teamData.team_logo_url
    } else {
      console.warn('[UniversityConfirmation] Using fallback logo')
    }
  } catch (err) {
    console.error('[UniversityConfirmation] Error:', err)
    error.value = 'Failed to load university data'
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
.university-confirmation {
  text-align: center;
  padding: 2rem;
  color: white;
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
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #FFB81C;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #ff6b6b;
  text-align: center;
  padding: 20px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 8px;
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.university-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

h2 {
  font-size: 2.5rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 1px;
}

p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

button.confirm-button {
  display: inline-block;
  background: #FFB81C;
  color: #000;
  border: 0;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  transition: all 0.2s ease;
}

button.confirm-button:hover {
  background: #ffc94d;
  transform: translateY(-2px);
}
</style>

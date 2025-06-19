<template>
  <div class="step-container">
    <h2>Select Your Favorite Sport</h2>
    <p class="subtitle">Choose a sport to follow</p>
    
    <div class="sports-list">
      <div 
        v-for="sport in sports" 
        :key="sport"
        :class="['sport-card', { selected: selectedSport === sport }]"
        @click="selectSport(sport)"
      >
        {{ sport }}
      </div>
    </div>

    <div class="navigation-buttons">
      <button class="secondary-button" @click="$emit('previous-step')">Back</button>
      <button 
        class="primary-button" 
        @click="continueToNextStep"
        :disabled="!selectedSport"
      >
        Continue
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SportSelection',
  data() {
    return {
      selectedSport: '',
      sports: [
        'Baseball',
        "Basketball (Men's)",
        "Basketball (Women's)",
        "Soccer (Men's)",
        "Soccer (Women's)",
        'Softball'
      ]
    }
  },
  methods: {
    selectSport(sport) {
      this.selectedSport = sport
    },
    continueToNextStep() {
      if (this.selectedSport) {
        this.$emit('next-step', {
          step: 'sport',
          data: { selectedSport: this.selectedSport }
        })
      }
    }
  }
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
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1;
}

.step-container > * {
  position: relative;
  z-index: 2;
}

h2 {
  color: white;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
}

.subtitle {
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  opacity: 0.9;
}

.sports-list {
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sport-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  color: white;
  font-size: 1.1rem;
}

.sport-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.sport-card.selected {
  border-color: #FFB81C;
  background: rgba(255, 184, 28, 0.1);
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.secondary-button,
.primary-button {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  min-width: 150px;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.primary-button {
  background: #FFB81C;
  color: #000;
  font-weight: 600;
}

.primary-button:hover {
  background: #ffc64c;
  transform: translateY(-2px);
}

.primary-button:disabled {
  background: #9b9b9b;
  cursor: not-allowed;
  transform: none;
}
</style>

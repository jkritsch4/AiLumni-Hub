<template>
  <div class="dashboard">
    <div class="dashboard-title">
      <img
        v-if="homeTeamLogo"
        :src="homeTeamLogo"
        alt="Team Logo"
        class="team-logo"
        style="width: 100px; height: auto; margin-top: 40px;"
        @error="event => event.target.src = '/images/default-logo.png'"
      />
      <h2 class="sport-name">BASEBALL</h2>
    </div>

    <div class="content-sections">
      <section class="fundraising-section">
        <h2 class="section-title">FUNDRAISING</h2>
        <div class="fundraising-card">
          <div class="progress-placeholder">
            <!-- Placeholder for future fundraising progress chart -->
            <div class="chart-placeholder">
              <p>Fundraising Progress Chart Coming Soon</p>
              <div class="mock-progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
          </div>
          <div class="fundraising-info">
            <h3>Support Our Team!</h3>
            <p>This section will be dedicated to fundraising information and links.</p>
          </div>
        </div>
      </section>

      <section class="preferences-section">
        <h2 class="section-title">User Preferences</h2>
        <div class="preferences-card">
          <p>Here you can manage your personal preferences for the app.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
defineProps({
  homeTeamLogo: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

.dashboard {
  font-family: 'Bebas Neue', sans-serif;
  padding: 10px;
  overflow-y: auto;
  max-height: 100vh;
  color: white;
}

.dashboard-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #888;
}

.team-logo {
  max-width: 100px;
  margin-top: 20px;
}

.sport-name {
  font-size: 2.0em;
  font-family: 'Bebas Neue', sans-serif;
  margin: 10px 0;
  color: white;
  text-transform: uppercase;
}

.title {
  font-size: 2.0em;
  margin: 10px 0;
}

.content-sections {
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  color: white;
  font-size: 1.3em;
  margin-bottom: 8px;
  font-family: 'Bebas Neue', sans-serif;
}

.fundraising-card, 
.preferences-card {
  background-color: #282828;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.progress-placeholder {
  background-color: #333;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  margin-bottom: 15px;
}

.chart-placeholder {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.mock-progress-bar {
  width: 80%;
  height: 24px;
  background-color: #444;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 15px;
}

.progress-fill {
  width: 65%;
  height: 100%;
  background-color: #ffb300;
  animation: pulse 2s infinite;
}

.fundraising-info {
  text-align: center;
}

.fundraising-info h3 {
  font-size: 1.4em;
  margin-bottom: 10px;
  color: #ffb300;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.6em;
  }
  .team-logo {
    max-width: 80px;
    margin-top: 15px;
  }
}
</style>
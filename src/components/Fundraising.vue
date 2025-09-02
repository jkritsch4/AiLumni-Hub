<template>
  <div class="dashboard">
    <div class="dashboard-title">
      <img
        :src="homeTeamLogo || '/images/ucsd-trident.svg'"
        alt="Team Logo"
        class="team-logo"
        style="width: 100px; height: auto; margin-top: 40px;"
        @error="(event: Event) => { 
          const target = event.target as HTMLImageElement;
          if (target) {
            target.src = '/images/default-logo.png';
          }
        }"
      />
      <h2 class="sport-name">{{ selectedSport }}</h2>
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
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  homeTeamLogo: {
    type: String,
    default: ''
  },
  selectedSport: {
    type: String,
    default: 'BASEBALL'
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

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

.dashboard > div, .content-sections {
  position: relative;
  z-index: 1;
}

.dashboard-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
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
  max-width: 900px;
  margin: 0 auto;
}

.fundraising-section {
  margin-bottom: 3rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  padding-bottom: 2rem;
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
  width: 80px;
  height: 3px;
  background-color: var(--secondary-color, #ffcd00);
}

/* OUTER CARD: darker transparent hue with secondary tint layered over a primary darkening */
.fundraising-card {
  background:
    /* primary darkening layer */
    linear-gradient(
      180deg,
      rgba(var(--primary-color-rgb, 24,43,73), 0.28) 0%,
      rgba(var(--primary-color-rgb, 24,43,73), 0.22) 100%
    ),
    /* secondary-tinted layer (modern browsers) */
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--secondary-color, #ffcd00) 16%, transparent) 0%,
      color-mix(in srgb, var(--secondary-color, #ffcd00) 12%, transparent) 100%
    );
  /* Fallback if color-mix isn't supported */
  background:
    linear-gradient(
      180deg,
      rgba(var(--primary-color-rgb, 24,43,73), 0.28) 0%,
      rgba(var(--primary-color-rgb, 24,43,73), 0.22) 100%
    ),
    linear-gradient(
      180deg,
      rgba(var(--secondary-color-rgb, 255,205,0), 0.16) 0%,
      rgba(var(--secondary-color-rgb, 255,205,0), 0.12) 100%
    );

  border: 1px solid rgba(var(--secondary-color-rgb, 255,205,0), 0.30);
  border-radius: 14px;
  box-shadow: none;

  padding: 20px;
  margin-bottom: 20px;
  color: white;
  overflow: hidden;
  backdrop-filter: saturate(110%);
}

/* INNER BOX: darker primary-tinted overlay */
.progress-placeholder {
  background: linear-gradient(
    180deg,
    rgba(var(--primary-color-rgb, 24,43,73), 0.55) 0%,
    rgba(var(--primary-color-rgb, 24,43,73), 0.40) 100%
  );
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  padding: 20px;
  text-align: center;
  margin-bottom: 15px;
}

/* Inner content stays readable */
.chart-placeholder {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Progress bar: track is a faint primary tint; fill uses the secondary color */
.mock-progress-bar {
  width: 80%;
  height: 24px;
  background-color: rgba(var(--primary-color-rgb, 24,43,73), 0.14);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 15px;
}

.progress-fill {
  width: 65%;
  height: 100%;
  background-color: var(--secondary-color, #ffcd00);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.fundraising-info {
  text-align: center;
}

.fundraising-info h3 {
  font-size: 1.4em;
  margin-bottom: 10px;
  color: color-mix(in srgb, var(--secondary-color, #ffcd00) 85%, white);
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
<template>
  <div class="user-preferences-container">
    <img v-if="homeTeamLogo" :src="homeTeamLogo" alt="Logo" class="main-logo" />
    <section class="fundraising-section">
      <h2>Support Our Team!</h2>
      <p>This section will be dedicated to fundraising information and links.</p>
      <!-- Future: Fundraising chart goes here -->
    </section>
    <section class="user-settings-section">
      <h2>User Preferences</h2>
      <p>This is where user preferences and fundraising information will go.</p>
    </section>
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
.user-preferences-container {
  padding: 20px;
  background-color: #282828;
  color: white;
  border-radius: 10px;
  width: 90vw;
  max-width: 420px;
  margin: 0 auto;
  margin-bottom: 40px;
  box-shadow: 0 4px 24px #0006;
}

.main-logo {
  width: 96px;
  margin: 0 auto 16px auto;
  display: block;
}

.fundraising-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #444;
}

.fundraising-section h2,
.user-settings-section h2 {
  font-size: 1.3em;
  margin-bottom: 10px;
}

.fundraising-section p,
.user-settings-section p {
  line-height: 1.6;
}
</style>
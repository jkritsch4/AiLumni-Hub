<template>
  <div class="step-container">
    <h2>Account Information</h2>
    <p class="subtitle">Tell us a bit about you</p>

    <form class="form" @submit.prevent="saveAndFinish">
      <label class="row">
        <span class="label">First Name</span>
        <input
          type="text"
          v-model.trim="local.firstName"
          class="input"
          placeholder="First Name"
          autocomplete="given-name"
          required
        />
      </label>

      <label class="row">
        <span class="label">Last Name</span>
        <input
          type="text"
          v-model.trim="local.lastName"
          class="input"
          placeholder="Last Name"
          autocomplete="family-name"
          required
        />
      </label>

      <label class="row">
        <span class="label">Email (username)</span>
        <input
          type="email"
          v-model.trim="local.email"
          class="input"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
      </label>

      <label class="row">
        <span class="label">Password</span>
        <input
          type="password"
          v-model="local.password"
          class="input"
          placeholder="Enter a password"
          autocomplete="new-password"
        />
        <div class="hint">
          <a href="#" @click.prevent="resetPassword">Reset password</a>
        </div>
      </label>

      <label class="row">
        <span class="label">Affiliation</span>
        <select v-model="local.affiliation" class="input">
          <option value="" disabled>Select affiliation</option>
          <option value="Student">Student</option>
          <option value="Alumni">Alumni</option>
          <option value="Parent">Parent</option>
          <option value="Fan">Fan</option>
          <option value="Staff">Staff</option>
        </select>
      </label>

      <div class="navigation-buttons">
        <button class="secondary-button" type="button" @click="goBack">Back</button>
        <button class="primary-button" type="submit">Save Account Information</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

type Account = {
  firstName: string
  lastName: string
  email: string
  password?: string
  affiliation: string
}

const props = defineProps<{
  selectedData?: { account?: Partial<Account> }
}>()

const emit = defineEmits<{
  (e: 'previous-step'): void
  (e: 'next-step', payload?: { account: Account }): void
  (e: 'update-data', payload: Partial<{ account: Account }>): void
}>()

const local = reactive<Account>({
  firstName: props.selectedData?.account?.firstName || '',
  lastName: props.selectedData?.account?.lastName || '',
  email: props.selectedData?.account?.email || '',
  password: '',
  affiliation: props.selectedData?.account?.affiliation || 'Alumni'
})

let error = ''

function goBack() {
  emit('previous-step')
}

function resetPassword() {
  // Placeholder for future integration
  alert('Password reset flow coming soon.')
}

function saveAndFinish() {
  error = ''
  if (!local.firstName || !local.lastName || !local.email) {
    error = 'Please complete First Name, Last Name, and Email.'
    return
  }
  // Emit the data to the wizard wrapper. Password will be sanitized before persistence.
  emit('update-data', { account: { ...local } })
  emit('next-step', { account: { ...local } })
}
</script>

<style scoped>
.step-container {
  min-height: 100vh;
  padding: 2rem 1rem;
  text-align: center;
}
h2 {
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 0.25rem;
}
.subtitle { color: rgba(255,255,255,0.92); margin: 0 0 1rem; }

.form {
  width: min(560px, 92vw);
  margin: 0 auto;
  text-align: left;
}

.row {
  display: grid;
  gap: 6px;
  margin: 10px 0 14px;
  color: #fff;
}
.label { font-weight: 700; }

.input {
  width: 100%;
  color: #fff;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.22);
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.input::placeholder { color: rgba(255,255,255,0.6); }
.input:focus {
  border-color: rgba(255,255,255,0.45);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary-color, #FFCD00) 30%, transparent);
}

.hint a {
  color: var(--secondary-color, #FFCD00);
  text-decoration: underline;
  font-size: 0.95em;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1rem;
}
.primary-button {
  background: var(--secondary-color, #FFCD00);
  color: #122;
  border: none;
  padding: 10px 16px;
  border-radius: 9999px;
  font-weight: 700;
}
.secondary-button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.35);
  padding: 10px 16px;
  border-radius: 9999px;
}

.error { color: #ff9aa2; margin-top: .75rem; }
</style>
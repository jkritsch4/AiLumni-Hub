<template>
  <OnboardingLayout :name="uni.name" :logo="uni.logo">
    <RouterView />
  </OnboardingLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getUniversityBySlug, applyUniversityTheme } from '../services/universityTheme';
import OnboardingLayout from '../components/onboarding/OnboardingLayout.vue';

const route = useRoute();
const uniSlug = (route.params.uniSlug as string) || localStorage.getItem('uniSlug') || '';
const uni = getUniversityBySlug(uniSlug);

onMounted(() => {
  applyUniversityTheme(uni);
  localStorage.setItem('uniSlug', uni.slug);
});
</script>
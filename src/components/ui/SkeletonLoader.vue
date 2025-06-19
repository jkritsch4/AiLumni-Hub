<template>
  <div class="skeleton-wrapper" :style="{ height: `${height}px` }">
    <div class="skeleton-animation"></div>
  </div>
</template>

<script setup>
defineProps({
  height: {
    type: Number,
    default: 80
  }
});
</script>

<style scoped>
.skeleton-wrapper {
  background: rgba(51, 51, 51, 0.7);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin: 10px 0;
}

.skeleton-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
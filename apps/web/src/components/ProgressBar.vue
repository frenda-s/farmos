<template>
  <div>
    <p class="label-news mb-1">{{ label }}</p>
    <div class="progress-ink rounded-sm">
      <div :style="{ width: Math.min(100, Math.max(0, value)) + '%' }"></div>
    </div>
    <p v-if="caption" class="font-sans text-xs text-[#7a7264] mt-1">{{ caption }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; caption?: string }>();
</script>

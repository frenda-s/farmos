<template>
  <div v-if="loading" class="space-y-3">
    <div v-for="i in lines" :key="i" class="skeleton h-16 w-full rounded-sm"></div>
  </div>
  <div v-else-if="error" class="paper-card p-6 text-center">
    <p class="font-sans text-sm text-[#a83c2a] font-semibold">{{ error }}</p>
    <button class="btn-outline mt-3 px-4 py-2 text-sm rounded-sm" @click="$emit('retry')">Thử lại</button>
  </div>
  <div v-else-if="empty" class="paper-card p-8 text-center">
    <component :is="icon" v-if="icon" class="mx-auto h-8 w-8 text-[#7a7264]" />
    <p class="headline text-lg mt-2">{{ emptyTitle }}</p>
    <p class="font-sans text-sm text-[#7a7264] mt-1">{{ emptyHint }}</p>
    <slot name="action" />
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  icon?: any;
  lines?: number;
}>();

defineEmits<{ (e: "retry"): void }>();
</script>

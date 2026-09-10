<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <p class="kicker text-[#2f5d33]">Ruộng đất</p>
        <h1 class="headline text-3xl mt-1">Nông trại của tôi</h1>
      </div>
      <RouterLink to="/app/setup" class="btn-ink px-4 py-2 text-sm rounded-sm font-sans">+ Thêm trại</RouterLink>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!loading && !error && farms.length === 0"
      empty-title="Bạn chưa có nông trại nào." empty-hint="Tạo trại đầu tiên để bắt đầu." :icon="Tractor" @retry="load">
      <template #action>
        <RouterLink to="/app/setup" class="btn-ink inline-block px-4 py-2 text-xs rounded-sm mt-3 font-sans">Tạo trại đầu tiên</RouterLink>
      </template>
      <div class="grid sm:grid-cols-2 gap-4 mt-4">
        <div v-for="f in farms" :key="f.id" class="paper-card p-4">
          <RouterLink :to="`/app/farms/${f.id}`" class="headline text-2xl hover:text-[#2f5d33]">{{ f.name }}</RouterLink>
          <p class="font-sans text-xs text-[#7a7264]">{{ f.address ?? f.province ?? "" }} · {{ f.area }} {{ f.area_unit }}</p>
          <MapView v-if="f.latitude" :markers="[{ lat: f.latitude, lon: f.longitude, label: f.name }]"
            :center="[f.latitude, f.longitude]" :zoom="12" height="140px" class="mt-2" />
          <div class="flex gap-2 mt-3 font-sans text-xs">
            <RouterLink :to="`/app/farms/${f.id}`" class="btn-outline px-3 py-1.5 rounded-sm">Xem trại</RouterLink>
            <button class="px-3 py-1.5 border border-[#a83c2a] text-[#a83c2a] rounded-sm" @click="remove(f)">Xóa</button>
          </div>
        </div>
      </div>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { Tractor } from "lucide-vue-next";
import MapView from "@/components/MapView.vue";
import StateBlock from "@/components/StateBlock.vue";
import { api } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const farmStore = useFarmStore();
const farms = computed(() => farmStore.farms);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function remove(f: any) {
  if (!confirm(`Xóa nông trại "${f.name}"? Mọi cây, việc và chi tiêu trong trại cũng mất.`)) return;
  await api(`/api/farms/${f.id}`, { method: "DELETE" });
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <p class="kicker text-[#2f5d33]">Bảng tin · {{ greeting }}</p>
    <h1 class="headline text-3xl sm:text-4xl mt-1">Chào {{ auth.user?.full_name }}</h1>

    <StateBlock :loading="loading" :error="error" @retry="load">
      <!-- stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 font-sans">
        <div class="paper-card p-4"><p class="label-news">Nông trại</p><p class="headline text-3xl">{{ stats.total_farms }}</p></div>
        <div class="paper-card p-4"><p class="label-news">Cây trồng</p><p class="headline text-3xl">{{ stats.total_crops }}</p></div>
        <div class="paper-card p-4"><p class="label-news">Việc chưa xong</p><p class="headline text-3xl">{{ stats.active_tasks }}</p></div>
        <div class="paper-card p-4"><p class="label-news">Chi tháng này</p><p class="headline text-2xl">{{ formatVND(stats.monthly_cost) }}</p></div>
      </div>

      <!-- alerts -->
      <div v-if="alerts.length" class="mt-5 border-l-4 border-[#a83c2a] bg-[#fffdf8] p-4 font-sans text-sm">
        <p class="font-bold">Cần chú ý</p>
        <ul class="list-disc ml-5 mt-1"><li v-for="(a, i) in alerts" :key="i">{{ a.message }}</li></ul>
      </div>

      <!-- farm summary -->
      <div v-if="farm" class="paper-card p-5 mt-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="kicker">Trang nhất · {{ farm.province ?? "—" }}</p>
            <RouterLink :to="`/app/farms/${farm.id}`" class="headline text-2xl hover:text-[#2f5d33]">{{ farm.name }}</RouterLink>
            <p class="font-sans text-sm text-[#7a7264]">{{ farm.address ?? "" }} · {{ farm.area }} {{ farm.area_unit }}</p>
          </div>
          <RouterLink :to="`/app/farms/${farm.id}`" class="btn-outline px-3 py-1.5 text-xs rounded-sm font-sans shrink-0">Xem trại</RouterLink>
        </div>
        <MapView v-if="farm.latitude" :markers="[{ lat: farm.latitude, lon: farm.longitude, label: farm.name }]"
          :center="[farm.latitude, farm.longitude]" height="180px" class="mt-3" />
      </div>

      <!-- crops -->
      <h2 class="headline text-2xl mt-8 border-t-2 border-[#1a1714] pt-4">Cây đang trồng</h2>
      <div v-if="!crops.length" class="paper-card p-6 text-center mt-3">
        <p class="font-sans text-sm text-[#7a7264]">Chưa có cây nào. Thêm cây để theo dõi sinh trưởng.</p>
        <RouterLink :to="`/app/farms/${farm?.id}`" class="btn-ink inline-block px-4 py-2 text-xs rounded-sm mt-2 font-sans">Thêm cây</RouterLink>
      </div>
      <div class="grid sm:grid-cols-2 gap-3 mt-3">
        <RouterLink v-for="c in crops" :key="c.id" :to="`/app/crop/${c.id}`" class="paper-card card-hover p-4">
          <div class="flex justify-between items-baseline">
            <p class="headline text-xl">{{ c.crop_name }}</p>
            <p class="font-sans text-xs text-[#7a7264]">Thu sau ~{{ c.days_to_harvest }} ngày</p>
          </div>
          <p class="font-sans text-xs text-[#7a7264]">{{ c.variety ?? "" }} · {{ formatDateVN(c.planting_date) }}</p>
          <ProgressBar :label="`Dự kiến ${c.progress}% · ${c.expected_stage}`" :value="c.progress" class="mt-2" />
        </RouterLink>
      </div>

      <!-- today tasks -->
      <h2 class="headline text-2xl mt-8 border-t-2 border-[#1a1714] pt-4">Việc hôm nay</h2>
      <div v-if="!todayTasks.length" class="paper-card p-6 text-center mt-3">
        <p class="headline text-lg">Hết việc rồi, nghỉ tay uống nước chè.</p>
      </div>
      <ul class="mt-3 space-y-2">
        <li v-for="t in todayTasks" :key="t.id" class="paper-card p-3 flex items-center gap-3 font-sans text-sm">
          <button @click="complete(t)" class="w-5 h-5 border-2 border-[#2f5d33] rounded-sm shrink-0 hover:bg-[#2f5d33]" aria-label="Hoàn thành"></button>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ t.title }}</p>
            <p class="text-xs text-[#7a7264]">{{ t.crop_name ?? "" }} · {{ t.farm_name }}</p>
          </div>
          <StatusBadge kind="priority" :value="t.priority" />
        </li>
      </ul>

      <!-- cost + stores teaser -->
      <div class="grid sm:grid-cols-2 gap-3 mt-8">
        <RouterLink to="/app/expenses" class="paper-card card-hover p-4">
          <p class="kicker">Sổ chi</p>
          <p class="headline text-xl mt-1">{{ formatVND(stats.monthly_cost) }} tháng này</p>
          <p class="font-sans text-xs text-[#2f5d33] mt-1 underline">Xem chi tiêu →</p>
        </RouterLink>
        <RouterLink to="/app/stores" class="paper-card card-hover p-4">
          <p class="kicker">Chợ vật tư</p>
          <p class="headline text-xl mt-1">Cửa hàng quanh trại</p>
          <p class="font-sans text-xs text-[#2f5d33] mt-1 underline">Mở bản đồ →</p>
        </RouterLink>
      </div>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import MapView from "@/components/MapView.vue";
import StateBlock from "@/components/StateBlock.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { api, formatVND, formatDateVN } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useFarmStore } from "@/stores/farm";

const auth = useAuthStore();
const farmStore = useFarmStore();

const loading = ref(true);
const error = ref<string | null>(null);
const stats = ref({ total_farms: 0, total_crops: 0, active_tasks: 0, monthly_cost: 0 });
const crops = ref<any[]>([]);
const todayTasks = ref<any[]>([]);
const upcoming = ref<any[]>([]);
const alerts = ref<any[]>([]);

const farm = computed(() => farmStore.farms.find((f: any) => f.id === farmStore.currentFarmId) ?? farmStore.farms[0]);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "buổi sáng";
  if (h < 14) return "buổi trưa";
  if (h < 18) return "buổi chiều";
  return "buổi tối";
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
    const data = await api<any>("/api/dashboard");
    stats.value = data.stats;
    crops.value = data.crops.slice(0, 6);
    todayTasks.value = data.today_tasks;
    upcoming.value = data.upcoming_tasks;
    if (farm.value) {
      const a = await api<any>(`/api/farms/${farm.value.id}/alerts`);
      alerts.value = a.alerts;
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function complete(t: any) {
  await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
  todayTasks.value = todayTasks.value.filter((x) => x.id !== t.id);
}

onMounted(load);
</script>

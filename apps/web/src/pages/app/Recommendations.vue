<template>
  <div>
    <p class="kicker text-[#2f5d33]">Tư vấn đất</p>
    <h1 class="headline text-3xl mt-1">Cây nào hợp đất bạn?</h1>

    <div class="paper-card p-4 mt-4 font-sans text-sm">
      <label class="label-news">Xem gợi ý cho trại</label>
      <select v-model="farmId" class="input-news mt-1 max-w-sm" @change="load">
        <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
      </select>
      <p v-if="env" class="text-xs text-[#7a7264] mt-2">
        Điều kiện dùng để chấm: nhiệt độ TB {{ env.avg_temp ?? "?" }}°C · mưa {{ env.rainfall ?? "?" }} mm/năm ·
        độ cao {{ env.elevation ?? "?" }} m · đất {{ soilLabel }} · nước {{ waterLabel }}
      </p>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!loading && !error && recs.length === 0"
      empty-title="Chưa có gợi ý." empty-hint="Tạo nông trại có vị trí để nhận gợi ý." @retry="load">
      <div class="space-y-3 mt-4">
        <div v-for="(r, i) in recs" :key="r.crop.id" class="paper-card p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-sans text-xs text-[#7a7264]">Hạng {{ i + 1 }} · {{ r.crop.category }}</p>
              <RouterLink :to="`/crops/${r.crop.slug}`" class="headline text-2xl hover:text-[#2f5d33]">{{ r.crop.name }}</RouterLink>
              <p class="font-sans text-xs italic text-[#7a7264]">{{ r.crop.scientific_name }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="headline text-3xl" :class="r.score >= 80 ? 'text-[#2f5d33]' : r.score >= 60 ? 'text-[#b07d1e]' : 'text-[#7a7264]'">{{ r.score }}%</p>
              <p class="font-sans text-[11px] text-[#7a7264]">điểm hợp đất FarmDesk</p>
            </div>
          </div>
          <ul class="font-sans text-xs mt-2 flex flex-wrap gap-1.5">
            <li v-for="reason in r.reasons" :key="reason" class="border border-[#d9d2c2] px-2 py-0.5 rounded-sm">{{ reason }}</li>
          </ul>
          <div class="flex gap-2 mt-3 font-sans text-xs">
            <RouterLink :to="`/crops/${r.crop.slug}`" class="btn-outline px-3 py-1.5 rounded-sm">Xem chi tiết</RouterLink>
            <button class="btn-ink px-3 py-1.5 rounded-sm" @click="plant(r.crop)">Trồng cây này</button>
          </div>
        </div>
      </div>
      <p class="dateline mt-4">Điểm tương thích là ước lượng tham khảo từ dữ liệu tĩnh, không phải kết luận khoa học chính xác.</p>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import StateBlock from "@/components/StateBlock.vue";
import { api, SOIL_LABELS, WATER_LABELS } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const farmStore = useFarmStore();
const router = useRouter();
const farmId = ref(farmStore.currentFarmId ?? "");
const recs = ref<any[]>([]);
const env = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const soilLabel = computed(() => SOIL_LABELS[env.value?.soil_type] ?? env.value?.soil_type ?? "?");
const waterLabel = computed(() => WATER_LABELS[env.value?.water_availability] ?? "?");

async function load() {
  if (!farmId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
    farmStore.select(farmId.value);
    const data = await api<any>(`/api/farms/${farmId.value}/recommendations`);
    recs.value = data.recommendations;
    env.value = data.env;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function plant(crop: any) {
  router.push(`/app/farms/${farmId.value}?plant=${crop.id}`);
}

onMounted(async () => {
  await farmStore.load();
  farmId.value = farmStore.currentFarmId ?? farmStore.farms[0]?.id ?? "";
  await load();
});
</script>

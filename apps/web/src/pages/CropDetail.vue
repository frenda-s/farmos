<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <StateBlock :loading="loading" :error="error" @retry="load">
      <template v-if="crop">
        <RouterLink to="/crops" class="font-sans text-sm text-[#2f5d33] underline">← Thư viện cây trồng</RouterLink>
        <p class="kicker text-[#2f5d33] mt-4">{{ crop.category }}</p>
        <h1 class="headline text-4xl sm:text-5xl mt-1">{{ crop.name }}</h1>
        <p class="font-sans italic text-[#7a7264]">{{ crop.scientific_name }}</p>
        <p class="text-lg text-[#4a443c] mt-3 leading-relaxed">{{ crop.description }}</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 font-sans text-sm">
          <div class="paper-card p-3"><p class="label-news">Nhiệt độ</p><p class="font-bold">{{ crop.suitable_temperature_min }}–{{ crop.suitable_temperature_max }}°C</p></div>
          <div class="paper-card p-3"><p class="label-news">Lượng mưa</p><p class="font-bold">{{ crop.rainfall_min }}–{{ crop.rainfall_max }} mm</p></div>
          <div class="paper-card p-3"><p class="label-news">Độ cao</p><p class="font-bold">{{ crop.elevation_min }}–{{ crop.elevation_max }} m</p></div>
          <div class="paper-card p-3"><p class="label-news">Ngày sinh trưởng</p><p class="font-bold">{{ crop.growth_duration }} ngày</p></div>
        </div>

        <h2 class="headline text-2xl mt-8 border-t-2 border-[#1a1714] pt-4">Giai đoạn sinh trưởng</h2>
        <ol class="mt-3 space-y-3">
          <li v-for="(s, i) in stages" :key="s.id" class="paper-card p-4">
            <p class="font-sans font-bold">Giai đoạn {{ i + 1 }} · {{ s.name }} <span class="font-normal text-[#7a7264]">(~{{ s.duration_days }} ngày)</span></p>
            <ul class="text-sm text-[#4a443c] mt-1 list-disc ml-5">
              <li v-for="a in parseArr(s.recommended_activities)" :key="a">{{ a }}</li>
            </ul>
            <p v-if="s.irrigation_guidance" class="font-sans text-xs text-[#2a5d7d] mt-1">Tưới: {{ s.irrigation_guidance }}</p>
          </li>
        </ol>

        <h2 class="headline text-2xl mt-8 border-t-2 border-[#1a1714] pt-4">Chăm sóc theo giai đoạn</h2>
        <div class="mt-3 space-y-3">
          <div v-for="g in care" :key="g.id" class="paper-card p-4 font-sans text-sm">
            <p class="font-bold">{{ g.stage_name }}</p>
            <p class="mt-1"><span class="font-semibold">Phân bón:</span> {{ parseArr(g.fertilizer_types).join(", ") }} — {{ g.guidance }}</p>
            <p class="mt-1 text-[#4a443c]">Tưới {{ g.irrigation_frequency }} · {{ g.pest_monitoring }}</p>
          </div>
        </div>

        <div v-if="varieties.length" class="mt-8">
          <h2 class="headline text-2xl border-t-2 border-[#1a1714] pt-4">Giống phổ biến</h2>
          <p class="font-sans text-sm mt-2">{{ varieties.map((v: any) => v.name).join(" · ") }}</p>
        </div>
      </template>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "@/lib/utils";
import StateBlock from "@/components/StateBlock.vue";

const route = useRoute();
const crop = ref<any>(null);
const stages = ref<any[]>([]);
const care = ref<any[]>([]);
const varieties = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function parseArr(s: string): string[] {
  try { return JSON.parse(s ?? "[]"); } catch { return []; }
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api<any>(`/api/crops/${route.params.slug}`);
    crop.value = data.crop;
    stages.value = data.stages;
    care.value = data.care;
    varieties.value = data.varieties;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

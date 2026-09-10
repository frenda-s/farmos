<template>
  <div>
    <StateBlock :loading="loading" :error="error" @retry="load">
      <template v-if="fc">
        <RouterLink :to="`/app/farms/${fc.farm_id}`" class="font-sans text-sm text-[#2f5d33] underline">← {{ fc.farm_name }}</RouterLink>
        <p class="kicker mt-2">{{ fc.zone_name ?? "Khu chung" }} · Trồng {{ formatDateVN(fc.planting_date) }}</p>
        <h1 class="headline text-3xl sm:text-4xl">{{ fc.crop_name }}</h1>
        <p class="font-sans text-sm text-[#7a7264]">{{ fc.variety ?? "" }} · {{ fc.number_of_plants }} cây · {{ fc.area }} ha</p>

        <!-- growth -->
        <div class="paper-card p-5 mt-4">
          <p class="kicker">Tiến độ dự kiến</p>
          <p class="headline text-5xl mt-1">{{ growth.percent }}%</p>
          <p class="font-sans text-sm mt-1">Giai đoạn dự kiến: <b>{{ growth.currentStage }}</b>
            <span v-if="growth.nextStage"> → tiếp theo: {{ growth.nextStage }}</span>
          </p>
          <p class="font-sans text-sm">Ngày thu hoạch dự kiến: <b>{{ formatDateVN(growth.expectedHarvestDate) }}</b> (còn ~{{ growth.daysToHarvest }} ngày)</p>
          <div class="mt-4 space-y-0 border-t border-[#d9d2c2]">
            <div v-for="s in stages" :key="s.id" class="flex gap-3 py-2 border-b border-[#d9d2c2] font-sans text-sm">
              <span class="w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs"
                :class="isPast(s) ? 'bg-[#2f5d33] text-white border-[#2f5d33]' : isCurrent(s) ? 'border-[#2f5d33] text-[#2f5d33] font-bold' : 'border-[#d9d2c2] text-[#7a7264]'">
                {{ isPast(s) ? "✓" : stageIndex(s) + 1 }}
              </span>
              <div>
                <p class="font-semibold">{{ s.name }} <span class="font-normal text-[#7a7264]">~{{ s.duration_days }} ngày</span></p>
                <p class="text-xs text-[#4a443c]">{{ parseArr(s.recommended_activities).join(" · ") }}</p>
              </div>
            </div>
          </div>
          <p class="dateline mt-2">Tiến độ trên là ước tính từ ngày trồng, không phải quan sát thực tế.</p>
        </div>

        <!-- actual stage -->
        <div class="paper-card p-4 mt-3 font-sans text-sm">
          <label class="label-news">Tình trạng thực tế bạn thấy</label>
          <div class="flex gap-2 mt-1">
            <select v-model="actualStage" class="input-news">
              <option value="">— Chưa cập nhật —</option>
              <option v-for="s in stages" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
            <button class="btn-ink px-4 py-2 text-xs rounded-sm shrink-0" @click="saveStage">Lưu</button>
          </div>
          <p v-if="fc.actual_stage" class="text-xs text-[#4a443c] mt-1">Đã ghi: {{ fc.actual_stage }}</p>
        </div>

        <!-- tasks -->
        <h2 class="headline text-2xl mt-6 border-t-2 border-[#1a1714] pt-4">Việc của cây này</h2>
        <ul class="mt-3 space-y-2">
          <li v-for="t in tasks" :key="t.id" class="paper-card p-3 flex items-center gap-3 font-sans text-sm">
            <button v-if="t.status !== 'completed'" @click="setStatus(t, 'completed')" class="w-5 h-5 border-2 border-[#2f5d33] rounded-sm shrink-0" aria-label="Hoàn thành"></button>
            <span v-else class="w-5 h-5 bg-[#2f5d33] text-white rounded-sm text-xs flex items-center justify-center shrink-0">✓</span>
            <div class="flex-1 min-w-0" :class="t.status === 'completed' ? 'line-through text-[#7a7264]' : ''">
              <p class="font-semibold">{{ t.title }}</p>
              <p class="text-xs text-[#7a7264]">Hạn {{ formatDateVN(t.due_date) }} · {{ t.description }}</p>
            </div>
            <StatusBadge kind="status" :value="t.status" />
          </li>
        </ul>
        <p v-if="!tasks.length" class="font-sans text-sm text-[#7a7264] mt-2">Chưa có việc nào.</p>
      </template>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import StateBlock from "@/components/StateBlock.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { api, formatDateVN } from "@/lib/utils";

const route = useRoute();
const fc = ref<any>(null);
const stages = ref<any[]>([]);
const growth = ref<any>({ percent: 0, currentStage: "", nextStage: null, expectedHarvestDate: "", daysToHarvest: 0 });
const tasks = ref<any[]>([]);
const actualStage = ref("");
const loading = ref(true);
const error = ref<string | null>(null);

function parseArr(s: string): string[] {
  try { return JSON.parse(s ?? "[]"); } catch { return []; }
}

function stageIndex(s: any): number {
  return stages.value.findIndex((x) => x.id === s.id);
}

function isCurrent(s: any): boolean {
  return s.name === growth.value.currentStage;
}

function isPast(s: any): boolean {
  return stageIndex(s) < stages.value.findIndex((x) => x.name === growth.value.currentStage);
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api<any>(`/api/farm-crops/${route.params.id}`);
    fc.value = data.farm_crop;
    stages.value = data.stages;
    growth.value = data.growth;
    tasks.value = data.tasks;
    actualStage.value = fc.value.actual_stage ?? "";
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function saveStage() {
  await api(`/api/farm-crops/${fc.value.id}`, { method: "PATCH", body: JSON.stringify({ actual_stage: actualStage.value }) });
  fc.value.actual_stage = actualStage.value;
}

async function setStatus(t: any, status: string) {
  await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  t.status = status;
}

onMounted(load);
</script>

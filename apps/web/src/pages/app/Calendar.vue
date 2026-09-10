<template>
  <div>
    <p class="kicker text-[#2f5d33]">Thời vụ</p>
    <h1 class="headline text-3xl mt-1">Lịch đồng áng</h1>

    <div class="flex flex-wrap items-center gap-2 mt-4 font-sans text-sm">
      <button class="btn-outline px-3 py-1.5 text-xs rounded-sm" @click="shift(-1)">←</button>
      <p class="font-bold min-w-40 text-center">{{ title }}</p>
      <button class="btn-outline px-3 py-1.5 text-xs rounded-sm" @click="shift(1)">→</button>
      <button class="btn-outline px-3 py-1.5 text-xs rounded-sm" @click="reset">Hôm nay</button>
      <div class="flex gap-1 ml-auto text-xs">
        <button @click="mode = 'month'" class="px-3 py-1.5 border rounded-sm" :class="mode === 'month' ? 'bg-[#1a1714] text-[#faf7f1]' : 'border-[#1a1714]'">Tháng</button>
        <button @click="mode = 'week'" class="px-3 py-1.5 border rounded-sm" :class="mode === 'week' ? 'bg-[#1a1714] text-[#faf7f1]' : 'border-[#1a1714]'">Tuần</button>
        <button @click="mode = 'list'" class="px-3 py-1.5 border rounded-sm" :class="mode === 'list' ? 'bg-[#1a1714] text-[#faf7f1]' : 'border-[#1a1714]'">Sắp tới</button>
      </div>
    </div>

    <StateBlock :loading="loading" :error="error" @retry="load">
      <!-- month grid -->
      <div v-if="mode === 'month'" class="paper-card mt-3 p-2">
        <div class="grid grid-cols-7 font-sans text-xs text-center text-[#7a7264] pb-1">
          <span v-for="d in ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']" :key="d">{{ d }}</span>
        </div>
        <div class="grid grid-cols-7 gap-px bg-[#d9d2c2]">
          <div v-for="cell in cells" :key="cell.iso" class="bg-[#fffdf8] min-h-16 sm:min-h-20 p-1 font-sans"
            :class="cell.iso === today ? 'outline outline-2 outline-[#2f5d33] -outline-offset-2' : ''">
            <p class="text-xs" :class="cell.other ? 'text-[#d9d2c2]' : ''">{{ cell.day }}</p>
            <button v-for="t in byDate(cell.iso).slice(0, 2)" :key="t.id" @click="complete(t)"
              class="block w-full text-left text-[10px] leading-tight truncate px-1 mt-0.5 border-l-2"
              :class="t.status === 'completed' ? 'border-[#2f5d33] line-through text-[#7a7264]' : t.priority === 'high' ? 'border-[#a83c2a]' : 'border-[#b07d1e]'"
              :title="t.title">
              {{ t.title }}
            </button>
            <p v-if="byDate(cell.iso).length > 2" class="text-[10px] text-[#7a7264]">+{{ byDate(cell.iso).length - 2 }}</p>
          </div>
        </div>
      </div>

      <!-- week list -->
      <div v-if="mode === 'week'" class="mt-3 space-y-2">
        <div v-for="d in weekDays" :key="d.iso" class="paper-card p-3">
          <p class="font-sans text-sm font-bold">{{ weekday(d.iso) }} · {{ formatDateVN(d.iso) }}</p>
          <ul class="mt-1 space-y-1">
            <li v-for="t in byDate(d.iso)" :key="t.id" class="font-sans text-sm flex items-center gap-2">
              <button v-if="t.status !== 'completed'" @click="complete(t)" class="w-4 h-4 border-2 border-[#2f5d33] rounded-sm shrink-0" aria-label="Hoàn thành"></button>
              <span v-else class="text-[#2f5d33]">✓</span>
              <span :class="t.status === 'completed' ? 'line-through text-[#7a7264]' : ''">{{ t.title }} <span class="text-xs text-[#7a7264]">· {{ t.crop_name ?? t.farm_name }}</span></span>
            </li>
          </ul>
          <p v-if="!byDate(d.iso).length" class="font-sans text-xs text-[#7a7264]">Không có việc.</p>
        </div>
      </div>

      <!-- upcoming -->
      <ul v-if="mode === 'list'" class="mt-3 space-y-2">
        <li v-for="t in upcoming" :key="t.id" class="paper-card p-3 font-sans text-sm flex items-center gap-3">
          <div class="text-center shrink-0 w-12 border-r border-[#d9d2c2] pr-2">
            <p class="headline text-xl">{{ t.due_date.slice(8, 10) }}</p>
            <p class="text-[11px] text-[#7a7264]">th{{ t.due_date.slice(5, 7) }}</p>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ t.title }}</p>
            <p class="text-xs text-[#7a7264]">{{ t.crop_name ?? "" }} · {{ t.farm_name }}</p>
          </div>
          <button v-if="t.status !== 'completed'" @click="complete(t)" class="btn-outline px-2 py-1 text-xs rounded-sm">Xong</button>
        </li>
      </ul>
      <p v-if="mode === 'list' && !upcoming.length" class="font-sans text-sm text-[#7a7264] mt-3">Không có việc sắp tới.</p>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import StateBlock from "@/components/StateBlock.vue";
import { api, formatDateVN, todayISO } from "@/lib/utils";

const tasks = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const mode = ref<"month" | "week" | "list">("month");
const cursor = ref(new Date());
const today = todayISO();

const title = computed(() =>
  cursor.value.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
);

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const cells = computed(() => {
  const y = cursor.value.getFullYear();
  const m = cursor.value.getMonth();
  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: isoOf(d), day: d.getDate(), other: d.getMonth() !== m };
  });
});

const weekDays = computed(() => {
  const base = new Date(cursor.value);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return { iso: isoOf(d) };
  });
});

function byDate(iso: string) {
  return tasks.value.filter((t) => t.due_date === iso);
}

const upcoming = computed(() =>
  tasks.value.filter((t) => t.due_date >= today && t.status !== "completed")
    .sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 30)
);

function weekday(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long" });
}

function shift(n: number) {
  const d = new Date(cursor.value);
  if (mode.value === "week") d.setDate(d.getDate() + n * 7);
  else d.setMonth(d.getMonth() + n);
  cursor.value = d;
  load();
}

function reset() {
  cursor.value = new Date();
  load();
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    let from = "", to = "";
    if (mode.value === "month") {
      const y = cursor.value.getFullYear();
      const m = cursor.value.getMonth();
      from = isoOf(new Date(y, m - 1, 20));
      to = isoOf(new Date(y, m + 1, 10));
    } else if (mode.value === "week") {
      const base = new Date(cursor.value);
      base.setDate(base.getDate() - base.getDay() - 2);
      const end = new Date(base);
      end.setDate(base.getDate() + 11);
      from = isoOf(base);
      to = isoOf(end);
    } else {
      from = today;
      const end = new Date();
      end.setDate(end.getDate() + 60);
      to = isoOf(end);
    }
    const data = await api<any>(`/api/tasks?from=${from}&to=${to}`);
    tasks.value = data.tasks;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function complete(t: any) {
  await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
  t.status = "completed";
}

onMounted(load);
</script>

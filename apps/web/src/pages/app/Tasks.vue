<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <p class="kicker text-[#2f5d33]">Đồng áng</p>
        <h1 class="headline text-3xl mt-1">Công việc</h1>
      </div>
      <button class="btn-ink px-4 py-2 text-sm rounded-sm font-sans" @click="showNew = true">+ Việc mới</button>
    </div>

    <div class="flex gap-2 mt-4 font-sans text-xs">
      <button v-for="s in statuses" :key="s.value" @click="filter = s.value; load()"
        class="px-3 py-1.5 border rounded-sm" :class="filter === s.value ? 'bg-[#1a1714] text-[#faf7f1]' : 'border-[#1a1714]'">
        {{ s.label }}
      </button>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!loading && !error && tasks.length === 0"
      empty-title="Hết việc rồi, nghỉ tay uống nước chè." empty-hint="Tạo việc mới hoặc đợi lịch tự sinh khi thêm cây." :icon="ListChecks" @retry="load">
      <ul class="mt-4 space-y-2">
        <li v-for="t in tasks" :key="t.id" class="paper-card p-3 font-sans text-sm">
          <div class="flex items-center gap-3">
            <button v-if="t.status !== 'completed'" @click="setStatus(t, 'completed')" class="w-5 h-5 border-2 border-[#2f5d33] rounded-sm shrink-0 hover:bg-[#2f5d33]" aria-label="Hoàn thành"></button>
            <span v-else class="w-5 h-5 bg-[#2f5d33] text-white rounded-sm text-xs flex items-center justify-center shrink-0">✓</span>
            <div class="flex-1 min-w-0" :class="t.status === 'completed' ? 'line-through text-[#7a7264]' : ''">
              <p class="font-semibold truncate">{{ t.title }}</p>
              <p class="text-xs text-[#7a7264]">{{ t.crop_name ?? "" }} · {{ t.farm_name }} · hạn {{ formatDateVN(t.due_date) }}</p>
            </div>
            <StatusBadge kind="priority" :value="t.priority" />
          </div>
          <div v-if="t.status !== 'completed'" class="flex gap-1.5 mt-2 ml-8">
            <button class="text-xs border border-[#d9d2c2] px-2 py-0.5 rounded-sm" @click="setStatus(t, 'in_progress')">Bắt đầu</button>
            <button class="text-xs border border-[#d9d2c2] px-2 py-0.5 rounded-sm" @click="snooze(t)">Để mai</button>
            <button class="text-xs border border-[#d9d2c2] px-2 py-0.5 rounded-sm" @click="setStatus(t, 'skipped')">Bỏ qua</button>
            <button class="text-xs text-[#a83c2a] px-2 py-0.5" @click="remove(t)">Xóa</button>
          </div>
        </li>
      </ul>
    </StateBlock>

    <!-- new task modal -->
    <div v-if="showNew" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click.self="showNew = false">
      <div class="bg-[#fffdf8] border-2 border-[#1a1714] p-5 w-full max-w-md">
        <h3 class="headline text-2xl">Việc mới</h3>
        <div class="space-y-3 mt-3 font-sans text-sm">
          <div><label class="label-news">Tên việc *</label><input v-model="form.title" class="input-news mt-1" /></div>
          <div><label class="label-news">Nông trại *</label>
            <select v-model="form.farm_id" class="input-news mt-1">
              <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="label-news">Hạn làm</label><input v-model="form.due_date" type="date" class="input-news mt-1" /></div>
            <div><label class="label-news">Ưu tiên</label>
              <select v-model="form.priority" class="input-news mt-1">
                <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option>
              </select>
            </div>
          </div>
          <div><label class="label-news">Ghi chú</label><input v-model="form.description" class="input-news mt-1" /></div>
          <p v-if="formError" class="text-[#a83c2a] font-semibold">{{ formError }}</p>
          <div class="flex gap-2">
            <button class="btn-ink px-4 py-2 rounded-sm" @click="create">Tạo việc</button>
            <button class="btn-outline px-4 py-2 rounded-sm" @click="showNew = false">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ListChecks } from "lucide-vue-next";
import StateBlock from "@/components/StateBlock.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { api, formatDateVN, todayISO } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const farmStore = useFarmStore();
const tasks = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const filter = ref("");
const showNew = ref(false);
const formError = ref("");

const statuses = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ làm" },
  { value: "in_progress", label: "Đang làm" },
  { value: "completed", label: "Đã xong" },
];

const form = reactive({ title: "", farm_id: "", due_date: todayISO(), priority: "medium", description: "" });

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
    if (!form.farm_id) form.farm_id = farmStore.currentFarmId ?? farmStore.farms[0]?.id ?? "";
    const data = await api<any>(`/api/tasks${filter.value ? `?status=${filter.value}` : ""}`);
    tasks.value = data.tasks;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function setStatus(t: any, status: string) {
  await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  if (filter.value) await load();
  else t.status = status;
}

async function snooze(t: any) {
  const d = new Date(t.due_date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const iso = d.toISOString().slice(0, 10);
  await api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ due_date: iso }) });
  t.due_date = iso;
}

async function remove(t: any) {
  if (!confirm(`Xóa việc "${t.title}"?`)) return;
  await api(`/api/tasks/${t.id}`, { method: "DELETE" });
  tasks.value = tasks.value.filter((x) => x.id !== t.id);
}

async function create() {
  formError.value = "";
  try {
    await api("/api/tasks", { method: "POST", body: JSON.stringify(form) });
    showNew.value = false;
    form.title = "";
    form.description = "";
    await load();
  } catch (e: any) {
    formError.value = e.message;
  }
}

onMounted(load);
</script>

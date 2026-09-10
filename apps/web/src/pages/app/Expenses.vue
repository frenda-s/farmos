<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <p class="kicker text-[#2f5d33]">Sổ chi</p>
        <h1 class="headline text-3xl mt-1">Chi tiêu</h1>
      </div>
      <button class="btn-ink px-4 py-2 text-sm rounded-sm font-sans" @click="showNew = true">+ Ghi khoản chi</button>
    </div>

    <div class="paper-card p-4 mt-4 font-sans text-sm">
      <label class="label-news">Lọc theo trại</label>
      <select v-model="farmId" class="input-news mt-1 max-w-sm" @change="load">
        <option value="">Tất cả trại</option>
        <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
      </select>
    </div>

    <StateBlock :loading="loading" :error="error" @retry="load">
      <!-- summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 font-sans">
        <div class="paper-card p-4"><p class="label-news">Tổng chi</p><p class="headline text-2xl">{{ formatVND(total) }}</p></div>
        <div class="paper-card p-4"><p class="label-news">Ước tính vụ này</p><p class="headline text-2xl">{{ estimate ? formatVND(estimate.total) : "—" }}</p></div>
        <div class="paper-card p-4">
          <p class="label-news">Chênh lệch</p>
          <p class="headline text-2xl" :class="diff <= 0 ? 'text-[#2f5d33]' : 'text-[#a83c2a]'">
            {{ estimate ? formatVND(diff) : "—" }}
          </p>
        </div>
      </div>

      <!-- by category bars -->
      <h2 class="headline text-xl mt-6">Chi theo nhóm</h2>
      <div class="mt-2 space-y-2">
        <div v-for="c in byCategory" :key="c.value" class="font-sans text-sm">
          <div class="flex justify-between"><span>{{ c.label }}</span><b>{{ formatVND(c.amount) }}</b></div>
          <ProgressBar :label="''" :value="total ? (c.amount / total) * 100 : 0" />
        </div>
      </div>

      <!-- list -->
      <h2 class="headline text-xl mt-6 border-t-2 border-[#1a1714] pt-4">Sổ ghi chép</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="e in expenses" :key="e.id" class="paper-card p-3 font-sans text-sm flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ e.note || catLabel(e.category) }}</p>
            <p class="text-xs text-[#7a7264]">{{ formatDateVN(e.date) }} · {{ e.farm_name }} · {{ e.vendor ?? "" }}</p>
          </div>
          <p class="font-bold shrink-0">{{ formatVND(e.amount) }}</p>
          <button class="text-xs text-[#a83c2a]" @click="remove(e)">Xóa</button>
        </li>
      </ul>
      <p v-if="!expenses.length" class="font-sans text-sm text-[#7a7264] mt-2">Chưa ghi khoản chi nào.</p>
    </StateBlock>

    <!-- new expense modal -->
    <div v-if="showNew" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click.self="showNew = false">
      <div class="bg-[#fffdf8] border-2 border-[#1a1714] p-5 w-full max-w-md">
        <h3 class="headline text-2xl">Ghi khoản chi</h3>
        <div class="space-y-3 mt-3 font-sans text-sm">
          <div><label class="label-news">Nông trại *</label>
            <select v-model="form.farm_id" class="input-news mt-1">
              <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="label-news">Nhóm chi *</label>
              <select v-model="form.category" class="input-news mt-1">
                <option v-for="c in EXPENSE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div><label class="label-news">Số tiền (₫) *</label><input v-model.number="form.amount" type="number" min="0" class="input-news mt-1" /></div>
          </div>
          <div><label class="label-news">Ngày chi</label><input v-model="form.date" type="date" class="input-news mt-1" /></div>
          <div><label class="label-news">Nơi mua</label><input v-model="form.vendor" class="input-news mt-1" /></div>
          <div><label class="label-news">Ghi chú</label><input v-model="form.note" class="input-news mt-1" placeholder="VD: Mua 10 bao phân NPK" /></div>
          <p v-if="formError" class="text-[#a83c2a] font-semibold">{{ formError }}</p>
          <div class="flex gap-2">
            <button class="btn-ink px-4 py-2 rounded-sm" @click="create">Lưu</button>
            <button class="btn-outline px-4 py-2 rounded-sm" @click="showNew = false">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import StateBlock from "@/components/StateBlock.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { api, formatVND, formatDateVN, todayISO, EXPENSE_CATEGORIES } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const farmStore = useFarmStore();
const expenses = ref<any[]>([]);
const estimate = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const farmId = ref("");
const showNew = ref(false);
const formError = ref("");

const form = reactive({ farm_id: "", category: "fertilizer", amount: 0, date: todayISO(), vendor: "", note: "" });

const total = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0));
const diff = computed(() => (estimate.value ? total.value - estimate.value.total : 0));

const byCategory = computed(() =>
  EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    amount: expenses.value.filter((e) => e.category === c.value).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0)
);

function catLabel(v: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
    if (!form.farm_id) form.farm_id = farmStore.currentFarmId ?? farmStore.farms[0]?.id ?? "";
    const data = await api<any>(`/api/expenses${farmId.value ? `?farm_id=${farmId.value}` : ""}`);
    expenses.value = data.expenses;
    // rough estimate baseline for comparison
    if (farmId.value) {
      const farm = farmStore.farms.find((f: any) => f.id === farmId.value);
      const est = await api<any>("/api/estimate", {
        method: "POST",
        body: JSON.stringify({ area: farm?.area ?? 1, number_of_plants: 1000, duration: 180, method: farm?.farming_method ?? "traditional" }),
      });
      estimate.value = est;
    } else estimate.value = null;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function create() {
  formError.value = "";
  try {
    await api("/api/expenses", { method: "POST", body: JSON.stringify(form) });
    showNew.value = false;
    form.amount = 0;
    form.note = "";
    form.vendor = "";
    await load();
  } catch (e: any) {
    formError.value = e.message;
  }
}

async function remove(e: any) {
  if (!confirm("Xóa khoản chi này?")) return;
  await api(`/api/expenses/${e.id}`, { method: "DELETE" });
  expenses.value = expenses.value.filter((x) => x.id !== e.id);
}

onMounted(load);
</script>

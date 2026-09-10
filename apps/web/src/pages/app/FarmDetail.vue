<template>
  <div>
    <StateBlock :loading="loading" :error="error" @retry="load">
      <template v-if="farm">
        <RouterLink to="/app/farms" class="font-sans text-sm text-[#2f5d33] underline">← Tất cả trại</RouterLink>
        <div class="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div>
            <p class="kicker">{{ farm.province ?? "Nông trại" }}</p>
            <h1 class="headline text-3xl sm:text-4xl">{{ farm.name }}</h1>
            <p class="font-sans text-sm text-[#7a7264]">{{ farm.address ?? "" }} · {{ farm.area }} {{ farm.area_unit }}</p>
          </div>
          <div class="flex gap-2 font-sans text-xs">
            <button class="btn-outline px-3 py-1.5 rounded-sm" @click="editing = !editing">Sửa trại</button>
            <button class="btn-ink px-3 py-1.5 rounded-sm" @click="showAddCrop = true">+ Thêm cây</button>
          </div>
        </div>

        <!-- edit form -->
        <div v-if="editing" class="paper-card p-4 mt-3 grid sm:grid-cols-3 gap-3 font-sans text-sm">
          <div><label class="label-news">Tên</label><input v-model="editForm.name" class="input-news mt-1" /></div>
          <div><label class="label-news">Diện tích</label><input v-model.number="editForm.area" type="number" class="input-news mt-1" /></div>
          <div><label class="label-news">Loại đất</label>
            <select v-model="editForm.soil_type" class="input-news mt-1">
              <option value="unknown">Chưa rõ</option><option value="sandy">Cát</option><option value="clay">Sét</option>
              <option value="loamy">Thịt pha</option><option value="volcanic">Đất đỏ bazan</option><option value="other">Khác</option>
            </select>
          </div>
          <div><label class="label-news">Nguồn nước</label>
            <select v-model="editForm.water_availability" class="input-news mt-1">
              <option value="unknown">Chưa rõ</option><option value="high">Dồi dào</option><option value="medium">Trung bình</option><option value="low">Hạn chế</option>
            </select>
          </div>
          <div class="sm:col-span-2 flex items-end gap-2">
            <button class="btn-ink px-4 py-2 rounded-sm" @click="saveEdit">Lưu</button>
            <button class="btn-outline px-4 py-2 rounded-sm" @click="editing = false">Hủy</button>
          </div>
        </div>

        <!-- map layers -->
        <div class="paper-card p-4 mt-4">
          <div class="flex gap-2 font-sans text-xs mb-2">
            <button v-for="l in ['farm', 'crops', 'stores']" :key="l" @click="layer = l"
              class="px-3 py-1 border rounded-sm" :class="layer === l ? 'bg-[#1a1714] text-[#faf7f1]' : 'border-[#1a1714]'">
              {{ l === 'farm' ? 'Trại' : l === 'crops' ? 'Cây trồng' : 'Cửa hàng' }}
            </button>
          </div>
          <MapView :markers="mapMarkers" :center="mapCenter" height="300px" />
        </div>

        <!-- zones -->
        <h2 class="headline text-2xl mt-6 border-t-2 border-[#1a1714] pt-4">Các khu trong trại</h2>
        <div class="grid sm:grid-cols-3 gap-3 mt-3">
          <div v-for="z in zones" :key="z.id" class="paper-card p-3 font-sans text-sm">
            <p class="font-bold">{{ z.name }}</p>
            <p class="text-xs text-[#7a7264]">{{ z.area ?? "—" }} ha · {{ z.notes ?? "" }}</p>
          </div>
          <div class="border border-dashed border-[#7a7264] p-3 font-sans text-sm space-y-2">
            <input v-model="newZone.name" placeholder="Tên khu mới" class="input-news !py-1 text-sm" />
            <div class="flex gap-2">
              <input v-model.number="newZone.area" type="number" step="0.1" min="0" placeholder="Diện tích (ha)" class="input-news !py-1 text-sm" />
              <button class="btn-outline px-3 py-1 text-xs rounded-sm shrink-0" @click="addZone">+ Thêm khu</button>
            </div>
            <p v-if="zoneError" class="text-xs text-[#a83c2a] font-semibold">{{ zoneError }}</p>
          </div>
        </div>

        <!-- crops -->
        <h2 class="headline text-2xl mt-6 border-t-2 border-[#1a1714] pt-4">Cây trong trại</h2>
        <div v-if="!crops.length" class="paper-card p-6 text-center mt-3">
          <p class="font-sans text-sm text-[#7a7264]">Chưa có cây nào trong trại.</p>
          <button class="btn-ink px-4 py-2 text-xs rounded-sm mt-2 font-sans" @click="showAddCrop = true">Thêm cây đầu tiên</button>
        </div>
        <div class="grid sm:grid-cols-2 gap-3 mt-3">
          <RouterLink v-for="c in crops" :key="c.id" :to="`/app/crop/${c.id}`" class="paper-card card-hover p-4">
            <p class="headline text-xl">{{ c.crop_name }}</p>
            <p class="font-sans text-xs text-[#7a7264]">{{ c.variety ?? "" }} · {{ c.number_of_plants }} cây · {{ formatDateVN(c.planting_date) }}</p>
            <ProgressBar :label="`Dự kiến ${progressOf(c)}%`" :value="progressOf(c)" class="mt-2" />
            <p class="font-sans text-xs mt-1">Việc tới: {{ nextTask(c) }}</p>
          </RouterLink>
        </div>
      </template>
    </StateBlock>

    <!-- add crop modal -->
    <div v-if="showAddCrop" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click.self="showAddCrop = false">
      <div class="bg-[#fffdf8] border-2 border-[#1a1714] p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="headline text-2xl">Thêm cây vào trại</h3>
        <div class="space-y-3 mt-3 font-sans text-sm">
          <div><label class="label-news">Cây trồng</label>
            <select v-model="cropForm.crop_id" class="input-news mt-1">
              <option v-for="c in library" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div><label class="label-news">Giống</label><input v-model="cropForm.variety" class="input-news mt-1" placeholder="VD: Arabica Caturra" /></div>
          <div><label class="label-news">Khu</label>
            <select v-model="cropForm.zone_id" class="input-news mt-1">
              <option value="">— Chung —</option>
              <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="label-news">Ngày trồng</label><input v-model="cropForm.planting_date" type="date" class="input-news mt-1" /></div>
            <div><label class="label-news">Số cây</label><input v-model.number="cropForm.number_of_plants" type="number" class="input-news mt-1" /></div>
          </div>
          <div><label class="label-news">Diện tích (ha)</label><input v-model.number="cropForm.area" type="number" step="0.1" class="input-news mt-1" /></div>
          <p v-if="cropError" class="text-[#a83c2a] font-semibold">{{ cropError }}</p>
          <div class="flex gap-2">
            <button class="btn-ink px-4 py-2 rounded-sm" @click="addCrop">Thêm (tự sinh lịch việc)</button>
            <button class="btn-outline px-4 py-2 rounded-sm" @click="showAddCrop = false">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import MapView from "@/components/MapView.vue";
import StateBlock from "@/components/StateBlock.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { api, formatDateVN, todayISO } from "@/lib/utils";

const route = useRoute();
const router = useRouter();
const farm = ref<any>(null);
const zones = ref<any[]>([]);
const crops = ref<any[]>([]);
const tasks = ref<any[]>([]);
const stores = ref<any[]>([]);
const library = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const layer = ref("farm");
const editing = ref(false);
const editForm = reactive({ name: "", area: 0, soil_type: "unknown", water_availability: "unknown" });
const newZone = reactive({ name: "", area: null as number | null });
const showAddCrop = ref(false);
const cropError = ref("");
const zoneError = ref("");
const cropForm = reactive({ crop_id: "", variety: "", zone_id: "", planting_date: todayISO(), number_of_plants: 0, area: 0 });

const mapCenter = computed<[number, number]>(() =>
  farm.value?.latitude ? [farm.value.latitude, farm.value.longitude] : [11.9404, 108.4583]
);

const mapMarkers = computed(() => {
  if (!farm.value) return [];
  if (layer.value === "farm") {
    return farm.value.latitude ? [{ lat: farm.value.latitude, lon: farm.value.longitude, label: farm.value.name }] : [];
  }
  if (layer.value === "stores") {
    return stores.value.filter((s) => s.latitude != null).map((s) => ({ lat: s.latitude, lon: s.longitude, label: s.name }));
  }
  return farm.value.latitude ? [{ lat: farm.value.latitude, lon: farm.value.longitude, label: farm.value.name }] : [];
});

function progressOf(c: any): number {
  const dur = c.growth_duration ?? 180;
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(c.planting_date + "T00:00:00").getTime()) / 86400000));
  return Math.min(100, Math.round((elapsed / dur) * 100));
}

function nextTask(c: any): string {
  const t = tasks.value.filter((x: any) => x.farm_crop_id === c.id && x.status !== "completed").sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0];
  return t ? `${t.title} (${formatDateVN(t.due_date)})` : "—";
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id as string;
    const data = await api<any>(`/api/farms/${id}`);
    farm.value = data.farm;
    zones.value = data.zones;
    crops.value = data.crops;
    tasks.value = data.tasks;
    Object.assign(editForm, { name: farm.value.name, area: farm.value.area, soil_type: farm.value.soil_type, water_availability: farm.value.water_availability });
    const lib = await api<any>("/api/crops");
    library.value = lib.crops;
    if (library.value.length && !cropForm.crop_id) cropForm.crop_id = library.value[0].id;
    // mở modal "thêm cây" với cây được chọn sẵn khi đến từ nút "Trồng cây này"
    const plantQuery = route.query.plant as string | undefined;
    if (plantQuery && library.value.some((c: any) => c.id === plantQuery)) {
      cropForm.crop_id = plantQuery;
      showAddCrop.value = true;
      router.replace({ path: `/app/farms/${id}` });
    }
    if (farm.value.latitude) {
      const s = await api<any>(`/api/stores?lat=${farm.value.latitude}&lon=${farm.value.longitude}&max_km=25`);
      stores.value = s.stores;
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function saveEdit() {
  await api(`/api/farms/${farm.value.id}`, { method: "PUT", body: JSON.stringify(editForm) });
  editing.value = false;
  await load();
}

async function addZone() {
  zoneError.value = "";
  if (!newZone.name) {
    zoneError.value = "Nhập tên khu trước.";
    return;
  }
  try {
    await api(`/api/farms/${farm.value.id}/zones`, {
      method: "POST",
      body: JSON.stringify({ name: newZone.name, area: newZone.area ?? undefined }),
    });
    newZone.name = "";
    newZone.area = null;
    await load();
  } catch (e: any) {
    zoneError.value = e.message;
  }
}

async function addCrop() {
  cropError.value = "";
  try {
    await api(`/api/farms/${farm.value.id}/crops`, {
      method: "POST",
      body: JSON.stringify({ ...cropForm, zone_id: cropForm.zone_id || undefined }),
    });
    showAddCrop.value = false;
    await load();
  } catch (e: any) {
    cropError.value = e.message;
  }
}

onMounted(load);
</script>

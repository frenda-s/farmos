<template>
  <div class="max-w-2xl mx-auto">
    <p class="kicker text-[#2f5d33]">Lập trại mới · Bước {{ step }}/3</p>
    <h1 class="headline text-3xl mt-1">{{ titles[step - 1] }}</h1>

    <!-- STEP 1: location -->
    <div v-if="step === 1" class="paper-card p-5 mt-4 space-y-3">
      <div class="flex flex-wrap gap-2">
        <button class="btn-ink px-4 py-2 text-sm rounded-sm" :disabled="locating" @click="detect">
          {{ locating ? "Đang định vị..." : "Tự động tìm vị trí của tôi" }}
        </button>
        <button class="btn-outline px-4 py-2 text-sm rounded-sm" @click="manualMode = true">Chọn trên bản đồ</button>
      </div>
      <p v-if="locError" class="font-sans text-sm text-[#a83c2a]">{{ locError }}</p>
      <div v-if="lat != null">
        <p class="font-sans text-sm">Vĩ độ <b>{{ lat.toFixed(5) }}</b> · Kinh độ <b>{{ lon!.toFixed(5) }}</b></p>
        <p v-if="address" class="font-sans text-sm text-[#4a443c]">{{ address }}</p>
        <MapView v-if="lat != null && lon != null" :markers="[{ lat: lat as number, lon: lon as number, label: 'Vị trí trại' }]" :center="[lat as number, lon as number]" height="260px" @pick="onPick" />
        <p class="dateline mt-1">Bấm vào bản đồ để chỉnh vị trí.</p>
      </div>
      <div v-else-if="manualMode">
        <MapView :markers="[]" height="260px" @pick="onPick" />
        <p class="dateline mt-1">Bấm vào bản đồ để chọn vị trí trại.</p>
      </div>
      <div class="flex justify-end">
        <button class="btn-ink px-6 py-2 text-sm rounded-sm" :class="lat == null ? 'opacity-40' : ''" @click="next">
          Tiếp tục
        </button>
      </div>
    </div>

    <!-- STEP 2: farm info -->
    <div v-if="step === 2" class="paper-card p-5 mt-4 space-y-4">
      <div>
        <label class="label-news">Tên nông trại *</label>
        <input v-model="form.name" class="input-news mt-1" placeholder="VD: Nông trại Thung Lũng Xanh" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="label-news">Diện tích</label>
          <input v-model.number="form.area" type="number" min="0" step="0.1" class="input-news mt-1" />
        </div>
        <div>
          <label class="label-news">Đơn vị</label>
          <select v-model="form.area_unit" class="input-news mt-1">
            <option value="ha">Hecta (ha)</option>
            <option value="sao">Sào</option>
            <option value="m2">m²</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="label-news">Loại đất</label>
          <select v-model="form.soil_type" class="input-news mt-1">
            <option value="unknown">Chưa rõ</option>
            <option value="sandy">Đất cát</option>
            <option value="clay">Đất sét</option>
            <option value="loamy">Đất thịt pha</option>
            <option value="volcanic">Đất đỏ bazan</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label class="label-news">Nguồn nước</label>
          <select v-model="form.water_availability" class="input-news mt-1">
            <option value="unknown">Chưa rõ</option>
            <option value="high">Dồi dào</option>
            <option value="medium">Trung bình</option>
            <option value="low">Hạn chế</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label-news">Cách canh tác</label>
        <select v-model="form.farming_method" class="input-news mt-1">
          <option value="traditional">Truyền thống</option>
          <option value="organic">Hữu cơ</option>
          <option value="high-tech">Công nghệ cao</option>
        </select>
      </div>
      <div class="flex justify-between">
        <button class="btn-outline px-5 py-2 text-sm rounded-sm" @click="step = 1">Quay lại</button>
        <button class="btn-ink px-6 py-2 text-sm rounded-sm" :disabled="!form.name" @click="analyze">Xem phân tích đất</button>
      </div>
    </div>

    <!-- STEP 3: analysis -->
    <div v-if="step === 3" class="paper-card p-5 mt-4">
      <div v-if="analyzing" class="space-y-2">
        <div class="skeleton h-6 w-2/3"></div>
        <div class="skeleton h-16 w-full"></div>
      </div>
      <div v-else-if="region">
        <p class="font-sans">Trại của bạn thuộc vùng <b>{{ region.name }}</b>, cách khoảng {{ distance }} km.</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 font-sans text-sm">
          <div class="border border-[#d9d2c2] p-3"><p class="label-news">Nhiệt độ TB</p><p class="font-bold text-lg">{{ region.avg_temp }}°C</p></div>
          <div class="border border-[#d9d2c2] p-3"><p class="label-news">Mưa</p><p class="font-bold text-lg">{{ region.rainfall_category }}</p></div>
          <div class="border border-[#d9d2c2] p-3"><p class="label-news">Độ cao</p><p class="font-bold text-lg">{{ region.elevation }} m</p></div>
          <div class="border border-[#d9d2c2] p-3"><p class="label-news">Khí hậu</p><p class="font-bold text-sm">{{ region.climate_type }}</p></div>
        </div>
        <p class="font-sans text-sm text-[#4a443c] mt-3">Mùa vụ: {{ parseArr(region.seasons).join(" · ") }}</p>
        <p v-if="error" class="font-sans text-sm text-[#a83c2a] mt-3">{{ error }}</p>
        <div class="flex justify-between mt-4">
          <button class="btn-outline px-5 py-2 text-sm rounded-sm" @click="step = 2">Quay lại</button>
          <button class="btn-ink px-6 py-2 text-sm rounded-sm" :disabled="saving" @click="save">
            {{ saving ? "Đang lưu..." : "Tạo nông trại" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import MapView from "@/components/MapView.vue";
import { api } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const router = useRouter();
const farmStore = useFarmStore();

const titles = ["Trại của bạn ở đâu?", "Kể về nông trại", "Đất này trồng gì hợp?"];
const step = ref(1);
const lat = ref<number | null>(null);
const lon = ref<number | null>(null);
const address = ref("");
const locating = ref(false);
const locError = ref("");
const manualMode = ref(false);
const analyzing = ref(false);
const saving = ref(false);
const error = ref("");
const region = ref<any>(null);
const distance = ref(0);

const form = reactive({
  name: "",
  area: 1,
  area_unit: "ha",
  soil_type: "unknown",
  water_availability: "unknown",
  farming_method: "traditional",
});

function onPick(a: number, o: number) {
  lat.value = a;
  lon.value = o;
  locError.value = "";
  reverse(a, o);
}

function next() {
  if (lat.value == null || lon.value == null) {
    locError.value = "Hãy chọn vị trí trại trước — bấm vào bản đồ hoặc dùng nút định vị.";
    return;
  }
  step.value = 2;
}

async function reverse(a: number, o: number) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${a}&lon=${o}&accept-language=vi`, {
      headers: { "User-Agent": "FarmDesk/1.0" },
    });
    const j = await r.json();
    address.value = j.display_name ?? "";
  } catch {
    address.value = "";
  }
}

function detect() {
  locError.value = "";
  if (!navigator.geolocation) {
    locError.value = "Trình duyệt không hỗ trợ định vị. Hãy chọn trên bản đồ.";
    manualMode.value = true;
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false;
      lat.value = pos.coords.latitude;
      lon.value = pos.coords.longitude;
      reverse(lat.value, lon.value);
    },
    () => {
      locating.value = false;
      locError.value = "FarmDesk không lấy được vị trí. Bạn có thể chọn thủ công trên bản đồ.";
      manualMode.value = true;
    },
    { timeout: 10000 }
  );
}

async function analyze() {
  step.value = 3;
  analyzing.value = true;
  try {
    const data = await api<{ region: any; distance_km: number }>(
      `/api/regions/nearest?lat=${lat.value}&lon=${lon.value}`
    );
    region.value = data.region;
    distance.value = data.distance_km;
  } catch (e: any) {
    region.value = null;
    error.value = e.message;
  } finally {
    analyzing.value = false;
  }
}

function parseArr(s: string): string[] {
  try { return JSON.parse(s ?? "[]"); } catch { return []; }
}

async function save() {
  error.value = "";
  saving.value = true;
  try {
    const data = await api<{ farm: any }>("/api/farms", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        latitude: lat.value,
        longitude: lon.value,
        address: address.value,
        province: region.value?.province,
        location_source: "gps",
        climate_type: region.value?.climate_type,
        elevation: region.value?.elevation,
      }),
    });
    await farmStore.load();
    farmStore.select(data.farm.id);
    router.push("/app/recommendations");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

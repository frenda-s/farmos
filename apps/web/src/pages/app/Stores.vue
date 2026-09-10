<template>
  <div>
    <p class="kicker text-[#2f5d33]">Chợ vật tư</p>
    <h1 class="headline text-3xl mt-1">Cửa hàng gần trại</h1>

    <div class="paper-card p-4 mt-4 font-sans text-sm grid sm:grid-cols-4 gap-3">
      <div><label class="label-news">Trại</label>
        <select v-model="farmId" class="input-news mt-1" @change="load">
          <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div><label class="label-news">Nhóm hàng</label>
        <select v-model="category" class="input-news mt-1" @change="load">
          <option value="">Tất cả</option>
          <option v-for="c in STORE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div><label class="label-news">Bán kính</label>
        <select v-model.number="maxKm" class="input-news mt-1" @change="load">
          <option :value="1">1 km</option><option :value="5">5 km</option>
          <option :value="10">10 km</option><option :value="25">25 km</option>
        </select>
      </div>
      <div><label class="label-news">Sắp xếp</label>
        <select v-model="sort" class="input-news mt-1" @change="load">
          <option value="distance">Gần nhất</option><option value="rating">Đánh giá cao</option><option value="name">Tên A–Z</option>
        </select>
      </div>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!loading && !error && stores.length === 0"
      empty-title="Không thấy cửa hàng nào trong bán kính này." empty-hint="Thử nới bán kính hoặc đổi nhóm hàng." :icon="StoreIcon" @retry="load">
      <MapView :markers="stores.filter(s => s.latitude != null).map(s => ({ lat: s.latitude, lon: s.longitude, label: s.name }))"
        :center="center" height="280px" class="mt-4" />
      <div class="grid sm:grid-cols-2 gap-3 mt-3">
        <div v-for="s in stores" :key="s.id" class="paper-card p-4 font-sans text-sm">
          <div class="flex justify-between items-start gap-2">
            <div>
              <p class="font-bold">{{ s.name }}</p>
              <p class="text-xs text-[#7a7264]">{{ s.category }} · {{ s.address ?? "" }}</p>
            </div>
            <span v-if="s.rating" class="text-xs font-bold border border-[#b07d1e] text-[#b07d1e] px-1.5 py-0.5 rounded-sm">★ {{ s.rating }}</span>
          </div>
          <p class="text-xs mt-1">
            <span v-if="s.distance_km != null" class="font-semibold text-[#2f5d33]">Cách {{ s.distance_km }} km</span>
            <span v-if="s.opening_hours" class="text-[#7a7264]"> · {{ s.opening_hours }}</span>
          </p>
          <div class="flex gap-2 mt-2 text-xs">
            <a :href="`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`"
              target="_blank" rel="noopener" class="btn-outline px-2.5 py-1 rounded-sm">Xem bản đồ</a>
            <a :href="`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`"
              target="_blank" rel="noopener" class="btn-outline px-2.5 py-1 rounded-sm">Chỉ đường</a>
          </div>
        </div>
      </div>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Store as StoreIcon } from "lucide-vue-next";
import MapView from "@/components/MapView.vue";
import StateBlock from "@/components/StateBlock.vue";
import { api, STORE_CATEGORIES } from "@/lib/utils";
import { useFarmStore } from "@/stores/farm";

const farmStore = useFarmStore();
const stores = ref<any[]>([]);
const farmId = ref("");
const category = ref("");
const maxKm = ref(25);
const sort = ref("distance");
const loading = ref(true);
const error = ref<string | null>(null);

const center = computed<[number, number]>(() => {
  const f = farmStore.farms.find((x: any) => x.id === farmId.value);
  return f?.latitude ? [f.latitude, f.longitude] : [11.9404, 108.4583];
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await farmStore.load();
    if (!farmId.value) farmId.value = farmStore.currentFarmId ?? farmStore.farms[0]?.id ?? "";
    const f = farmStore.farms.find((x: any) => x.id === farmId.value);
    const q = new URLSearchParams();
    if (f?.latitude != null) { q.set("lat", String(f.latitude)); q.set("lon", String(f.longitude)); }
    if (category.value) q.set("category", category.value);
    q.set("max_km", String(maxKm.value));
    q.set("sort", sort.value);
    const data = await api<any>(`/api/stores?${q.toString()}`);
    stores.value = data.stores;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

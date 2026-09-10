<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <p class="kicker text-[#2f5d33]">Cẩm nang</p>
    <h1 class="headline text-4xl mt-2">Thư viện cây trồng</h1>
    <p class="text-[#4a443c] mt-2">15 cây trồng phổ biến, kèm điều kiện sinh trưởng và thời vụ.</p>
    <input v-model="q" placeholder="Tìm cây trồng..." class="input-news mt-4 max-w-sm" @input="search" />
    <StateBlock :loading="loading" :error="error" :empty="!loading && !error && list.length === 0"
      empty-title="Không tìm thấy cây trồng." empty-hint="Thử từ khóa khác." @retry="load">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <RouterLink v-for="c in list" :key="c.id" :to="`/crops/${c.slug}`" class="paper-card card-hover p-5">
          <p class="kicker text-[#7a7264]">{{ c.category }}</p>
          <h3 class="headline text-2xl mt-1">{{ c.name }}</h3>
          <p class="font-sans text-xs italic text-[#7a7264]">{{ c.scientific_name }}</p>
          <p class="text-sm text-[#4a443c] mt-2 line-clamp-2">{{ c.description }}</p>
          <p class="font-sans text-xs mt-3 text-[#2f5d33] font-semibold">
            {{ c.suitable_temperature_min }}–{{ c.suitable_temperature_max }}°C · {{ c.growth_duration }} ngày
          </p>
        </RouterLink>
      </div>
    </StateBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { api } from "@/lib/utils";
import StateBlock from "@/components/StateBlock.vue";

const list = ref<any[]>([]);
const q = ref("");
const loading = ref(true);
const error = ref<string | null>(null);
let timer: any = null;

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api<{ crops: any[] }>(`/api/crops${q.value ? `?q=${encodeURIComponent(q.value)}` : ""}`);
    list.value = data.crops;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function search() {
  clearTimeout(timer);
  timer = setTimeout(load, 300);
}

onMounted(load);
</script>

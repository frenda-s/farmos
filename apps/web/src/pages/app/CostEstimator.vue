<template>
  <div>
    <p class="kicker text-[#2f5d33]">Dự toán</p>
    <h1 class="headline text-3xl mt-1">Ước tính chi phí vụ mùa</h1>

    <div class="paper-card p-5 mt-4 font-sans text-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="label-news">Cây trồng</label>
          <select v-model="form.crop_id" class="input-news mt-1" @change="onCropChange">
            <option value="">— Chung —</option>
            <option v-for="c in library" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div><label class="label-news">Cách canh tác</label>
          <select v-model="form.method" class="input-news mt-1">
            <option value="traditional">Truyền thống</option>
            <option value="organic">Hữu cơ (+20%)</option>
            <option value="high-tech">Công nghệ cao (+60%)</option>
          </select>
        </div>
        <div><label class="label-news">Diện tích (ha)</label><input v-model.number="form.area" type="number" min="0.1" step="0.1" class="input-news mt-1" /></div>
        <div><label class="label-news">Số cây</label><input v-model.number="form.number_of_plants" type="number" min="0" class="input-news mt-1" /></div>
      </div>
      <button class="btn-ink px-6 py-2 text-sm rounded-sm mt-4" :disabled="busy" @click="calc">
        {{ busy ? "Đang tính..." : "Tính dự toán" }}
      </button>
      <p v-if="error" class="text-[#a83c2a] font-semibold mt-2">{{ error }}</p>
    </div>

    <div v-if="result" class="mt-4">
      <div class="paper-card p-5 text-center">
        <p class="kicker">Tổng dự toán</p>
        <p class="headline text-4xl sm:text-5xl text-[#2f5d33]">{{ formatVND(result.total) }}</p>
        <p class="font-sans text-sm text-[#7a7264] mt-1">
          Giống ~{{ formatVND(result.costPerPlant) }}/cây · Bình quân {{ formatVND(result.costPerHa) }}/ha
        </p>
      </div>
      <h2 class="headline text-xl mt-6">Chia theo nhóm chi</h2>
      <div class="mt-2 space-y-2">
        <div v-for="c in result.categories" :key="c.category" class="paper-card p-3 font-sans text-sm">
          <div class="flex justify-between"><span>{{ c.label }}</span><b>{{ formatVND(c.amount) }}</b></div>
          <ProgressBar label="" :value="result.total ? (c.amount / result.total) * 100 : 0" />
        </div>
      </div>
      <p class="dateline mt-3">
        Giống tính theo giá cây con tham khảo × số cây; các khoản khác tính theo chi phí chuẩn mỗi hecta × diện tích × hệ số cách canh tác.
        Số liệu tham khảo, không phải báo giá.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { api, formatVND } from "@/lib/utils";

const library = ref<any[]>([]);
const result = ref<any>(null);
const busy = ref(false);
const error = ref("");

const form = reactive({ crop_id: "", method: "traditional", area: 1, number_of_plants: 1000, duration: 180 });

// mật độ trồng tham khảo (cây/ha) theo nhóm — tự điền số cây hợp lý khi đổi cây
const DENSITY: Record<string, number> = {
  "Cây ăn quả": 250,
  "Cây công nghiệp": 2500,
  "Rau củ quả": 20000,
};

const selectedCrop = computed(() => library.value.find((c) => c.id === form.crop_id));

function onCropChange() {
  const density = DENSITY[selectedCrop.value?.category ?? ""];
  if (density) form.number_of_plants = Math.round(density * (form.area || 1));
  calc();
}

async function calc() {
  busy.value = true;
  error.value = "";
  try {
    result.value = await api("/api/estimate", {
      method: "POST",
      body: JSON.stringify({ ...form, crop_id: form.crop_id || undefined }),
    });
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  const data = await api<any>("/api/crops");
  library.value = data.crops;
  if (library.value.length) {
    form.crop_id = library.value[0].id;
    const density = DENSITY[selectedCrop.value?.category ?? ""];
    if (density) form.number_of_plants = Math.round(density * form.area);
  }
  await calc();
});
</script>

<template>
  <div class="min-h-screen lg:flex">
    <!-- desktop sidebar -->
    <aside class="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#d9d2c2] bg-[#fffdf8] min-h-screen sticky top-0 h-screen">
      <RouterLink to="/app/dashboard" class="headline text-2xl px-5 py-4 border-b border-[#d9d2c2]">
        Farm<span class="text-[#2f5d33]">Desk</span>
      </RouterLink>
      <div class="px-5 py-3 border-b border-[#d9d2c2]">
        <label class="label-news">Nông trại</label>
        <select v-model="farmId" class="input-news mt-1" @change="onSwitch">
          <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <nav class="flex-1 overflow-y-auto py-2 font-sans text-sm">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-5 py-2.5 hover:bg-[#f2ede1]"
          :class="$route.path === item.to ? 'bg-[#e6efe2] border-l-4 border-[#2f5d33] font-semibold' : 'border-l-4 border-transparent'"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-[#d9d2c2] p-4 font-sans text-sm">
        <p class="font-semibold truncate">{{ auth.user?.full_name }}</p>
        <p class="text-xs text-[#7a7264] truncate">{{ auth.user?.email }}</p>
        <button class="btn-outline w-full mt-2 px-3 py-1.5 text-xs rounded-sm" @click="logout">Đăng xuất</button>
      </div>
    </aside>

    <!-- main column -->
    <div class="flex-1 min-w-0 pb-20 lg:pb-0">
      <!-- mobile topbar -->
      <header class="lg:hidden sticky top-0 z-10 bg-[#faf7f1] border-b-2 border-[#1a1714] px-4 py-3 flex items-center gap-2">
        <span class="headline text-lg shrink-0">Farm<span class="text-[#2f5d33]">Desk</span></span>
        <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <select v-model="farmId" class="input-news !w-auto !py-1 text-xs max-w-[10rem]" @change="onSwitch">
            <option v-for="f in farmStore.farms" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
          <button @click="logout" aria-label="Đăng xuất" class="p-1 shrink-0"><LogOut class="h-5 w-5" /></button>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 py-6">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <!-- mobile bottom nav -->
      <nav class="lg:hidden fixed bottom-0 inset-x-0 z-10 bg-[#fffdf8] border-t-2 border-[#1a1714] flex justify-around py-2 font-sans text-[11px]">
        <RouterLink to="/app/dashboard" class="flex flex-col items-center gap-0.5 px-2"
          :class="$route.path === '/app/dashboard' ? 'text-[#2f5d33] font-bold' : 'text-[#7a7264]'">
          <LayoutDashboard class="h-5 w-5" /> Bảng tin
        </RouterLink>
        <RouterLink to="/app/farms" class="flex flex-col items-center gap-0.5 px-2"
          :class="$route.path.startsWith('/app/farms') ? 'text-[#2f5d33] font-bold' : 'text-[#7a7264]'">
          <Tractor class="h-5 w-5" /> Trại
        </RouterLink>
        <RouterLink to="/app/tasks" class="flex flex-col items-center gap-0.5 px-2"
          :class="$route.path.startsWith('/app/tasks') ? 'text-[#2f5d33] font-bold' : 'text-[#7a7264]'">
          <ListChecks class="h-5 w-5" /> Việc
        </RouterLink>
        <RouterLink to="/app/stores" class="flex flex-col items-center gap-0.5 px-2"
          :class="$route.path === '/app/stores' ? 'text-[#2f5d33] font-bold' : 'text-[#7a7264]'">
          <MapPin class="h-5 w-5" /> Bản đồ
        </RouterLink>
        <button class="flex flex-col items-center gap-0.5 px-2 text-[#7a7264]" @click="moreOpen = true">
          <MoreHorizontal class="h-5 w-5" /> Thêm
        </button>
      </nav>

      <!-- mobile "more" sheet -->
      <div v-if="moreOpen" class="lg:hidden fixed inset-0 z-50 bg-black/40" @click.self="moreOpen = false">
        <div class="absolute inset-x-0 bottom-0 bg-[#fffdf8] border-t-2 border-[#1a1714] p-4 pb-24">
          <p class="kicker mb-3">Đi đến</p>
          <div class="grid grid-cols-3 gap-2">
            <RouterLink v-for="item in nav" :key="item.to" :to="item.to" @click="moreOpen = false"
              class="paper-card p-3 flex flex-col items-center gap-1 text-xs font-sans hover:border-[#2f5d33]">
              <component :is="item.icon" class="h-5 w-5 text-[#2f5d33]" />
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, RouterView, useRouter, useRoute } from "vue-router";
import {
  LayoutDashboard, Tractor, Sprout, ListChecks, CalendarDays, Wallet,
  Calculator, Store as StoreIcon, Settings, LogOut, MoreHorizontal, MapPin,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useFarmStore } from "@/stores/farm";

const auth = useAuthStore();
const farmStore = useFarmStore();
const router = useRouter();
const route = useRoute();
void route;

const nav = [
  { to: "/app/dashboard", label: "Bảng tin", icon: LayoutDashboard },
  { to: "/app/farms", label: "Nông trại", icon: Tractor },
  { to: "/app/recommendations", label: "Gợi ý cây trồng", icon: Sprout },
  { to: "/app/tasks", label: "Công việc", icon: ListChecks },
  { to: "/app/calendar", label: "Lịch", icon: CalendarDays },
  { to: "/app/expenses", label: "Chi tiêu", icon: Wallet },
  { to: "/app/estimate", label: "Ước tính chi phí", icon: Calculator },
  { to: "/app/stores", label: "Cửa hàng gần đây", icon: StoreIcon },
  { to: "/app/settings", label: "Cài đặt", icon: Settings },
];

const farmId = ref(farmStore.currentFarmId);
const moreOpen = ref(false);

function onSwitch() {
  if (farmId.value) farmStore.select(farmId.value);
}

function logout() {
  auth.logout();
  router.push("/");
}

onMounted(async () => {
  await farmStore.load();
  farmId.value = farmStore.currentFarmId;
  if (farmStore.farms.length === 0) router.push("/app/setup");
});
</script>

<template>
  <div class="min-h-screen">
    <!-- masthead -->
    <header class="border-b-2 border-[#1a1714]">
      <div class="max-w-6xl mx-auto px-4">
        <div class="flex items-center justify-between py-2 dateline">
          <span>{{ today }}</span>
          <span class="hidden sm:inline">Nhật báo nông trại · Số 001</span>
        </div>
        <div class="flex items-center justify-between py-4 border-t border-[#d9d2c2]">
          <RouterLink to="/" class="flex items-center gap-2 headline text-3xl sm:text-4xl tracking-tight">
            <Tractor class="h-7 w-7 text-[#2f5d33]" strokeWidth="{1.75}" />
            Farm<span class="text-[#2f5d33]">Desk</span>
          </RouterLink>
          <nav class="hidden md:flex items-center gap-5 font-sans text-sm font-medium">
            <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="flex items-center gap-1.5 hover:text-[#2f5d33]">
              <component :is="n.icon" class="h-4 w-4" />
              {{ n.label }}
            </RouterLink>
          </nav>
          <div class="hidden md:flex items-center gap-2">
            <RouterLink to="/login" class="btn-outline flex items-center gap-1.5 px-4 py-2 text-sm rounded-sm">
              <LogIn class="h-4 w-4" /> Đăng nhập
            </RouterLink>
            <RouterLink to="/register" class="btn-ink flex items-center gap-1.5 px-4 py-2 text-sm rounded-sm">
              <Sprout class="h-4 w-4" /> Lập nông trại
            </RouterLink>
          </div>
          <button class="md:hidden p-2" @click="open = !open" aria-label="Menu">
            <Menu class="h-6 w-6" />
          </button>
        </div>
        <nav v-if="open" class="md:hidden border-t border-[#d9d2c2] py-3 flex flex-col gap-1 font-sans text-sm">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" @click="open = false"
            class="flex items-center gap-2 py-1.5 px-1 hover:bg-[#f2ede1]">
            <component :is="n.icon" class="h-4 w-4 text-[#2f5d33]" />
            {{ n.label }}
          </RouterLink>
          <div class="flex gap-2 pt-2">
            <RouterLink to="/login" @click="open = false" class="btn-outline flex items-center gap-1.5 px-4 py-2 text-sm rounded-sm">
              <LogIn class="h-4 w-4" /> Đăng nhập
            </RouterLink>
            <RouterLink to="/register" @click="open = false" class="btn-ink flex items-center gap-1.5 px-4 py-2 text-sm rounded-sm">
              <Sprout class="h-4 w-4" /> Lập nông trại
            </RouterLink>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t-2 border-[#1a1714] mt-16">
      <div class="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-6 font-sans text-sm">
        <div>
          <p class="headline text-xl">FarmDesk</p>
          <p class="text-[#7a7264] mt-1">Quản lý nông trại cho người nông dân hiện đại.</p>
        </div>
        <div class="flex flex-col gap-1">
          <RouterLink to="/crops" class="flex items-center gap-1.5 hover:text-[#2f5d33]"><BookOpen class="h-4 w-4" /> Cẩm nang cây trồng</RouterLink>
          <RouterLink to="/guides" class="flex items-center gap-1.5 hover:text-[#2f5d33]"><NotebookText class="h-4 w-4" /> Hướng dẫn canh tác</RouterLink>
          <RouterLink to="/about" class="flex items-center gap-1.5 hover:text-[#2f5d33]"><Info class="h-4 w-4" /> Về chúng tôi</RouterLink>
        </div>
        <div class="text-[#7a7264]">
          <p>Dữ liệu mang tính tham khảo từ bộ dữ liệu nông nghiệp tĩnh.</p>
          <p class="mt-1">© 2026 FarmDesk.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import {
  Menu, Tractor, LogIn, Sprout, BookOpen, NotebookText, Info,
  LayoutGrid, MapPin,
} from "lucide-vue-next";

const open = ref(false);

const nav = [
  { to: "/#features", label: "Tính năng", icon: LayoutGrid },
  { to: "/crops", label: "Cẩm nang cây trồng", icon: BookOpen },
  { to: "/#how", label: "Cách dùng", icon: MapPin },
  { to: "/about", label: "Về FarmDesk", icon: Info },
];

const today = computed(() =>
  new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" })
);
</script>

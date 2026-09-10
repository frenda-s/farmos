<template>
  <div class="max-w-xl">
    <p class="kicker text-[#2f5d33]">Tòa soạn</p>
    <h1 class="headline text-3xl mt-1">Hồ sơ & cài đặt</h1>
    <div class="paper-card p-5 mt-4 font-sans text-sm space-y-2">
      <p><span class="font-semibold uppercase tracking-wide text-xs text-[#4a443c]">Họ tên:</span> <b>{{ auth.user?.full_name }}</b></p>
      <p><span class="font-semibold uppercase tracking-wide text-xs text-[#4a443c]">Email:</span> <b>{{ auth.user?.email }}</b></p>
      <button class="btn-outline px-4 py-2 text-xs rounded-sm mt-2" @click="logout">Đăng xuất</button>
    </div>
    <div class="paper-card p-5 mt-4">
      <p class="headline text-xl">Về dữ liệu FarmDesk</p>
      <p class="font-sans text-sm text-[#4a443c] mt-2">
        Mọi gợi ý đều từ bộ dữ liệu tĩnh và công thức công khai — không có AI.
        Điểm hợp đất, tiến độ sinh trưởng và dự toán chi phí đều là ước lượng tham khảo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push("/");
}
</script>

<template>
  <div class="max-w-md mx-auto py-12">
    <p class="kicker text-[#2f5d33] text-center">Đăng nhập</p>
    <h1 class="headline text-3xl text-center mt-2">Chào mừng trở lại</h1>
    <form class="paper-card p-6 mt-6 space-y-4" @submit.prevent="submit">
      <div>
        <label class="label-news" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="input-news mt-1" required />
      </div>
      <div>
        <label class="label-news" for="password">Mật khẩu</label>
        <input id="password" v-model="password" type="password" class="input-news mt-1" required />
      </div>
      <p v-if="error" class="font-sans text-sm text-[#a83c2a] font-semibold">{{ error }}</p>
      <button class="btn-ink w-full py-2.5 text-sm rounded-sm" :disabled="busy">
        {{ busy ? "Đang vào..." : "Đăng nhập" }}
      </button>
      <p class="font-sans text-sm text-center text-[#7a7264]">
        Chưa có tài khoản? <RouterLink to="/register" class="underline text-[#2f5d33]">Đăng ký</RouterLink>
      </p>
      <p class="dateline text-center">Tài khoản demo: demo@farmdesk.vn / 123456</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push("/app/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

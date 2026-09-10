<template>
  <div class="max-w-md mx-auto py-12">
    <p class="kicker text-[#2f5d33] text-center">Đăng ký</p>
    <h1 class="headline text-3xl text-center mt-2">Lập nông trại của bạn</h1>
    <form class="paper-card p-6 mt-6 space-y-4" @submit.prevent="submit">
      <div>
        <label class="label-news" for="name">Họ tên</label>
        <input id="name" v-model="name" class="input-news mt-1" required minlength="2" />
      </div>
      <div>
        <label class="label-news" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="input-news mt-1" required />
      </div>
      <div>
        <label class="label-news" for="pw">Mật khẩu (ít nhất 6 ký tự)</label>
        <input id="pw" v-model="password" type="password" class="input-news mt-1" required minlength="6" />
      </div>
      <div>
        <label class="label-news" for="pw2">Nhập lại mật khẩu</label>
        <input id="pw2" v-model="confirm" type="password" class="input-news mt-1" required />
      </div>
      <p v-if="error" class="font-sans text-sm text-[#a83c2a] font-semibold">{{ error }}</p>
      <button class="btn-ink w-full py-2.5 text-sm rounded-sm" :disabled="busy">
        {{ busy ? "Đang tạo..." : "Tạo tài khoản" }}
      </button>
      <p class="font-sans text-sm text-center text-[#7a7264]">
        Đã có tài khoản? <RouterLink to="/login" class="underline text-[#2f5d33]">Đăng nhập</RouterLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirm = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  if (password.value !== confirm.value) {
    error.value = "Hai mật khẩu chưa khớp.";
    return;
  }
  busy.value = true;
  try {
    await auth.register(name.value, email.value, password.value);
    router.push("/app/setup");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

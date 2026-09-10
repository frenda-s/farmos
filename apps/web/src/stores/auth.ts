import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/lib/utils";

export interface User {
  id: string;
  full_name: string;
  email: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loaded = ref(false);

  async function me(): Promise<User | null> {
    const token = localStorage.getItem("fd_token");
    if (!token) {
      loaded.value = true;
      return null;
    }
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      user.value = data.user;
    } catch {
      localStorage.removeItem("fd_token");
      user.value = null;
    }
    loaded.value = true;
    return user.value;
  }

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("fd_token", data.token);
    user.value = data.user;
  }

  async function register(full_name: string, email: string, password: string) {
    const data = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    });
    localStorage.setItem("fd_token", data.token);
    user.value = data.user;
  }

  function logout() {
    localStorage.removeItem("fd_token");
    user.value = null;
  }

  return { user, loaded, me, login, register, logout };
});

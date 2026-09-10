import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/PublicLayout.vue"),
      children: [
        { path: "", component: () => import("@/pages/Landing.vue") },
        { path: "crops", component: () => import("@/pages/CropLibrary.vue") },
        { path: "crops/:slug", component: () => import("@/pages/CropDetail.vue") },
        { path: "guides", component: () => import("@/pages/Guides.vue") },
        { path: "about", component: () => import("@/pages/About.vue") },
        { path: "login", component: () => import("@/pages/Login.vue") },
        { path: "register", component: () => import("@/pages/Register.vue") },
      ],
    },
    {
      path: "/app",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "dashboard", component: () => import("@/pages/app/Dashboard.vue") },
        { path: "setup", component: () => import("@/pages/app/SetupWizard.vue") },
        { path: "farms", component: () => import("@/pages/app/Farms.vue") },
        { path: "farms/:id", component: () => import("@/pages/app/FarmDetail.vue") },
        { path: "recommendations", component: () => import("@/pages/app/Recommendations.vue") },
        { path: "crop/:id", component: () => import("@/pages/app/FarmCropDetail.vue") },
        { path: "tasks", component: () => import("@/pages/app/Tasks.vue") },
        { path: "calendar", component: () => import("@/pages/app/Calendar.vue") },
        { path: "expenses", component: () => import("@/pages/app/Expenses.vue") },
        { path: "estimate", component: () => import("@/pages/app/CostEstimator.vue") },
        { path: "stores", component: () => import("@/pages/app/Stores.vue") },
        { path: "settings", component: () => import("@/pages/app/Settings.vue") },
        { path: "", redirect: "/app/dashboard" },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.loaded) await auth.me();
  if (to.meta.requiresAuth && !auth.user) return "/login";
  if ((to.path === "/login" || to.path === "/register") && auth.user) return "/app/dashboard";
});

export default router;

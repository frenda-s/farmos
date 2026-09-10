import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/lib/utils";

export const useFarmStore = defineStore("farm", () => {
  const farms = ref<any[]>([]);
  const currentFarmId = ref<string | null>(localStorage.getItem("fd_farm"));

  async function load() {
    const data = await api<{ farms: any[] }>("/api/farms");
    farms.value = data.farms;
    if (!currentFarmId.value && farms.value.length > 0) {
      currentFarmId.value = farms.value[0].id;
      localStorage.setItem("fd_farm", currentFarmId.value!);
    }
  }

  function select(id: string) {
    currentFarmId.value = id;
    localStorage.setItem("fd_farm", id);
  }

  return { farms, currentFarmId, load, select };
});

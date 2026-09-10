<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-semibold border rounded-sm"
    :class="cls"
  >
    <component :is="icon" v-if="icon" class="h-3 w-3" />
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Flag, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-vue-next";

const props = defineProps<{ kind: "priority" | "status"; value: string }>();

const map: Record<string, { text: string; cls: string; icon: any }> = {
  "priority:high": { text: "Cao", cls: "border-[#a83c2a] text-[#a83c2a]", icon: Flag },
  "priority:medium": { text: "Trung bình", cls: "border-[#b07d1e] text-[#b07d1e]", icon: Flag },
  "priority:low": { text: "Thấp", cls: "border-[#7a7264] text-[#7a7264]", icon: Flag },
  "status:pending": { text: "Chờ làm", cls: "border-[#2a5d7d] text-[#2a5d7d]", icon: Clock },
  "status:in_progress": { text: "Đang làm", cls: "border-[#b07d1e] text-[#b07d1e]", icon: AlertTriangle },
  "status:completed": { text: "Xong", cls: "border-[#2f5d33] text-[#2f5d33]", icon: CheckCircle2 },
  "status:skipped": { text: "Bỏ qua", cls: "border-[#7a7264] text-[#7a7264]", icon: XCircle },
};

const entry = computed(() => map[`${props.kind}:${props.value}`] ?? { text: props.value, cls: "", icon: null });
const text = computed(() => entry.value.text);
const cls = computed(() => entry.value.cls);
const icon = computed(() => entry.value.icon);
</script>

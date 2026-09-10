const BASE = import.meta.env.VITE_API_URL ?? "";

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("fd_token");
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Có lỗi xảy ra, thử lại sau.");
  return data as T;
}

export function formatVND(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

export function formatDateVN(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SOIL_LABELS: Record<string, string> = {
  unknown: "Chưa rõ",
  sandy: "Cát",
  clay: "Sét",
  loamy: "Thịt pha",
  volcanic: "Đất đỏ bazan",
  other: "Khác",
};

export const WATER_LABELS: Record<string, string> = {
  high: "Dồi dào",
  medium: "Trung bình",
  low: "Hạn chế",
  unknown: "Chưa rõ",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  watering: "Tưới nước",
  fertilizing: "Bón phân",
  pest_control: "Sâu bệnh",
  pruning: "Tỉa cành",
  weeding: "Làm cỏ",
  inspection: "Kiểm tra",
  harvest: "Thu hoạch",
  other: "Khác",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  completed: "Xong",
  skipped: "Bỏ qua",
};

export const EXPENSE_CATEGORIES = [
  { value: "seeds", label: "Giống / cây con" },
  { value: "fertilizer", label: "Phân bón" },
  { value: "protection", label: "Thuốc bảo vệ thực vật" },
  { value: "irrigation", label: "Tưới tiêu" },
  { value: "labor", label: "Công lao động" },
  { value: "equipment", label: "Thiết bị" },
  { value: "other", label: "Khác" },
];

export const STORE_CATEGORIES = [
  { value: "Phân bón", label: "Phân bón" },
  { value: "Hạt giống", label: "Hạt giống" },
  { value: "Vườn ươm", label: "Vườn ươm" },
  { value: "Bảo vệ thực vật", label: "Bảo vệ thực vật" },
  { value: "Tưới tiêu", label: "Tưới tiêu" },
  { value: "Máy móc", label: "Máy móc" },
];

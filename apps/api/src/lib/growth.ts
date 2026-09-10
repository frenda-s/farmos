export interface Stage {
  name: string;
  order_index: number;
  duration_days: number | null;
}

export interface GrowthResult {
  elapsedDays: number;
  percent: number;
  currentStage: string;
  nextStage: string | null;
  expectedHarvestDate: string;
  daysToHarvest: number;
}

export function calculateGrowthProgress(
  plantingDate: string,
  growthDuration: number,
  stages: Stage[],
  today: Date = new Date(),
): GrowthResult {
  const planted = new Date(plantingDate + "T00:00:00");
  const elapsedDays = Math.max(
    0,
    Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const percent = Math.min(100, Math.round((elapsedDays / growthDuration) * 100));

  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);

  // distribute total growth duration across stages proportionally by their duration_days
  const totalStageDays = sorted.reduce((s, st) => s + (st.duration_days ?? 0), 0) || growthDuration;
  let cursor = 0;
  let currentStage = sorted[0]?.name ?? "Mới trồng";
  let nextStage: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const stageDays = ((sorted[i].duration_days ?? 0) / totalStageDays) * growthDuration;
    const start = cursor;
    const end = cursor + stageDays;
    if (elapsedDays >= start && elapsedDays < end) {
      currentStage = sorted[i].name;
      nextStage = sorted[i + 1]?.name ?? null;
      break;
    }
    if (i === sorted.length - 1 && elapsedDays >= end) {
      currentStage = sorted[i].name;
      nextStage = null;
    }
    cursor = end;
  }

  const harvest = new Date(planted.getTime() + growthDuration * 1000 * 60 * 60 * 24);
  const daysToHarvest = Math.max(
    0,
    Math.ceil((harvest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    elapsedDays,
    percent,
    currentStage,
    nextStage,
    expectedHarvestDate: harvest.toISOString().slice(0, 10),
    daysToHarvest,
  };
}

export function formatDateVN(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

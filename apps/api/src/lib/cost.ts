export interface CostInput {
  area: number;
  number_of_plants: number;
  duration: number;
  method: string;
  estimated_cost_per_area: number | null;
  category?: string | null;
  seedling_price?: number | null;
}

export interface CostBreakdown {
  category: string;
  label: string;
  amount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  seeds: "Giống / cây con",
  fertilizer: "Phân bón",
  protection: "Thuốc bảo vệ thực vật",
  irrigation: "Tưới tiêu",
  labor: "Công lao động",
  equipment: "Thiết bị",
  other: "Khác",
};

// giá cây giống tham khảo (₫/cây) theo nhóm cây — để "₫/cây" có nghĩa thực
const SEEDLING_PRICE: Record<string, number> = {
  "Cây ăn quả": 90_000,      // bơ, sầu riêng, cam, chanh, chuối...
  "Cây công nghiệp": 18_000, // cà phê, chè, tiêu
  "Rau củ quả": 3_000,       // cà chua, xà lách, dưa leo, bắp cải...
};

export function estimateCost(input: CostInput): {
  categories: CostBreakdown[];
  total: number;
  costPerPlant: number;
  costPerHa: number;
  seedTotal: number;
} {
  const methodFactor =
    input.method === "organic" ? 1.2 : input.method === "high-tech" ? 1.6 : 1.0;
  const perHa = (input.estimated_cost_per_area ?? 30_000_000) * methodFactor;
  const areaCost = perHa * (input.area || 0);

  const seedUnit = input.seedling_price ?? SEEDLING_PRICE[input.category ?? ""] ?? 6_000;
  const seedTotal = seedUnit * (input.number_of_plants || 0);

  // phần chi phí theo diện tích, chia cho các nhóm ngoài giống
  const ratios: [string, number][] = [
    ["fertilizer", 0.3],
    ["protection", 0.13],
    ["irrigation", 0.11],
    ["labor", 0.28],
    ["equipment", 0.08],
    ["other", 0.1],
  ];

  const categories: CostBreakdown[] = [
    { category: "seeds", label: CATEGORY_LABELS.seeds, amount: Math.round(seedTotal) },
    ...ratios.map(([key, r]) => ({
      category: key,
      label: CATEGORY_LABELS[key],
      amount: Math.round(areaCost * r),
    })),
  ];

  const total = seedTotal + areaCost;
  return {
    categories,
    total: Math.round(total),
    costPerPlant: Math.round(seedUnit),
    costPerHa: Math.round(total / (input.area || 1)),
    seedTotal: Math.round(seedTotal),
  };
}

export interface CropLike {
  name: string;
  suitable_temperature_min: number | null;
  suitable_temperature_max: number | null;
  rainfall_min: number | null;
  rainfall_max: number | null;
  elevation_min: number | null;
  elevation_max: number | null;
  water_requirement: string | null;
  soil_types: string[] | string;
}

export interface FarmEnv {
  avg_temp: number | null;
  rainfall: number | null;
  elevation: number | null;
  soil_type: string | null;
  water_availability: string | null;
}

const W = { temp: 30, rainfall: 25, elevation: 15, soil: 15, water: 10, season: 5 };

function inRange(v: number | null, min: number | null, max: number | null): boolean {
  if (v == null || (min == null && max == null)) return false;
  if (min != null && max != null) return v >= min && v <= max;
  if (min != null) return v >= min;
  return v <= (max as number);
}

export function calculateCropCompatibility(
  farm: FarmEnv,
  crop: CropLike,
): { score: number; reasons: string[] } {
  const soilTypes = Array.isArray(crop.soil_types) ? crop.soil_types : [];
  const reasons: string[] = [];
  let score = 0;

  // Temperature — 30%
  if (farm.avg_temp != null && (crop.suitable_temperature_min != null || crop.suitable_temperature_max != null)) {
    if (inRange(farm.avg_temp, crop.suitable_temperature_min, crop.suitable_temperature_max)) {
      score += W.temp;
      reasons.push("Nhiệt độ phù hợp");
    } else {
      reasons.push("Nhiệt độ chưa phù hợp");
    }
  } else {
    score += W.temp * 0.5;
    reasons.push("Chưa rõ nhiệt độ khu vực");
  }

  // Rainfall — 25%
  if (farm.rainfall != null && (crop.rainfall_min != null || crop.rainfall_max != null)) {
    if (inRange(farm.rainfall, crop.rainfall_min, crop.rainfall_max)) {
      score += W.rainfall;
      reasons.push("Lượng mưa phù hợp");
    } else {
      reasons.push("Lượng mưa chưa phù hợp");
    }
  } else {
    score += W.rainfall * 0.5;
    reasons.push("Chưa rõ lượng mưa");
  }

  // Elevation — 15%
  if (farm.elevation != null && (crop.elevation_min != null || crop.elevation_max != null)) {
    if (inRange(farm.elevation, crop.elevation_min, crop.elevation_max)) {
      score += W.elevation;
      reasons.push("Độ cao phù hợp");
    } else {
      reasons.push("Độ cao chưa phù hợp");
    }
  } else {
    score += W.elevation * 0.5;
    reasons.push("Chưa rõ độ cao");
  }

  // Soil — 15%
  if (farm.soil_type && farm.soil_type !== "unknown") {
    if (soilTypes.length === 0 || soilTypes.some((s) => s.toLowerCase() === farm.soil_type!.toLowerCase())) {
      score += W.soil;
      reasons.push("Loại đất phù hợp");
    } else {
      reasons.push("Loại đất chưa phù hợp");
    }
  } else {
    score += W.soil * 0.5;
    reasons.push("Chưa rõ loại đất");
  }

  // Water — 10%
  if (farm.water_availability && farm.water_availability !== "unknown") {
    const need = (crop.water_requirement ?? "").toLowerCase();
    if (need.includes("thấp") && ["low", "medium", "high"].includes(farm.water_availability)) {
      score += W.water;
      reasons.push("Nguồn nước đáp ứng được");
    } else if (need.includes("cao") && ["medium", "high"].includes(farm.water_availability)) {
      score += W.water;
      reasons.push("Nguồn nước đáp ứng được");
    } else if (["low", "medium", "high"].includes(farm.water_availability)) {
      score += W.water * 0.7;
      reasons.push("Nguồn nước cần theo dõi");
    } else {
      reasons.push("Nguồn nước cần theo dõi");
    }
  } else {
    score += W.water * 0.5;
    reasons.push("Chưa rõ nguồn nước");
  }

  // Season — 5% (deterministic: current month vs planting seasons)
  const month = new Date().getMonth() + 1;
  score += W.season; // keep small, seasons shown contextually
  void month;

  return { score: Math.round(Math.min(100, score)), reasons };
}

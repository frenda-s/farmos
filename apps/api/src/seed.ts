import { db } from "./db.js";
import { setupSchema } from "./schema.js";
import { genSalt, hashPassword } from "./lib/auth.js";

const uuid = () => crypto.randomUUID();

// ---------- Crops ----------
interface CropDef {
  id: string;
  name: string;
  scientific_name: string;
  slug: string;
  category: string;
  description: string;
  temp: [number, number];
  rain: [number, number];
  elev: [number, number];
  water: string;
  soil: string[];
  seasons: string[];
  growth: number;
  harvest: number;
  cost: number;
}

const crops: CropDef[] = [
  { id: "crop-coffee", name: "Cà phê", scientific_name: "Coffea arabica", slug: "ca-phe", category: "Cây công nghiệp", description: "Cây cà phê ưa khí hậu mát, đất giàu mùn thoát nước tốt.", temp: [15, 24], rain: [1500, 2500], elev: [500, 1600], water: "Trung bình", soil: ["loamy", "volcanic"], seasons: ["Tháng 5–6"], growth: 300, harvest: 120, cost: 60_000_000 },
  { id: "crop-avocado", name: "Bơ", scientific_name: "Persea americana", slug: "bo", category: "Cây ăn quả", description: "Cây bơ thích hợp vùng cao, đất tơi xốp, thoát nước tốt.", temp: [18, 26], rain: [1200, 2500], elev: [300, 2000], water: "Trung bình", soil: ["loamy", "clay", "volcanic"], seasons: ["Tháng 4–6"], growth: 270, harvest: 90, cost: 45_000_000 },
  { id: "crop-durian", name: "Sầu riêng", scientific_name: "Durio zibethinus", slug: "sau-rieng", category: "Cây ăn quả", description: "Cây sầu riêng cần nhiệt ấm, lượng mưa dồi dào.", temp: [24, 30], rain: [1500, 2500], elev: [50, 800], water: "Cao", soil: ["clay", "loamy"], seasons: ["Tháng 4–5"], growth: 330, harvest: 60, cost: 80_000_000 },
  { id: "crop-passion", name: "Chanh dây", scientific_name: "Passiflora edulis", slug: "chanh-day", category: "Cây ăn quả", description: "Chanh dây phát triển nhanh, cần nắng và nước đều.", temp: [18, 30], rain: [1200, 2500], elev: [100, 1600], water: "Cao", soil: ["loamy", "sandy"], seasons: ["Tháng 3–5", "Tháng 9–11"], growth: 210, harvest: 120, cost: 50_000_000 },
  { id: "crop-strawberry", name: "Dâu tây", scientific_name: "Fragaria × ananassa", slug: "dau-tay", category: "Rau củ quả", description: "Dâu tây ưa mát, thích hợp vùng cao nguyên.", temp: [15, 25], rain: [800, 1200], elev: [500, 2000], water: "Cao", soil: ["loamy", "sandy", "volcanic"], seasons: ["Tháng 9–11"], growth: 90, harvest: 120, cost: 90_000_000 },
  { id: "crop-tomato", name: "Cà chua", scientific_name: "Solanum lycopersicum", slug: "ca-chua", category: "Rau củ quả", description: "Cà chua dễ trồng, cần nắng và nước ổn định.", temp: [18, 27], rain: [600, 1200], elev: [0, 2000], water: "Trung bình", soil: ["loamy", "sandy"], seasons: ["Tháng 10–12", "Tháng 2–4"], growth: 90, harvest: 60, cost: 40_000_000 },
  { id: "crop-chili", name: "Ớt", scientific_name: "Capsicum annuum", slug: "ot", category: "Rau củ quả", description: "Ớt ưa ấm, thích hợp đất tơi xốp.", temp: [20, 30], rain: [600, 1500], elev: [0, 1000], water: "Trung bình", soil: ["loamy", "sandy"], seasons: ["Tháng 11–2"], growth: 120, harvest: 90, cost: 35_000_000 },
  { id: "crop-pepper", name: "Tiêu", scientific_name: "Piper nigrum", slug: "tieu", category: "Cây công nghiệp", description: "Cây tiêu cần ẩm cao, trụ bám và bóng râm nhẹ.", temp: [22, 30], rain: [1500, 2500], elev: [0, 500], water: "Cao", soil: ["clay", "loamy"], seasons: ["Tháng 5–6"], growth: 300, harvest: 120, cost: 55_000_000 },
  { id: "crop-banana", name: "Chuối", scientific_name: "Musa spp.", slug: "chuoi", category: "Cây ăn quả", description: "Chuối sinh trưởng mạnh, cần nước đều quanh năm.", temp: [24, 30], rain: [1200, 2500], elev: [0, 1000], water: "Cao", soil: ["loamy", "clay"], seasons: ["Quanh năm"], growth: 270, harvest: 90, cost: 30_000_000 },
  { id: "crop-orange", name: "Cam", scientific_name: "Citrus sinensis", slug: "cam", category: "Cây ăn quả", description: "Cam cần nhiều nắng, đất thoát nước tốt.", temp: [20, 28], rain: [1000, 1800], elev: [0, 1500], water: "Trung bình", soil: ["loamy", "sandy"], seasons: ["Tháng 3–4"], growth: 270, harvest: 90, cost: 48_000_000 },
  { id: "crop-lemon", name: "Chanh", scientific_name: "Citrus aurantiifolia", slug: "chanh", category: "Cây ăn quả", description: "Chanh dễ chăm, thu hoạch nhanh.", temp: [20, 30], rain: [800, 1800], elev: [0, 1500], water: "Trung bình", soil: ["loamy", "sandy"], seasons: ["Tháng 2–3"], growth: 240, harvest: 90, cost: 38_000_000 },
  { id: "crop-tea", name: "Chè", scientific_name: "Camellia sinensis", slug: "che", category: "Cây công nghiệp", description: "Chè ưa mát, ẩm, đất chua nhẹ.", temp: [18, 25], rain: [1500, 3000], elev: [500, 2000], water: "Cao", soil: ["volcanic", "loamy"], seasons: ["Tháng 3–4"], growth: 300, harvest: 150, cost: 42_000_000 },
  { id: "crop-cabbage", name: "Bắp cải", scientific_name: "Brassica oleracea", slug: "bap-cai", category: "Rau củ quả", description: "Bắp cải ưa mát, sinh trưởng nhanh.", temp: [15, 22], rain: [600, 1200], elev: [200, 2000], water: "Trung bình", soil: ["loamy", "clay"], seasons: ["Tháng 9–12"], growth: 90, harvest: 30, cost: 25_000_000 },
  { id: "crop-lettuce", name: "Xà lách", scientific_name: "Lactuca sativa", slug: "xa-lach", category: "Rau củ quả", description: "Xà lách ngắn ngày, cần nước đều.", temp: [15, 22], rain: [600, 1000], elev: [200, 2000], water: "Cao", soil: ["loamy", "sandy"], seasons: ["Tháng 9–11", "Tháng 2–3"], growth: 45, harvest: 20, cost: 30_000_000 },
  { id: "crop-cucumber", name: "Dưa leo", scientific_name: "Cucumis sativus", slug: "dua-leo", category: "Rau củ quả", description: "Dưa leo ưa ấm, cần giàn leo.", temp: [20, 30], rain: [600, 1200], elev: [0, 1500], water: "Cao", soil: ["loamy", "sandy"], seasons: ["Tháng 10–12"], growth: 60, harvest: 45, cost: 28_000_000 },
];

const STAGE_NAMES = ["Nảy mầm", "Phát triển thân lá", "Ra hoa", "Phát triển quả", "Chín & thu hoạch"];
const STAGE_FRACT = [0.1, 0.3, 0.15, 0.25, 0.2];
const STAGE_ACTIVITIES = [
  ["Tưới nước nhẹ nhàng", "Kiểm tra độ ẩm đất", "Che chắn cho cây con"],
  ["Bón phân thúc", "Kiểm tra lá", "Làm cỏ"],
  ["Theo dõi hoa", "Kiểm tra sâu bệnh", "Tưới nước đều"],
  ["Bón phân nuôi quả", "Kiểm tra quả", "Chống sâu đục quả"],
  ["Chuẩn bị thu hoạch", "Kiểm tra độ chín", "Vệ sinh khu vực"],
];

async function seed() {
  console.log("Seeding...");
  await setupSchema();

  const tables = [
    "expenses", "tasks", "task_templates", "farm_crops", "farm_zones", "crop_recommendations",
    "farms", "users", "crop_varieties", "crop_growth_stages", "crop_care_guides",
    "crop_fertilizers", "fertilizers", "crops", "store_products", "stores",
    "weather_regions", "locations",
  ];
  for (const t of tables) await db.execute(`DELETE FROM ${t}`);

  // ----- crops + stages + care + varieties + task templates -----
  const varieties: Record<string, string[]> = {
    "crop-coffee": ["Arabica Caturra", "Arabica Typica", "Robusta"],
    "crop-avocado": ["Booth", "Hass", "034"],
    "crop-durian": ["Ri6", "Monthong", "Musang King"],
    "crop-passion": ["Chanh dây tím", "Chanh dây vàng"],
    "crop-strawberry": ["New Zealand", "Hana", "Mỹ đá"],
    "crop-tomato": ["Bi đỏ", "Bi vàng", "Hồng Châu"],
    "crop-chili": ["Chỉ thiên", "Sừng trâu"],
    "crop-pepper": ["Tiêu Vĩnh Linh", "Tiêu Phú Quốc"],
    "crop-banana": ["Chuối già", "Chuối cau", "Chuối sứ"],
    "crop-orange": ["Cam sành", "Cam xoàn", "Cam V2"],
    "crop-lemon": ["Chanh không hạt", "Chanh giấy"],
    "crop-tea": ["Chè Ô Long", "Chè xanh B'Lao"],
    "crop-cabbage": ["Bắp cải trắng", "Bắp cải tím"],
    "crop-lettuce": ["Xà lách xoăn", "Xà lách lô lô"],
    "crop-cucumber": ["Dưa leo xanh", "Dưa leo gai"],
  };

  for (const c of crops) {
    await db.execute({
      sql: `INSERT INTO crops (id, name, scientific_name, slug, category, description, suitable_temperature_min, suitable_temperature_max, rainfall_min, rainfall_max, elevation_min, elevation_max, water_requirement, soil_types, planting_seasons, growth_duration, harvest_duration, estimated_cost_per_area)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [c.id, c.name, c.scientific_name, c.slug, c.category, c.description, c.temp[0], c.temp[1], c.rain[0], c.rain[1], c.elev[0], c.elev[1], c.water, JSON.stringify(c.soil), JSON.stringify(c.seasons), c.growth, c.harvest, c.cost],
    });

    for (const v of varieties[c.id] ?? []) {
      await db.execute({
        sql: `INSERT INTO crop_varieties (id, crop_id, name) VALUES (?,?,?)`,
        args: [uuid(), c.id, v],
      });
    }

    for (let i = 0; i < STAGE_NAMES.length; i++) {
      const days = Math.max(5, Math.round(c.growth * STAGE_FRACT[i]));
      await db.execute({
        sql: `INSERT INTO crop_growth_stages (id, crop_id, name, order_index, duration_days, recommended_activities, fertilization_guidance, irrigation_guidance, notes)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [uuid(), c.id, STAGE_NAMES[i], i, days, JSON.stringify(STAGE_ACTIVITIES[i]),
          i === 1 ? "Bón phân giàu đạm để phát triển thân lá" : i === 2 ? "Bón phân giàu lân và kali để kích thích ra hoa" : "Bón phân cân đối theo hướng dẫn",
          c.water === "Cao" ? "Tưới đều, giữ ẩm ổn định" : "Tưới vừa phải, tránh úng", "Theo dõi định kỳ"],
      });
      await db.execute({
        sql: `INSERT INTO crop_care_guides (id, crop_id, stage_name, fertilizer_types, application_timing, guidance, irrigation_frequency, pruning, pest_monitoring)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [uuid(), c.id, STAGE_NAMES[i], JSON.stringify(["NPK cân đối", "Phân hữu cơ"]), "Bón vào đầu giai đoạn",
          STAGE_ACTIVITIES[i].join("; "), c.water === "Cao" ? "2–3 lần/tuần" : "1–2 lần/tuần",
          i === 1 ? "Tỉa cành yếu, tạo tán" : "Tỉa nhẹ khi cần", "Kiểm tra sâu bệnh hằng tuần"],
      });
    }
  }

  // ----- task templates (generic per crop, few key offsets) -----
  const taskPlan: [string, string, string, string, number][] = [
    ["Tưới nước cho cây", "Tưới đủ ẩm, tránh úng", "watering", "medium", 0],
    ["Bón phân thúc", "Bón phân theo giai đoạn phát triển", "fertilizing", "high", 20],
    ["Kiểm tra sâu bệnh", "Quan sát lá, thân, quả", "pest_control", "high", 35],
    ["Làm cỏ khu vực trồng", "Dọn cỏ quanh gốc", "weeding", "medium", 50],
    ["Tỉa cành / tạo tán", "Tỉa cành yếu, tạo độ thông thoáng", "pruning", "medium", 65],
    ["Kiểm tra độ chín", "Kiểm tra quả, chuẩn bị thu hoạch", "inspection", "low", 80],
  ];
  for (const c of crops) {
    for (const [title, desc, type, prio, offset] of taskPlan) {
      await db.execute({
        sql: `INSERT INTO task_templates (id, crop_id, title, description, task_type, priority, offset_days) VALUES (?,?,?,?,?,?,?)`,
        args: [uuid(), c.id, title, desc, type, prio, offset],
      });
    }
  }

  // ----- fertilizers -----
  const fertilizers: [string, string, string, string][] = [
    ["f-npk", "NPK 16-16-8", "Phân tổng hợp", "Phân bón tổng hợp cân đối"],
    ["f-npk-flower", "NPK 10-30-20", "Phân ra hoa", "Phân giàu lân và kali kích thích ra hoa"],
    ["f-urea", "Ure", "Phân đạm", "Phân đạm thúc thân lá"],
    ["f-organic", "Phân hữu cơ ủ hoai", "Phân hữu cơ", "Cải tạo đất, bổ sung mùn"],
    ["f-kali", "Kali", "Phân kali", "Tăng chất lượng quả, củ"],
  ];
  for (const [id, name, cat, desc] of fertilizers) {
    await db.execute({
      sql: `INSERT INTO fertilizers (id, name, category, description) VALUES (?,?,?,?)`,
      args: [id, name, cat, desc],
    });
  }

  // ----- stores (near Đà Lạt 11.94, 108.44) -----
  const stores: [string, string, string, string, number, number, number, string][] = [
    ["s1", "Cửa hàng Vật tư Nông nghiệp Đà Lạt", "Phân bón", "12 Trần Phú, TP Đà Lạt", 11.9415, 108.4420, 4.5, "07:00–19:00"],
    ["s2", "Hạt giống Lâm Đồng", "Hạt giống", "45 Nguyễn Văn Cừ, Đà Lạt", 11.9480, 108.4360, 4.2, "07:30–18:00"],
    ["s3", "Vườn ươm Hoa Đà Lạt", "Vườn ươm", "3 Thánh Mẫu, Đà Lạt", 11.9330, 108.4500, 4.7, "06:00–17:30"],
    ["s4", "Nông dược Tây Nguyên", "Bảo vệ thực vật", "18 Phan Đình Phùng, Đà Lạt", 11.9440, 108.4380, 4.0, "07:00–18:00"],
    ["s5", "Thiết bị Tưới Đà Lạt", "Tưới tiêu", "27 Bùi Thị Xuân, Đà Lạt", 11.9500, 108.4330, 4.3, "08:00–17:00"],
    ["s6", "Cơ khí Nông nghiệp Lâm Đồng", "Máy móc", "9 Hùng Vương, Đà Lạt", 11.9380, 108.4450, 4.1, "07:30–17:30"],
  ];
  for (const [id, name, cat, addr, lat, lon, rating, hours] of stores) {
    await db.execute({
      sql: `INSERT INTO stores (id, name, category, address, latitude, longitude, rating, opening_hours) VALUES (?,?,?,?,?,?,?,?)`,
      args: [id, name, cat, addr, lat, lon, rating, hours],
    });
  }

  // ----- weather regions -----
  const regions: [string, string, string, number, number, number, string, number, string, string[]][] = [
    ["wr-dalat", "Đà Lạt – Lâm Đồng", "Lâm Đồng", 11.9404, 108.4583, 18, "cao", 1500, "Nhiệt đới gió mùa vùng cao", ["Mưa: tháng 5–10", "Khô: tháng 11–4"]],
    ["wr-bmt", "Buôn Ma Thuột – Đắk Lắk", "Đắk Lắk", 12.6662, 108.0382, 24, "trung bình", 500, "Nhiệt đới gió mùa", ["Mưa: tháng 5–10", "Khô: tháng 11–4"]],
    ["wr-mekong", "Đồng bằng sông Cửu Long", "Cần Thơ", 10.0452, 105.7469, 27, "cao", 2, "Nhiệt đới gió mùa", ["Mưa: tháng 5–11", "Khô: tháng 12–4"]],
  ];
  for (const [id, name, prov, lat, lon, temp, rain, elev, climate, seasons] of regions) {
    await db.execute({
      sql: `INSERT INTO weather_regions (id, name, province, latitude, longitude, avg_temp, rainfall_category, elevation, climate_type, seasons) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [id, name, prov, lat, lon, temp, rain, elev, climate, JSON.stringify(seasons)],
    });
  }

  // ----- demo user + farm -----
  const userId = uuid();
  const salt = await genSalt();
  const hash = await hashPassword("123456", salt);
  await db.execute({
    sql: `INSERT INTO users (id, full_name, email, password_hash, salt) VALUES (?,?,?,?,?)`,
    args: [userId, "Nông Dân Mẫu", "demo@farmdesk.vn", hash, salt],
  });

  const farmId = uuid();
  await db.execute({
    sql: `INSERT INTO farms (id, user_id, name, area, area_unit, soil_type, water_availability, farming_method, latitude, longitude, address, province, district, commune, location_source, climate_type, elevation)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [farmId, userId, "Nông Trại Thung Lũng Xanh", 2.4, "ha", "loamy", "high", "organic", 11.9404, 108.4583, "Đường Hồ Xuân Hương, Đà Lạt", "Lâm Đồng", "Đà Lạt", "Phường 3", "gps", "Nhiệt đới gió mùa vùng cao", 1500],
  });

  const zones = [
    { name: "Khu A", area: 1.2, notes: "Trồng cà phê" },
    { name: "Khu B", area: 0.7, notes: "Trồng bơ" },
    { name: "Khu C", area: 0.5, notes: "Trồng rau màu" },
  ];
  const zoneIds: string[] = [];
  for (const z of zones) {
    const zid = uuid();
    zoneIds.push(zid);
    await db.execute({
      sql: `INSERT INTO farm_zones (id, farm_id, name, area, notes) VALUES (?,?,?,?,?)`,
      args: [zid, farmId, z.name, z.area, z.notes],
    });
  }

  // farm crops: coffee, avocado, lettuce
  const today = new Date();
  const iso = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);

  const farmCrops: [string, string, number, number, string, string, string][] = [
    ["crop-coffee", "Arabica Caturra", 5000, 1.2, zoneIds[0], iso(130), "Phát triển thân lá"],
    ["crop-avocado", "Hass", 120, 0.7, zoneIds[1], iso(95), "Phát triển quả"],
    ["crop-lettuce", "Xà lách xoăn", 3000, 0.5, zoneIds[2], iso(20), "Phát triển thân lá"],
  ];

  const farmCropIds: string[] = [];
  for (const [cropId, variety, plants, area, zoneId, planted, stage] of farmCrops) {
    const fcId = uuid();
    farmCropIds.push(fcId);
    await db.execute({
      sql: `INSERT INTO farm_crops (id, farm_id, crop_id, zone_id, variety, planting_date, number_of_plants, area, actual_stage) VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [fcId, farmId, cropId, zoneId, variety, planted, plants, area, stage],
    });
  }

  // sample tasks
  const tasks: [string, string, string, string, string, string, string][] = [
    ["Bón phân cho cà phê", "Bón NPK 16-16-8 theo liều hướng dẫn", "fertilizing", "high", "today", farmCropIds[0], "crop-coffee"],
    ["Kiểm tra sâu bệnh trên bơ", "Quan sát lá và quả, đặc biệt sau mưa", "pest_control", "high", "today", farmCropIds[1], "crop-avocado"],
    ["Tưới nước xà lách", "Tưới vào sáng sớm, giữ ẩm đều", "watering", "medium", "today", farmCropIds[2], "crop-lettuce"],
    ["Làm cỏ khu A", "Dọn cỏ quanh gốc cà phê", "weeding", "low", "tomorrow", farmCropIds[0], "crop-coffee"],
  ];
  const dueDate = (label: string) => label === "today" ? iso(0) : iso(-1);
  for (const [title, desc, type, prio, due, fcId, cropId] of tasks) {
    await db.execute({
      sql: `INSERT INTO tasks (id, user_id, farm_id, farm_crop_id, crop_id, zone_id, title, description, due_date, task_type, priority, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [uuid(), userId, farmId, fcId, cropId, zoneIds[0], title, desc, dueDate(due), type, prio, "pending"],
    });
  }

  // sample expenses
  const expenses: [string, string, number, string, number][] = [
    ["fertilizer", "Mua 10 bao phân NPK", 3_200_000, "Nông dược Tây Nguyên", 40],
    ["labor", "Công chăm sóc tháng", 1_800_000, "—", 25],
    ["irrigation", "Lắp thêm béc tưới", 1_500_000, "Thiết bị Tưới Đà Lạt", 15],
  ];
  for (const [cat, note, amount, vendor, days] of expenses) {
    await db.execute({
      sql: `INSERT INTO expenses (id, user_id, farm_id, crop_id, category, amount, date, vendor, note) VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [uuid(), userId, farmId, "crop-coffee", cat, amount, iso(days), vendor, note],
    });
  }

  console.log("✓ Seeded:", crops.length, "crops,", stores.length, "stores,", regions.length, "regions");
  console.log("  Demo login → demo@farmdesk.vn / 123456");
}

await seed();
process.exit(0);

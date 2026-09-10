import { db } from "./db.js";

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area REAL NOT NULL DEFAULT 0,
  area_unit TEXT NOT NULL DEFAULT 'ha',
  soil_type TEXT NOT NULL DEFAULT 'unknown',
  water_availability TEXT NOT NULL DEFAULT 'unknown',
  farming_method TEXT NOT NULL DEFAULT 'traditional',
  latitude REAL,
  longitude REAL,
  address TEXT,
  province TEXT,
  district TEXT,
  commune TEXT,
  location_source TEXT DEFAULT 'manual',
  climate_type TEXT,
  elevation REAL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS farm_zones (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  suitable_temperature_min REAL,
  suitable_temperature_max REAL,
  rainfall_min REAL,
  rainfall_max REAL,
  elevation_min REAL,
  elevation_max REAL,
  water_requirement TEXT,
  soil_types TEXT NOT NULL DEFAULT '[]',
  planting_seasons TEXT NOT NULL DEFAULT '[]',
  growth_duration INTEGER,
  harvest_duration INTEGER,
  estimated_cost_per_area REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crop_varieties (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crop_growth_stages (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  duration_days INTEGER,
  recommended_activities TEXT NOT NULL DEFAULT '[]',
  fertilization_guidance TEXT,
  irrigation_guidance TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS crop_care_guides (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  fertilizer_types TEXT NOT NULL DEFAULT '[]',
  application_timing TEXT,
  guidance TEXT,
  irrigation_frequency TEXT,
  pruning TEXT,
  pest_monitoring TEXT
);

CREATE TABLE IF NOT EXISTS farm_crops (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES farm_zones(id) ON DELETE SET NULL,
  variety TEXT,
  planting_date TEXT NOT NULL,
  number_of_plants INTEGER NOT NULL DEFAULT 0,
  area REAL NOT NULL DEFAULT 0,
  notes TEXT,
  actual_stage TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  farm_crop_id TEXT REFERENCES farm_crops(id) ON DELETE CASCADE,
  crop_id TEXT REFERENCES crops(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES farm_zones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  task_type TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  stage_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  offset_days INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fertilizers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS crop_fertilizers (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  stage_name TEXT,
  fertilizer_id TEXT REFERENCES fertilizers(id) ON DELETE CASCADE,
  timing TEXT,
  guidance TEXT
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL,
  phone TEXT,
  opening_hours TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price REAL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id TEXT REFERENCES crops(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  vendor TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  latitude REAL,
  longitude REAL,
  address TEXT,
  province TEXT,
  district TEXT,
  commune TEXT,
  source TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS weather_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT,
  latitude REAL,
  longitude REAL,
  avg_temp REAL,
  rainfall_category TEXT,
  elevation REAL,
  climate_type TEXT,
  seasons TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS crop_recommendations (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  score REAL NOT NULL,
  reason TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm ON farm_crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_farm ON expenses(farm_id);
`;

export async function setupSchema() {
  const statements = DDL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const sql of statements) {
    await db.execute(sql);
  }
}

const isDirect = typeof process !== "undefined" && process.argv[1]?.endsWith("schema.ts");

if (isDirect) {
  await setupSchema();
  console.log("✓ Schema ready");
  process.exit(0);
}

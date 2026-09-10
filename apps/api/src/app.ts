import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { db, initEnv, type Env } from "./db.js";
import { createToken, genSalt, hashPassword, verifyPassword, verifyToken } from "./lib/auth.js";
import { calculateCropCompatibility } from "./lib/recommendation.js";
import { calculateGrowthProgress } from "./lib/growth.js";
import { estimateCost } from "./lib/cost.js";
import { scheduleTemplateTasks } from "./lib/tasks.js";
import { haversineKm } from "./lib/geo.js";

const uuid = () => crypto.randomUUID();
const todayISO = () => new Date().toISOString().slice(0, 10);

export const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  initEnv(c.env);
  await next();
});

app.use("/*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"] }));

app.get("/api/health", (c) => c.json({ ok: true, time: todayISO() }));

// ---------- auth middleware helper ----------
async function currentUser(c: any) {
  const raw = (c.req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!raw) return null;
  const payload = await verifyToken(raw);
  if (!payload?.sub) return null;
  const r = await db.execute({ sql: `SELECT id, full_name, email, created_at FROM users WHERE id = ?`, args: [String(payload.sub)] });
  return (r.rows[0] as any) ?? null;
}

async function requireUser(c: any, next: any) {
  const u = await currentUser(c);
  if (!u) return c.json({ error: "Đăng nhập để tiếp tục." }, 401);
  (c as any).set("user", u);
  await next();
}

// ---------- auth ----------
app.post("/api/auth/register", async (c) => {
  const schema = z.object({
    full_name: z.string().min(2, "Nhập họ tên."),
    email: z.string().email("Email chưa đúng."),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự."),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  const { full_name, email, password } = parsed.data;

  const existing = await db.execute({ sql: `SELECT id FROM users WHERE email = ?`, args: [email] });
  if (existing.rows.length > 0) return c.json({ error: "Email đã được dùng." }, 409);

  const id = uuid();
  const salt = await genSalt();
  const hash = await hashPassword(password, salt);
  await db.execute({ sql: `INSERT INTO users (id, full_name, email, password_hash, salt) VALUES (?,?,?,?,?)`, args: [id, full_name, email, hash, salt] });
  const token = await createToken({ sub: id });
  return c.json({ token, user: { id, full_name, email } });
});

app.post("/api/auth/login", async (c) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Email hoặc mật khẩu chưa đúng." }, 400);
  const r = await db.execute({ sql: `SELECT * FROM users WHERE email = ?`, args: [parsed.data.email] });
  const row = r.rows[0] as any;
  if (!row) return c.json({ error: "Email hoặc mật khẩu chưa đúng." }, 401);
  const ok = await verifyPassword(parsed.data.password, row.salt, row.password_hash);
  if (!ok) return c.json({ error: "Email hoặc mật khẩu chưa đúng." }, 401);
  const token = await createToken({ sub: row.id });
  return c.json({ token, user: { id: row.id, full_name: row.full_name, email: row.email } });
});

app.get("/api/auth/me", requireUser, async (c) => {
  return c.json({ user: (c as any).get("user") });
});

// ---------- farms ----------
app.get("/api/farms", requireUser, async (c) => {
  const u = (c as any).get("user");
  const r = await db.execute({ sql: `SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC`, args: [u.id] });
  return c.json({ farms: r.rows });
});

app.post("/api/farms", requireUser, async (c) => {
  const schema = z.object({
    name: z.string().min(1, "Nhập tên nông trại."),
    area: z.number().min(0).default(0),
    area_unit: z.string().default("ha"),
    soil_type: z.string().default("unknown"),
    water_availability: z.string().default("unknown"),
    farming_method: z.string().default("traditional"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    commune: z.string().optional(),
    location_source: z.string().default("manual"),
    climate_type: z.string().optional(),
    elevation: z.number().optional(),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  const d = parsed.data;
  const u = (c as any).get("user");
  const id = uuid();
  await db.execute({
    sql: `INSERT INTO farms (id, user_id, name, area, area_unit, soil_type, water_availability, farming_method, latitude, longitude, address, province, district, commune, location_source, climate_type, elevation)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, u.id, d.name, d.area, d.area_unit, d.soil_type, d.water_availability, d.farming_method, d.latitude ?? null, d.longitude ?? null, d.address ?? null, d.province ?? null, d.district ?? null, d.commune ?? null, d.location_source, d.climate_type ?? null, d.elevation ?? null],
  });
  const r = await db.execute({ sql: `SELECT * FROM farms WHERE id = ?`, args: [id] });
  return c.json({ farm: r.rows[0] }, 201);
});

app.get("/api/farms/:id", requireUser, async (c) => {
  const u = (c as any).get("user");
  const r = await db.execute({ sql: `SELECT * FROM farms WHERE id = ? AND user_id = ?`, args: [c.req.param("id"), u.id] });
  const farm = r.rows[0] as any;
  if (!farm) return c.json({ error: "Không tìm thấy nông trại." }, 404);
  const zones = await db.execute({ sql: `SELECT * FROM farm_zones WHERE farm_id = ?`, args: [farm.id] });
  const fc = await db.execute({
    sql: `SELECT fc.*, cr.name AS crop_name, cr.slug AS crop_slug, cr.growth_duration, cr.scientific_name, fz.name AS zone_name
          FROM farm_crops fc JOIN crops cr ON cr.id = fc.crop_id LEFT JOIN farm_zones fz ON fz.id = fc.zone_id WHERE fc.farm_id = ? ORDER BY fc.created_at`,
    args: [farm.id],
  });
  const tasks = await db.execute({ sql: `SELECT * FROM tasks WHERE farm_id = ? AND status != 'completed' ORDER BY due_date LIMIT 20`, args: [farm.id] });
  return c.json({ farm, zones: zones.rows, crops: fc.rows, tasks: tasks.rows });
});

app.put("/api/farms/:id", requireUser, async (c) => {
  const u = (c as any).get("user");
  const body = await c.req.json().catch(() => null);
  const allowed = ["name", "area", "area_unit", "soil_type", "water_availability", "farming_method", "latitude", "longitude", "address", "province", "district", "commune", "location_source", "climate_type", "elevation", "status"];
  const sets: string[] = [];
  const args: any[] = [];
  for (const k of allowed) {
    if (body?.[k] !== undefined) { sets.push(`${k} = ?`); args.push(body[k]); }
  }
  if (sets.length === 0) return c.json({ error: "Không có gì để cập nhật." }, 400);
  args.push(c.req.param("id"), u.id);
  await db.execute({ sql: `UPDATE farms SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, args });
  const r = await db.execute({ sql: `SELECT * FROM farms WHERE id = ?`, args: [c.req.param("id")] });
  return c.json({ farm: r.rows[0] });
});

app.delete("/api/farms/:id", requireUser, async (c) => {
  const u = (c as any).get("user");
  await db.execute({ sql: `DELETE FROM farms WHERE id = ? AND user_id = ?`, args: [c.req.param("id"), u.id] });
  return c.json({ ok: true });
});

// ---------- zones ----------
app.post("/api/farms/:id/zones", requireUser, async (c) => {
  const u = (c as any).get("user");
  const own = await db.execute({ sql: `SELECT id FROM farms WHERE id = ? AND user_id = ?`, args: [c.req.param("id"), u.id] });
  if (!own.rows.length) return c.json({ error: "Không tìm thấy nông trại." }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (!body?.name) return c.json({ error: "Nhập tên khu." }, 400);
  const id = uuid();
  await db.execute({ sql: `INSERT INTO farm_zones (id, farm_id, name, area, notes) VALUES (?,?,?,?,?)`, args: [id, c.req.param("id"), body.name, body.area ?? null, body.notes ?? null] });
  return c.json({ zone: { id, name: body.name, area: body.area, notes: body.notes } }, 201);
});

app.delete("/api/zones/:id", requireUser, async (c) => {
  await db.execute({ sql: `DELETE FROM farm_zones WHERE id = ?`, args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// ---------- crops library ----------
app.get("/api/crops", async (c) => {
  const q = c.req.query("q") ?? "";
  const r = q
    ? await db.execute({ sql: `SELECT * FROM crops WHERE name LIKE ? ORDER BY name`, args: [`%${q}%`] })
    : await db.execute(`SELECT * FROM crops ORDER BY name`);
  return c.json({ crops: r.rows });
});

app.get("/api/crops/:slug", async (c) => {
  const r = await db.execute({ sql: `SELECT * FROM crops WHERE slug = ?`, args: [c.req.param("slug")] });
  const crop = r.rows[0] as any;
  if (!crop) return c.json({ error: "Không tìm thấy cây trồng." }, 404);
  const stages = await db.execute({ sql: `SELECT * FROM crop_growth_stages WHERE crop_id = ? ORDER BY order_index`, args: [crop.id] });
  const care = await db.execute({ sql: `SELECT * FROM crop_care_guides WHERE crop_id = ?`, args: [crop.id] });
  const varieties = await db.execute({ sql: `SELECT * FROM crop_varieties WHERE crop_id = ?`, args: [crop.id] });
  return c.json({ crop, stages: stages.rows, care: care.rows, varieties: varieties.rows });
});

// ---------- farm crops ----------
app.post("/api/farms/:id/crops", requireUser, async (c) => {
  const u = (c as any).get("user");
  const own = await db.execute({ sql: `SELECT id FROM farms WHERE id = ? AND user_id = ?`, args: [c.req.param("id"), u.id] });
  if (!own.rows.length) return c.json({ error: "Không tìm thấy nông trại." }, 404);
  const schema = z.object({
    crop_id: z.string().min(1),
    variety: z.string().optional(),
    zone_id: z.string().optional(),
    planting_date: z.string().min(1, "Chọn ngày trồng."),
    number_of_plants: z.number().int().min(0).default(0),
    area: z.number().min(0).default(0),
    notes: z.string().optional(),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  const d = parsed.data;
  const id = uuid();
  await db.execute({
    sql: `INSERT INTO farm_crops (id, farm_id, crop_id, zone_id, variety, planting_date, number_of_plants, area, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [id, c.req.param("id"), d.crop_id, d.zone_id ?? null, d.variety ?? null, d.planting_date, d.number_of_plants, d.area, d.notes ?? null],
  });

  // auto-generate tasks from templates
  const tpl = await db.execute({ sql: `SELECT * FROM task_templates WHERE crop_id = ?`, args: [d.crop_id] });
  const scheduled = scheduleTemplateTasks(tpl.rows as any, d.planting_date);
  for (const t of scheduled) {
    await db.execute({
      sql: `INSERT INTO tasks (id, user_id, farm_id, farm_crop_id, crop_id, zone_id, title, description, due_date, task_type, priority, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [uuid(), u.id, c.req.param("id"), id, d.crop_id, d.zone_id ?? null, t.title, t.description, t.due_date, t.task_type, t.priority, "pending"],
    });
  }
  return c.json({ farm_crop: { id }, tasks_created: scheduled.length }, 201);
});

app.get("/api/farm-crops/:id", requireUser, async (c) => {
  const fc = await db.execute({
    sql: `SELECT fc.*, cr.name AS crop_name, cr.scientific_name, cr.slug AS crop_slug, cr.growth_duration, cr.harvest_duration, cr.estimated_cost_per_area, f.name AS farm_name, fz.name AS zone_name
          FROM farm_crops fc JOIN crops cr ON cr.id = fc.crop_id JOIN farms f ON f.id = fc.farm_id LEFT JOIN farm_zones fz ON fz.id = fc.zone_id WHERE fc.id = ?`,
    args: [c.req.param("id")],
  });
  const row = fc.rows[0] as any;
  if (!row) return c.json({ error: "Không tìm thấy." }, 404);
  const stages = await db.execute({ sql: `SELECT * FROM crop_growth_stages WHERE crop_id = ? ORDER BY order_index`, args: [row.crop_id] });
  const growth = calculateGrowthProgress(row.planting_date, row.growth_duration ?? 180, stages.rows as any);
  const tasks = await db.execute({ sql: `SELECT * FROM tasks WHERE farm_crop_id = ? ORDER BY due_date`, args: [row.id] });
  return c.json({ farm_crop: row, stages: stages.rows, growth, tasks: tasks.rows });
});

app.patch("/api/farm-crops/:id", requireUser, async (c) => {
  const body = await c.req.json().catch(() => null);
  const allowed = ["variety", "zone_id", "planting_date", "number_of_plants", "area", "notes", "actual_stage"];
  const sets: string[] = [];
  const args: any[] = [];
  for (const k of allowed) {
    if (body?.[k] !== undefined) { sets.push(`${k} = ?`); args.push(body[k]); }
  }
  if (!sets.length) return c.json({ error: "Không có gì để cập nhật." }, 400);
  args.push(c.req.param("id"));
  await db.execute({ sql: `UPDATE farm_crops SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`, args });
  return c.json({ ok: true });
});

app.delete("/api/farm-crops/:id", requireUser, async (c) => {
  await db.execute({ sql: `DELETE FROM farm_crops WHERE id = ?`, args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// ---------- recommendations ----------
app.get("/api/farms/:id/recommendations", requireUser, async (c) => {
  const u = (c as any).get("user");
  const fr = await db.execute({ sql: `SELECT * FROM farms WHERE id = ? AND user_id = ?`, args: [c.req.param("id"), u.id] });
  const farm = fr.rows[0] as any;
  if (!farm) return c.json({ error: "Không tìm thấy nông trại." }, 404);

  // nearest weather region → env baseline
  let env = { avg_temp: null as number | null, rainfall: null as number | null, elevation: farm.elevation ?? null, soil_type: farm.soil_type, water_availability: farm.water_availability };
  if (farm.latitude != null && farm.longitude != null) {
    const regs = await db.execute(`SELECT * FROM weather_regions`);
    let best: any = null, bestD = Infinity;
    for (const r of regs.rows as any[]) {
      const d = haversineKm(farm.latitude, farm.longitude, r.latitude, r.longitude);
      if (d < bestD) { bestD = d; best = r; }
    }
    if (best) {
      env.avg_temp = best.avg_temp;
      env.elevation = farm.elevation ?? best.elevation;
      env.rainfall = best.rainfall_category === "cao" ? 2000 : best.rainfall_category === "trung bình" ? 1200 : 600;
    }
  } else if (farm.province) {
    const regs = await db.execute({ sql: `SELECT * FROM weather_regions WHERE name LIKE ? LIMIT 1`, args: [`%${farm.province}%`] });
    const best = regs.rows[0] as any;
    if (best) {
      env.avg_temp = best.avg_temp;
      env.elevation = farm.elevation ?? best.elevation;
      env.rainfall = best.rainfall_category === "cao" ? 2000 : 1200;
    }
  }

  const all = await db.execute(`SELECT * FROM crops`);
  const scored = (all.rows as any[]).map((crop) => {
    let soil: string[] = [];
    try { soil = JSON.parse(crop.soil_types ?? "[]"); } catch { /* noop */ }
    const { score, reasons } = calculateCropCompatibility(env, { ...crop, soil_types: soil });
    return { crop, score, reasons };
  }).sort((a, b) => b.score - a.score);

  return c.json({ farm, env, recommendations: scored });
});

// ---------- area analysis (setup wizard step 3) ----------
app.get("/api/regions/nearest", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lon = parseFloat(c.req.query("lon") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) return c.json({ error: "Thiếu tọa độ." }, 400);
  const regs = await db.execute(`SELECT * FROM weather_regions`);
  let best: any = null, bestD = Infinity;
  for (const r of regs.rows as any[]) {
    const d = haversineKm(lat, lon, r.latitude, r.longitude);
    if (d < bestD) { bestD = d; best = r; }
  }
  return c.json({ region: best, distance_km: Math.round(bestD * 10) / 10 });
});

// ---------- tasks ----------
app.get("/api/tasks", requireUser, async (c) => {
  const u = (c as any).get("user");
  const status = c.req.query("status");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const farmId = c.req.query("farm_id");
  let sql = `SELECT t.*, f.name AS farm_name, cr.name AS crop_name FROM tasks t LEFT JOIN farms f ON f.id = t.farm_id LEFT JOIN crops cr ON cr.id = t.crop_id WHERE t.user_id = ?`;
  const args: any[] = [u.id];
  if (status) { sql += ` AND t.status = ?`; args.push(status); }
  if (farmId) { sql += ` AND t.farm_id = ?`; args.push(farmId); }
  if (from) { sql += ` AND t.due_date >= ?`; args.push(from); }
  if (to) { sql += ` AND t.due_date <= ?`; args.push(to); }
  sql += ` ORDER BY t.due_date`;
  const r = await db.execute({ sql, args });
  return c.json({ tasks: r.rows });
});

app.post("/api/tasks", requireUser, async (c) => {
  const schema = z.object({
    farm_id: z.string().min(1, "Chọn nông trại."),
    farm_crop_id: z.string().optional(),
    crop_id: z.string().optional(),
    zone_id: z.string().optional(),
    title: z.string().min(1, "Nhập tên công việc."),
    description: z.string().optional(),
    due_date: z.string().min(1, "Chọn ngày làm."),
    task_type: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  const d = parsed.data;
  const u = (c as any).get("user");
  const id = uuid();
  await db.execute({
    sql: `INSERT INTO tasks (id, user_id, farm_id, farm_crop_id, crop_id, zone_id, title, description, due_date, task_type, priority, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, u.id, d.farm_id, d.farm_crop_id ?? null, d.crop_id ?? null, d.zone_id ?? null, d.title, d.description ?? null, d.due_date, d.task_type ?? null, d.priority, "pending"],
  });
  return c.json({ task: { id, ...d } }, 201);
});

app.patch("/api/tasks/:id", requireUser, async (c) => {
  const body = await c.req.json().catch(() => null);
  const allowed = ["title", "description", "due_date", "task_type", "priority", "status", "zone_id", "farm_crop_id"];
  const sets: string[] = [];
  const args: any[] = [];
  for (const k of allowed) {
    if (body?.[k] !== undefined) { sets.push(`${k} = ?`); args.push(body[k]); }
  }
  if (!sets.length) return c.json({ error: "Không có gì để cập nhật." }, 400);
  args.push(c.req.param("id"));
  await db.execute({ sql: `UPDATE tasks SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`, args });
  return c.json({ ok: true });
});

app.delete("/api/tasks/:id", requireUser, async (c) => {
  await db.execute({ sql: `DELETE FROM tasks WHERE id = ?`, args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// ---------- expenses ----------
app.get("/api/expenses", requireUser, async (c) => {
  const u = (c as any).get("user");
  const farmId = c.req.query("farm_id");
  let sql = `SELECT e.*, f.name AS farm_name, cr.name AS crop_name FROM expenses e LEFT JOIN farms f ON f.id = e.farm_id LEFT JOIN crops cr ON cr.id = e.crop_id WHERE e.user_id = ?`;
  const args: any[] = [u.id];
  if (farmId) { sql += ` AND e.farm_id = ?`; args.push(farmId); }
  sql += ` ORDER BY e.date DESC`;
  const r = await db.execute({ sql, args });
  return c.json({ expenses: r.rows });
});

app.post("/api/expenses", requireUser, async (c) => {
  const schema = z.object({
    farm_id: z.string().min(1, "Chọn nông trại."),
    crop_id: z.string().optional(),
    category: z.string().min(1, "Chọn nhóm chi."),
    amount: z.number().positive("Số tiền phải lớn hơn 0."),
    date: z.string().min(1, "Chọn ngày chi."),
    vendor: z.string().optional(),
    note: z.string().optional(),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  const d = parsed.data;
  const u = (c as any).get("user");
  const id = uuid();
  await db.execute({
    sql: `INSERT INTO expenses (id, user_id, farm_id, crop_id, category, amount, date, vendor, note) VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [id, u.id, d.farm_id, d.crop_id ?? null, d.category, d.amount, d.date, d.vendor ?? null, d.note ?? null],
  });
  return c.json({ expense: { id, ...d } }, 201);
});

app.delete("/api/expenses/:id", requireUser, async (c) => {
  await db.execute({ sql: `DELETE FROM expenses WHERE id = ?`, args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// ---------- cost estimator ----------
app.post("/api/estimate", async (c) => {
  const schema = z.object({
    area: z.number().min(0.01, "Nhập diện tích."),
    number_of_plants: z.number().int().min(0).default(0),
    duration: z.number().int().min(1).default(180),
    method: z.string().default("traditional"),
    crop_id: z.string().optional(),
  });
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa đúng." }, 400);
  let costPerArea: number | null = null;
  let category: string | null = null;
  if (parsed.data.crop_id) {
    const r = await db.execute({ sql: `SELECT estimated_cost_per_area, category FROM crops WHERE id = ?`, args: [parsed.data.crop_id] });
    const row = r.rows[0] as any;
    costPerArea = row?.estimated_cost_per_area ?? null;
    category = row?.category ?? null;
  }
  return c.json(estimateCost({ ...parsed.data, estimated_cost_per_area: costPerArea, category }));
});

// ---------- stores ----------
app.get("/api/stores", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lon = parseFloat(c.req.query("lon") ?? "");
  const category = c.req.query("category");
  const maxKm = parseFloat(c.req.query("max_km") ?? "25");
  const sort = c.req.query("sort") ?? "distance";
  const r = await db.execute(`SELECT * FROM stores`);
  let list = (r.rows as any[]).map((s) => ({
    ...s,
    distance_km: (!Number.isNaN(lat) && !Number.isNaN(lon) && s.latitude != null && s.longitude != null)
      ? Math.round(haversineKm(lat, lon, s.latitude, s.longitude) * 10) / 10
      : null,
  }));
  if (category) list = list.filter((s) => (s.category ?? "").toLowerCase().includes(category.toLowerCase()));
  if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
    list = list.filter((s) => s.distance_km == null || s.distance_km <= (Number.isNaN(maxKm) ? 25 : maxKm));
  }
  if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  else if (sort === "name") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  else list.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
  return c.json({ stores: list });
});

// ---------- dashboard ----------
app.get("/api/dashboard", requireUser, async (c) => {
  const u = (c as any).get("user");
  const farms = await db.execute({ sql: `SELECT * FROM farms WHERE user_id = ?`, args: [u.id] });
  const fc = await db.execute({
    sql: `SELECT fc.*, cr.name AS crop_name, cr.growth_duration FROM farm_crops fc JOIN farms f ON f.id = fc.farm_id JOIN crops cr ON cr.id = fc.crop_id WHERE f.user_id = ?`,
    args: [u.id],
  });
  const tasks = await db.execute({
    sql: `SELECT t.*, f.name AS farm_name, cr.name AS crop_name FROM tasks t JOIN farms f ON f.id = t.farm_id LEFT JOIN crops cr ON cr.id = t.crop_id WHERE t.user_id = ? AND t.status != 'completed' ORDER BY t.due_date LIMIT 10`,
    args: [u.id],
  });
  const todayTasks = tasks.rows.filter((t: any) => t.due_date === todayISO());
  const month = todayISO().slice(0, 7);
  const exp = await db.execute({ sql: `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id = ? AND substr(date,1,7) = ?`, args: [u.id, month] });

  // progress per crop
  const crops = (fc.rows as any[]).map((row) => {
    const g = calculateGrowthProgress(row.planting_date, row.growth_duration ?? 180, []);
    return { ...row, progress: g.percent, expected_stage: g.currentStage, expected_harvest: g.expectedHarvestDate, days_to_harvest: g.daysToHarvest };
  });

  return c.json({
    stats: {
      total_farms: farms.rows.length,
      total_crops: fc.rows.length,
      active_tasks: tasks.rows.length,
      monthly_cost: (exp.rows[0] as any)?.total ?? 0,
    },
    farms: farms.rows,
    crops,
    today_tasks: todayTasks,
    upcoming_tasks: tasks.rows.slice(todayTasks.length),
  });
});

// ---------- alerts (deterministic rules) ----------
app.get("/api/farms/:id/alerts", requireUser, async (c) => {
  const u = (c as any).get("user");
  const fc = await db.execute({
    sql: `SELECT fc.*, cr.name AS crop_name, cr.growth_duration FROM farm_crops fc JOIN crops cr ON cr.id = fc.crop_id WHERE fc.farm_id = ?`,
    args: [c.req.param("id")],
  });
  const alerts: { level: string; message: string }[] = [];
  for (const row of fc.rows as any[]) {
    const g = calculateGrowthProgress(row.planting_date, row.growth_duration ?? 180, []);
    if (g.daysToHarvest <= 30 && g.daysToHarvest > 0) {
      alerts.push({ level: "high", message: `${row.crop_name} sắp đến kỳ thu hoạch (còn ~${g.daysToHarvest} ngày).` });
    }
    if (g.percent >= 40 && g.percent <= 60) {
      alerts.push({ level: "medium", message: `${row.crop_name} đang giữa vụ — kiểm tra phân bón và sâu bệnh.` });
    }
  }
  const overdue = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM tasks WHERE farm_id = ? AND status != 'completed' AND due_date < ?`,
    args: [c.req.param("id"), todayISO()],
  });
  const n = (overdue.rows[0] as any)?.n ?? 0;
  if (n > 0) alerts.push({ level: "high", message: `Có ${n} công việc quá hạn chưa làm.` });
  void u;
  return c.json({ alerts });
});

export default app;

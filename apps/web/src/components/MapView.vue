<template>
  <div :id="mapId" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import L from "leaflet";

let uid = 0;
const mapId = `fd-map-${++uid}`;

const props = withDefaults(
  defineProps<{
    markers: { lat: number; lon: number; label?: string }[];
    center?: [number, number];
    zoom?: number;
    height?: string;
  }>(),
  { zoom: 13, height: "320px" }
);

const emit = defineEmits<{ (e: "pick", lat: number, lon: number): void }>();

let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;

function draw() {
  if (!map) return;
  layer?.clearLayers();
  layer = L.layerGroup().addTo(map);
  const pts: [number, number][] = [];
  for (const m of props.markers) {
    if (m.lat == null || m.lon == null) continue;
    pts.push([m.lat, m.lon]);
    L.marker([m.lat, m.lon]).addTo(layer).bindPopup(m.label ?? "");
  }
  if (pts.length === 1) map.setView(pts[0], props.zoom);
  else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  else if (props.center) map.setView(props.center, props.zoom);
}

onMounted(() => {
  map = L.map(mapId).setView(props.center ?? [11.9404, 108.4583], props.zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);
  map.on("click", (e: L.LeafletMouseEvent) => emit("pick", e.latlng.lat, e.latlng.lng));
  draw();
  // map đôi khi mount khi container chưa có kích thước → gọi lại để sửa tile bị lệch/trắng
  nextTick(() => map?.invalidateSize());
});

watch(() => props.markers, draw, { deep: true });
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <!-- hero -->
    <section class="py-10 sm:py-14 grid lg:grid-cols-2 gap-8 items-center border-b-2 border-[#1a1714]">
      <div v-reveal>
        <p class="kicker text-[#2f5d33]">Báo nông nghiệp · Ra hằng ngày</p>
        <h1 class="headline text-4xl sm:text-6xl leading-[1.05] mt-3">Quản lý nông trại thông minh hơn</h1>
        <p class="text-lg text-[#4a443c] mt-4 leading-relaxed">
          FarmDesk giúp bạn hiểu đất của mình, chọn cây trồng phù hợp, lên kế hoạch canh tác,
          theo dõi sinh trưởng và quản lý chi phí — tất cả trong một chỗ.
        </p>
        <div class="flex flex-wrap gap-3 mt-6">
          <RouterLink to="/register" class="btn-ink px-6 py-3 text-sm rounded-sm">Bắt đầu ngay</RouterLink>
          <RouterLink to="/#features" class="btn-outline px-6 py-3 text-sm rounded-sm">Xem tính năng</RouterLink>
        </div>
        <p class="dateline mt-4">Miễn phí bắt đầu · Không cần thẻ · Tiếng Việt</p>
      </div>
      <!-- hero visual: mock dashboard broadsheet -->
      <div v-reveal="120" class="paper-card p-5 rotate-[0.5deg]">
        <p class="kicker border-b border-[#d9d2c2] pb-2">Bảng tin nông trại · Đà Lạt</p>
        <div class="grid grid-cols-3 gap-3 mt-3 font-sans text-center">
          <div class="border border-[#d9d2c2] p-3">
            <p class="text-2xl font-bold">3</p><p class="text-xs text-[#7a7264]">Nông trại</p>
          </div>
          <div class="border border-[#d9d2c2] p-3">
            <p class="text-2xl font-bold">8</p><p class="text-xs text-[#7a7264]">Cây trồng</p>
          </div>
          <div class="border border-[#d9d2c2] p-3">
            <p class="text-2xl font-bold text-[#2f5d33]">94%</p><p class="text-xs text-[#7a7264]">Cà phê hợp đất</p>
          </div>
        </div>
        <div class="mt-3 border border-[#d9d2c2] p-3 font-sans text-sm">
          <p class="font-semibold">Việc hôm nay</p>
          <p class="text-xs text-[#4a443c] mt-1">☐ Bón phân cà phê — Khu A · ☐ Kiểm tra sâu bệnh bơ — Khu B</p>
        </div>
        <div class="mt-3">
          <p class="label-news">Cà phê · Sinh trưởng thân lá</p>
          <div class="progress-ink rounded-sm mt-1"><div style="width: 72%"></div></div>
          <p class="font-sans text-xs text-[#7a7264] mt-1">Dự kiến thu hoạch sau 86 ngày</p>
        </div>
      </div>
    </section>

    <!-- features -->
    <section id="features" v-reveal class="py-12 border-b border-[#d9d2c2]">
      <p class="kicker text-[#2f5d33]">Chuyên mục</p>
      <h2 class="headline text-3xl sm:text-4xl mt-2">Sáu việc FarmDesk làm giúp bạn</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div v-for="(f, i) in features" :key="f.title" v-reveal="i * 60" class="paper-card card-hover p-5">
          <component :is="f.icon" class="h-6 w-6 text-[#2f5d33]" />
          <h3 class="headline text-xl mt-3">{{ f.title }}</h3>
          <p class="text-[#4a443c] mt-1 leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- how it works -->
    <section id="how" v-reveal class="py-12 border-b border-[#d9d2c2]">
      <p class="kicker text-[#2f5d33]">Quy trình</p>
      <h2 class="headline text-3xl sm:text-4xl mt-2">Bốn bước ra đồng</h2>
      <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <li v-for="(s, i) in steps" :key="s.title" v-reveal="i * 80" class="border-t-2 border-[#1a1714] pt-3">
          <p class="headline text-4xl text-[#d9d2c2]">0{{ i + 1 }}</p>
          <h3 class="headline text-lg mt-1">{{ s.title }}</h3>
          <p class="text-sm text-[#4a443c] mt-1">{{ s.desc }}</p>
        </li>
      </ol>
    </section>

    <!-- CTA -->
    <section v-reveal class="py-12 text-center">
      <h2 class="headline text-3xl sm:text-4xl">Đất của bạn hợp cây gì?</h2>
      <p class="text-[#4a443c] mt-2">Nhập vị trí, nhận gợi ý cây trồng trong một phút.</p>
      <RouterLink to="/register" class="btn-ink inline-block px-8 py-3 text-sm rounded-sm mt-5">Lập nông trại miễn phí</RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { MapPin, Tractor, Sprout, ListChecks, Calculator, Store } from "lucide-vue-next";

const features = [
  { icon: MapPin, title: "Gợi ý theo vị trí", desc: "Dựa vào khí hậu, đất và nước nơi bạn ở để chấm điểm từng cây trồng." },
  { icon: Tractor, title: "Quản lý trại & cây", desc: "Chia khu, thêm cây trồng, theo dõi từng vụ từ lúc gieo đến lúc thu." },
  { icon: Sprout, title: "Theo dõi sinh trưởng", desc: "Tiến độ dự kiến theo ngày trồng, giai đoạn hiện tại và ngày thu hoạch." },
  { icon: ListChecks, title: "Việc đồng áng", desc: "Tự sinh công việc tưới, bón, tỉa theo từng giai đoạn. Nhắc việc mỗi ngày." },
  { icon: Calculator, title: "Ước tính chi phí", desc: "Dự toán giống, phân, công lao động theo diện tích. So với chi thực tế." },
  { icon: Store, title: "Cửa hàng gần đây", desc: "Tìm cửa hàng phân bón, giống, vật tư quanh nông trại trên bản đồ." },
];

const steps = [
  { title: "Chấm vị trí", desc: "Cho phép định vị hoặc chọn điểm trên bản đồ." },
  { title: "Đọc đất", desc: "FarmDesk tra khí hậu, độ cao, mùa vụ vùng bạn." },
  { title: "Chọn cây", desc: "Xem điểm hợp đất từng cây và lý do cụ thể." },
  { title: "Chăm & thu", desc: "Theo dõi sinh trưởng, làm việc, tính chi phí." },
];
</script>

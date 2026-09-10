<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <p class="kicker text-[#2f5d33]">Hướng dẫn</p>
    <h1 class="headline text-4xl mt-2">Cẩm nang canh tác cơ bản</h1>
    <div class="mt-6 space-y-4">
      <article v-for="g in guides" :key="g.title" class="paper-card p-5">
        <h2 class="headline text-2xl">{{ g.title }}</h2>
        <p class="text-[#4a443c] mt-2 leading-relaxed">{{ g.body }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const guides = [
  { title: "1. Đọc đất trước khi trồng", body: "Xác định loại đất (cát, sét, thịt pha, đất đỏ), nguồn nước và độ dốc. Đất thoát nước kém dễ gây thối rễ; đất cát giữ nước kém cần tưới thường xuyên hơn. Nếu chưa chắc, chọn 'Chưa rõ' — FarmDesk vẫn gợi ý dựa trên khí hậu vùng bạn." },
  { title: "2. Chọn cây hợp khí hậu", body: "Mỗi cây có ngưỡng nhiệt độ, lượng mưa và độ cao riêng. Trang Gợi ý cây trồng chấm điểm 0–100 theo 6 tiêu chí: nhiệt độ 30%, mưa 25%, độ cao 15%, đất 15%, nước 10%, mùa vụ 5%. Điểm càng cao càng hợp — nhưng luôn đọc lý do kèm theo." },
  { title: "3. Chia khu cho nông trại", body: "Trại trên 0,5 ha nên chia khu theo cây trồng để tiện tưới, bón và theo dõi riêng. Mỗi khu ghi diện tích và ghi chú để sau này đối chiếu chi phí." },
  { title: "4. Ghi ngày trồng thật chính xác", body: "Ngày trồng là mốc tính toàn bộ tiến độ sinh trưởng, lịch tưới bón và ngày thu hoạch dự kiến. Ghi sai một tuần, mọi dự báo lệch theo một tuần." },
  { title: "5. Tưới và bón theo giai đoạn", body: "Cây con cần ẩm nhẹ và đạm để lên lá; ra hoa cần lân, kali và tránh úng; nuôi quả cần dinh dưỡng đều. Xem trang chi tiết từng cây để biết hướng dẫn từng giai đoạn." },
  { title: "6. Ghi chép chi tiêu", body: "Ghi mọi khoản giống, phân, thuốc, công. Cuối vụ so sánh chi thực tế với dự toán để biết lời lỗ từng cây, từng khu." },
];
</script>

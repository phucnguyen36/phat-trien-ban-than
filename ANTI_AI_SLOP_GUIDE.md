# 🛡️ THE ANTI-AI-SLOP DESIGN & ENGINEERING MANIFESTO
## Sổ Tay Diệt "AI Slop" Trong Tối Ưu Giao Diện Web & Desktop App
> **Nguồn gốc tài liệu**: Đúc kết từ 100+ giờ thực chiến, gỡ lỗi và tinh chỉnh giao diện trên **DeepFocus OS (v5.0.0)**.  
> **Mục đích**: Làm kim chỉ nam bất biến cho toàn bộ nhà phát triển, designer và AI agents khi xây dựng giao diện ứng dụng hiệu suất cao, loại bỏ triệt để cảm giác "AI tạo ra rẻ tiền" (AI Slop).

---

## 🛑 ĐỊNH NGHĨA: "AI SLOP" TRONG GIAO DIỆN LÀ GÌ?

> **AI Slop trong UI/UX** không chỉ là những ngón tay dị dạng của tranh vẽ AI. Trong thiết kế web app, **AI Slop là sự lười biếng về mặt kiến trúc thị giác**:  
> Những giao diện nhìn lướt qua trên ảnh mockup thì hào nhoáng, nhưng khi đưa vào sử dụng thực tế thì **vỡ nét, co rúm chữ, tràn khung, font cọc cạch trên Windows, nhồi nhét icon vô nghĩa, và code theo kiểu "chỉ chạy khi điều kiện hoàn hảo" (happy-path coding)**.

Dưới đây là 7 quy chuẩn thép được rút ra trực tiếp từ các bài học xương máu của DeepFocus OS.

---

## 1. 🔤 TYPOGRAPHY: CHỐNG NÉN CHỮ MÙ QUÁNG & LẠM DỤNG MONOSPACE THÔ

### ❌ Căn bệnh AI Slop thường gặp:
1. **Ép `letter-spacing: -0.025em` toàn cục**: AI rất thích thêm thuộc tính nén chữ này vào thẻ body hoặc `*`. Kết quả: Các chữ in hoa in đậm (`FOCUS`, `GYM`, `BREAK`, `JOURNALING`) bị co rúm, các nét dính chùm vào nhau như lỗi render ma trận.
2. **Lạm dụng `font-mono` cho các con số trên Windows**: AI mặc định đặt `font-mono` cho đồng hồ, số tiền, chỉ số KPI. Trên macOS có thể nhìn thấy SF Mono, nhưng trên Windows nếu không cài JetBrains Mono thì trình duyệt sẽ rơi về `Courier New` hoặc `Consolas` — những font pixel thô kệch từ thập niên 90, tạo cảm giác chắp vá, nghiệp dư.

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Quy tắc Thang Letter-Spacing 3 Tầng**:
   - **Tiêu đề lớn (`h1`, `h2`, `h3`)**: `letter-spacing: -0.02em` (tạo sự dứt khoát, quyền lực).
   - **Nội dung văn bản / Tên Task / Thẻ Card**: `letter-spacing: -0.01em` (thoáng mắt, êm dịu).
   - **Text In hoa / Badges / Pills (`uppercase`)**: **Bắt buộc dùng `letter-spacing: 0.04em`** để các con chữ có khoảng thở, đứng độc lập và sang trọng.
2. **Kỹ thuật Tabular Sans (Chuẩn hóa số liệu không cần Monospace thô)**:
   - Tuyệt đối không dùng font Monospace terminal cho dashboard tài chính hay đồng hồ executive.
   - Sử dụng font hiện đại (`Plus Jakarta Sans` hoặc `Inter`) kết hợp đặc tính CSS số học thẳng hàng:
     ```css
     font-variant-numeric: tabular-nums lining-nums;
     font-feature-settings: "tnum" 1, "lnum" 1;
     ```
   - *Kết quả*: Mọi con số đều có độ rộng bằng nhau tuyệt đối, nhảy số mượt mà mà vẫn giữ trọn vẹn vẻ thanh lịch hiện đại của Swiss Design.

---

## 2. 📐 BỐ CỤC & TỶ LỆ: TRÁNH "CRAMPED OVERFLOW" & BẪY HỘP LỒNG HỘP

### ❌ Căn bệnh AI Slop thường gặp:
1. **Nhồi nhét nút bấm dày đặc vào khung hẹp**:
   - *Trường hợp thực tế*: Thanh panel Mini Timer (rộng 260px) từng bị AI nhồi: Badge `FOCUS` màu trắng to đùng, tên task, kèm 3 icon tí hon liên tiếp (Pin, Minimize, Close). Hậu quả: Tên công việc bị cắt cụt ngủn thành `2. Feedbacks Crea...`, giao diện trông bức bối như một tiện ích lỗi thời.
2. **Fixed width gây bẻ gãy từ vô lý**: Cột 260px bị cố định khiến cụm nhãn thời gian bị ngắt đôi dòng thảm họa (`ES` xuống dòng `T:`) và nút chọn đè sang ô bên cạnh.
3. **Cắt cụt Placeholder**: Gõ placeholder quá dài khiến trên màn hình nhỏ bị cụt: `Add week objective...` -> `Add week obje...`.

```
❌ AI SLOP PANEL (Cramped & Chopped):
┌──────────────────────────────────────────────┐
│ [🔥 FOCUS] 2. Feedbacks Crea...  📌  ↗  ✕   │ ➔ Tên task bị đè bẹp, 3 nút nhồi nhét
│ 60:00                     (▶) [+5m]          │ ➔ Nút tròn cạnh nút vuông cọc cạch
└──────────────────────────────────────────────┘

✅ SWISS CLEAN PANEL (Balanced & Breathing):
┌──────────────────────────────────────────────┐
│ [● Focus]  2. Feedbacks Creation Flow    ✕   │ ➔ Tự do co giãn (flex-1 min-w-0), chỉ 1 nút cần thiết
│ 60:00                     (▶)  ( +5m )       │ ➔ Đồng bộ chiều cao h-7, cùng bán kính bo tròn
│ ───────────────────────────────────────────  │ ➔ Thanh tiến độ mỏng tinh tế
└──────────────────────────────────────────────┘
```

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Nguyên tắc "Tối giản nút bấm ngoại vi" (Minimal Action Footprint)**:
   - Khi ở cửa sổ nổi ngoài desktop: Chỉ giữ lại **duy nhất nút Close (`✕`)**. Không để nút Pin hay nút Minimize vì cửa sổ đã đang nổi rồi.
   - Nhường toàn bộ không gian cho dữ liệu quan trọng nhất: Áp dụng `flex-1 min-w-0` cho tên task để tự động mở rộng tối đa.
2. **Co giãn linh hoạt bằng `flex-wrap gap-1.5`**: Mọi nhóm nút chọn thời gian/trạng thái luôn dùng co giãn tự động và bo tròn (`rounded-full`), không fix cứng chiều rộng.
3. **Đồng bộ hóa hình học (Geometric Symmetry)**:
   - Các nút đứng cạnh nhau phải có cùng chiều cao (ví dụ: Nút Play `h-7 w-7` đi cùng nút `+5m` có `h-7 px-2.5 rounded-full`). Không bao giờ đặt một nút vuông cạnh một nút tròn mà không có sự liên kết về bán kính bo góc.

---

## 3. 🎨 MÀU SẮC & VẬT LIỆU: BẢNG MÀU THỤY SĨ VS GRADIENT NEON RÁC

### ❌ Căn bệnh AI Slop thường gặp:
1. **Lạm dụng Gradient Tím/Hồng Neon**: AI mặc định nghĩ giao diện "hiện đại" là phải dùng gradient tím xanh hồng neon lòe loẹt kiểu landing page crypto 2021.
2. **Badge trắng toát chói mắt (`bg-white text-black`)**: Tạo một khối màu trắng đặc dán lên nền tối, hút toàn bộ sự chú ý của mắt người dùng khỏi con số thời gian và nội dung chính.
3. **Glassmorphism mờ đục, viền dày**: Dùng viền trắng thô `border-white/40` khiến các thẻ trông như những tấm nhựa đục rẻ tiền.

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Bảng màu Swiss Dark Canvas có chiều sâu**:
   - **Canvas nền chính**: Onyx `#0b0c10` (đen điện ảnh sâu thẳm, dịu mắt làm việc ban đêm).
   - **Thẻ Card Surface**: Graphite `#12141a` với viền mờ `border: 1px solid rgba(255, 255, 255, 0.08)`.
   - **Bề mặt con (Inner Card)**: `#0e1015` với viền `rgba(255, 255, 255, 0.05)`.
   - **Màu điểm nhấn (Single Accent)**: Electric Cyan `#1591DC` sắc sảo, hoặc Emerald dịu nhẹ cho trạng thái hoàn thành.
2. **Status Indicator mờ thay cho Badge đặc**:
   - Thay vì badge trắng đặc chói lóa: Dùng **Pill nền mờ 10% kèm chấm phát sáng nhịp nhàng**:
     ```tsx
     <div className="bg-white/10 text-zinc-200 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1.5">
       <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
       <span>Focus</span>
     </div>
     ```
3. **Chiều sâu xúc giác bằng Hạt Cát Điện Ảnh (Tactile Noise Layer)**:
   - Sử dụng lớp `.noise-overlay` mỏng 2.5% opacity với hạt SVG fractalNoise để khử hiện tượng phân tầng màu (color banding) trên màn hình OLED và tạo cảm giác cao cấp như phim nhựa 35mm.

---

## 4. 🔲 ICONOGRAPHY: TIÊU DIỆT TOÀN BỘ EMOJI THÔ TRONG BẢNG DỮ LIỆU

### ❌ Căn bệnh AI Slop thường gặp:
- AI rất hay chèn emoji màu mè (`⏱`, `🔥`, `📅`, `💡`, `💰`, `🚀`, `🎯`) trực tiếp vào tiêu đề thẻ, cột dữ liệu hoặc nút bấm hệ thống. Trên mỗi hệ điều hành (Windows, Android, iOS), emoji render một kiểu khác nhau, tạo cảm giác như một bot Discord nghiệp dư hoặc app trẻ em.

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **100% Vector SVG Line Icons (Lucide React)**:
   - Thống nhất một bộ icon duy nhất với nét mảnh đồng bộ (`stroke-width: 1.5 - 2px`).
   - Kích thước chuẩn hóa theo tỷ lệ: `w-3 h-3` cho badge, `w-3.5 h-3.5` cho nút phụ, `w-4 h-4` cho nút chính.
2. **Màu sắc Icon đồng bộ theo bối cảnh**:
   - Mặc định: `text-zinc-400`, khi hover chuyển sang `text-white`.
   - Khi kích hoạt: Dùng màu accent `#1591DC` hoặc `text-emerald-400`.

---

## 5. 💻 TÍCH HỢP HỆ ĐIỀU HÀNH: LOẠI BỎ THANH TIÊU ĐỀ TRẮNG CỦA WINDOWS

### ❌ Căn bệnh AI Slop thường gặp:
- Khi tạo cửa sổ Picture-in-Picture hoặc cửa sổ nổi desktop, AI dùng lệnh mở cửa sổ mặc định. Kết quả trên Windows:
  - Xuất hiện thanh titlebar màu xám trắng chói lóa của Windows 10/11 với 3 nút Minimize/Maximize/Close xấu xí.
  - Bên trong là một card màu đen bo góc, tạo ra hiện tượng **"Hộp đen nằm lọt thỏm trong khung cửa sổ chữ nhật màu xám"**.

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Trên Electron Native Desktop**:
   - Sử dụng cửa sổ **Frameless 100%**:
     ```javascript
     miniTimerWindow = new BrowserWindow({
       frame: false,             // Triệt tiêu 100% thanh titlebar & viền Windows
       transparent: true,        // Xuyên thấu nền 4 góc bo tròn
       alwaysOnTop: true,        // Luôn nổi trên Premiere, Photoshop, Slack
       skipTaskbar: true,        // Không làm rối thanh tác vụ
       backgroundColor: '#00000000',
       webPreferences: { preload: path.join(__dirname, 'preload.cjs') }
     });
     ```
   - Kích hoạt kéo thả bằng CSS: `-webkit-app-region: drag` trên thân thẻ và `no-drag` trên các nút bấm.
2. **Trên Web Document Picture-in-Picture**:
   - Tự động inject thẻ meta dark theme vào cửa sổ con để Windows đồng bộ màu titlebar về màu đen `#09090b`:
     ```typescript
     const metaColorScheme = document.createElement('meta');
     metaColorScheme.name = 'color-scheme';
     metaColorScheme.content = 'dark';
     win.document.head.appendChild(metaColorScheme);
     ```
   - Thiết lập `disallowReturnToOpener: true` để loại bỏ nút bấm "Back to tab" cồng kềnh mặc định của Chrome.

---

## 6. 🌐 NGÔN NGỮ & COPYWRITING: KHÔNG BAO GIỜ PHA TRỘN "NỬA NẠC NỬA MỠ"

### ❌ Căn bệnh AI Slop thường gặp:
- AI rất hay trộn lẫn ngôn ngữ trên cùng một màn hình: `"Bắt đầu Focus (25 phút)"`, `"Ghim PiP"`, `"Đang bật widget"`, tooltip thì tiếng Việt nhưng nhãn nút thì tiếng Anh. Việc này làm ứng dụng mất đi tính chuyên nghiệp toàn cầu.
- Sử dụng các câu văn AI sáo rỗng vô nghĩa: *"Khai phóng tiềm năng vô hạn của bạn với ma trận hiệp lực..."*

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Đồng nhất 100% Tiếng Anh Chuẩn Quốc Tế**:
   - Các hành động ngắn gọn, dứt khoát: `Start`, `Pause`, `Reset`, `Add 5m`, `Dismiss`.
   - Tooltip rõ ràng: `Pin to Desktop (Picture-in-Picture)`, `Close mini timer`.
   - Trạng thái rõ ràng: `On` / `Off`, `Pinned` / `Pin PiP`, `Enabled` / `Blocked`.
2. **Định dạng tiền tệ chuẩn hóa toàn diện**:
   - Không để màn hình thì dùng chấm (`1.618.000 đ`), màn hình thì dùng phẩy.
   - Thống nhất định dạng: `toLocaleString('en-US') + ' ₫'` (Ví dụ: `1,618,000 ₫`).

---

## 7. 🛡️ KỸ THUẬT PHÒNG VỆ: NÓI KHÔNG VỚI "HAPPY-PATH" SLOP

### ❌ Căn bệnh AI Slop thường gặp trong Code:
1. **Lỗi Snapshot rỗng đè trắng dữ liệu**: Khi F5 hoặc rớt mạng, Firestore trả về `[]`. AI viết `if (data) setGoals(data)`, và thế là mảng rỗng `[]` đè trắng xóa toàn bộ dữ liệu người dùng tích lũy hàng tháng trời!
2. **Lỗi Autoplay Audio bị trình duyệt chặn**: AI gọi `new Audio().play()` khi hết giờ Pomodoro. Do người dùng đang làm việc ở tab khác, trình duyệt chặn autoplay và phát sinh lỗi âm thầm trong console mà không phát chuông.
3. **Mất định danh tài khoản**: AI gọi `saveGoal(item)` nhưng quên truyền `currentUser?.email`, dẫn đến dữ liệu lưu nhầm vào tài khoản mặc định.

### ✅ Tiêu chuẩn DeepFocus đã kiểm chứng:
1. **Kiến trúc Dual-Tier Persistence (Zero Data Loss Protocol)**:
   - **Tầng 1 (LocalStorage)**: Đọc đồng bộ tức thì 0ms ngay khi khởi tạo React (`useState(() => loadFromLocalStorage())`), không có độ trễ, không bị màn hình trắng giật.
   - **Tầng 2 (Cloud Firestore)**: Đồng bộ ngầm. **Tuyệt đối không cập nhật state nếu Firestore trả về mảng rỗng `[]` khi local đang có dữ liệu**.
2. **Singleton AudioContext Warm-up**:
   - Khởi tạo trước một `AudioContext` toàn cục.
   - Lắng nghe các tương tác đầu tiên của người dùng (`click`, `keydown`, `pointerdown`) để kích hoạt `resume()`, đảm bảo chuông luôn reo vang dù tab đang chạy ngầm cả tiếng đồng hồ.
3. **Cross-Window Realtime Sync**:
   - Sử dụng `window.addEventListener('storage', ...)` để khi người dùng tương tác ở Mini Timer ngoài Desktop hay App chính thì cả 2 cửa sổ đều phản hồi ngay lập tức mà không cần polling liên tục.

---

## 📋 CHECKLIST 10 ĐIỂM KIỂM SOÁT "ANTI-AI-SLOP" TRƯỚC KHI SHIP CODE

Mỗi khi hoàn thành một tính năng hoặc component mới, hãy tự đối chiếu với 10 câu hỏi sau:

- [ ] **1. Typography**: Có bị dính chữ in hoa không? Có dùng `letter-spacing: 0.04em` cho uppercase không?
- [ ] **2. Số liệu**: Có bị rơi về font Monospace thô pixel của Windows không? Đã bật `tabular-nums` chưa?
- [ ] **3. Bố cục**: Các chuỗi chữ động (tên task, ghi chú) có bị cắt cụt không? Đã dùng `flex-1 min-w-0` chưa?
- [ ] **4. Nút bấm**: Các nút đứng cạnh nhau có đồng bộ chiều cao và bo góc không? Có nút nào thừa thãi không?
- [ ] **5. Màu sắc**: Có bị chói mắt bởi badge trắng đặc không? Đã dùng bảng màu Swiss `#0b0c10` / `#12141a` chưa?
- [ ] **6. Icon**: Toàn bộ icon có phải là SVG mảnh (Lucide) không? Có bị sót emoji thô nào không?
- [ ] **7. Ngôn ngữ**: Đã chuẩn hóa 100% tiếng Anh súc tích chưa? Có bị lẫn lộn tiếng Việt không?
- [ ] **8. Cửa sổ**: Cửa sổ nổi có bị viền xám hay titlebar thô của Windows không?
- [ ] **9. Dữ liệu**: Khi bấm F5 tải lại trang, dữ liệu có hiển thị tức thì 0ms mà không bị giật nháy không?
- [ ] **10. Tự động kiểm thử**: Lệnh `npm run lint` và `npm run build` có đạt **0 lỗi tuyệt đối** không?

---
*Tài liệu này được lưu trữ tại `ANTI_AI_SLOP_GUIDE.md` và là quy chuẩn bắt buộc của DeepFocus OS.*

# 🧬 DEEP FOCUS OS — THE PRODUCT & DESIGN DNA BIBLE
> **Tài liệu chuẩn hóa toàn diện (The Master Guide)**: Tổng hợp toàn bộ Triết lý thiết kế, Quy chuẩn kỹ thuật, Bài học xương máu và Các lỗi đã giải quyết triệt để từ ngày 31/08/2026. Bất kỳ tính năng mới nào được phát triển trong tương lai **bắt buộc phải tuân thủ 100% các nguyên tắc trong tài liệu này ngay từ lần đầu tiên**.

---

## 1. 🏛️ TRIẾT LÝ CỐT LÕI (CORE PHILOSOPHY)

### 1.1 Nguyên lý "Extreme Clarity = Extreme Focus"
- **Không làm màu, chỉ tập trung vào hiệu suất**: Loại bỏ hoàn toàn các trang trí rườm rà, các bảng tính lồng ghép 20 tầng kiểu Notion cũ.
- **Một màn hình điều hành duy nhất (One-Screen Executive Ecosystem)**: Toàn bộ thông tin sinh tử của một người làm việc hiệu suất cao (Đồng hồ tập trung, Mục tiêu ngày/tuần, Ma trận thói quen, Dòng tiền chi tiêu, Nhật ký năng lượng) đều nằm trong tầm mắt.
- **Zero AI Slop**: Tuyệt đối không dùng chữ tạo sẵn vô nghĩa, không dùng font chữ biến dạng, không popup giật gân, không emoji thô kệch.

### 1.2 Bảng màu & Không gian thị giác Thụy Sĩ (Swiss Color Palette)
| Vai trò | Mã Màu Hex | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Nền Canvas chính** | `#0b0c10` | Màu đen Onyx điện ảnh sâu thẳm, dịu mắt khi làm việc ban đêm |
| **Thẻ Card Surface** | `#12141a` | Thẻ Graphite nổi với viền mờ `border: 1px solid rgba(255,255,255,0.08)` |
| **Thẻ Card lồng con** | `#0e1015` | Bề mặt phụ bên trong card với viền `border: 1px solid rgba(255,255,255,0.06)` |
| **Màu điểm nhấn (Accent)** | `#1591DC` | Electric Cyan sắc sảo cho nút bấm CTA, pill active, thanh tiến độ |
| **Chữ chính (Primary Text)** | `#ffffff` / `#ededf3` | Trắng sáng tương phản cao (≥ 4.5:1 ratio) |
| **Chữ phụ (Muted/Secondary)** | `#9496a1` | Xám thanh lịch cho mô tả, nhãn phụ, ngày tháng |
| **Hiệu ứng Film Grain** | `.noise-overlay` | Lớp hạt cát điện ảnh 2.5% opacity tạo chiều sâu xúc giác |
| **Chế độ sáng (Light Mode)** | Porcelain White | Trắng sứ tinh khiết, tương phản cao, không xám đục |

---

## 2. 🔤 QUY CHUẨN TYPOGRAPHY & CHỐNG "AI SLOP"

### ❌ Lỗi xương máu đã vượt qua:
> **Lỗi nén chữ toàn cục `-0.025em`**: Trước đây quy tắc `-0.025em` bị gán bừa bãi lên toàn bộ thẻ bằng `*`, khiến chữ in hoa (`GYM`, `JOURNALING`) bị co rúm lại, các chữ cái dính sát vào nhau nhìn như sản phẩm lỗi của AI.  
> **Lỗi font thứ cấp thô**: Dòng phụ `+ link goal` từng dùng font monospace pixel thô (`font-mono text-[9px]`) kèm thẻ `<select>` mặc định của hệ điều hành với mũi tên xám xấu xí.

### ✅ Quy chuẩn Typography bất biến:
1. **Font Family đồng nhất**:
   - `Neue Haas Grotesk Display Pro` / `Plus Jakarta Sans` / `Inter`.
   - Tuyệt đối không tự ý chèn font monospace vào các nhãn hiển thị thông thường.
2. **Khoảng cách ký tự (Letter-Spacing Scale)**:
   - **Headings (`h1`, `h2`, `h3`)**: `letter-spacing: -0.02em` (tạo sự dứt khoát, quyền lực).
   - **Body text / Đoạn văn / Task**: `letter-spacing: -0.01em` (dễ đọc, thoáng mắt).
   - **Text In hoa / Badges / Uppercase / Time Pills**: Bắt buộc dùng `letter-spacing: 0.04em` để các chữ cái đứng độc lập, không bị dính nét.
3. **Font thứ cấp tinh tế (Refined Secondary Typography)**:
   - Luôn sử dụng `font-sans text-[11px] font-normal text-[#9496a1]`.
   - Kết hợp các icon vector mảnh nhỏ gọn (ví dụ: `<Link2 className="w-2.5 h-2.5 text-[#1591DC]" />`).

---

## 3. 📐 QUY CHUẨN BỐ CỤC & GIAO DIỆN CO GIÃN (RESPONSIVE & NO-CLIPPING)

### ❌ Lỗi xương máu đã vượt qua:
> **Lỗi vỡ dòng `EST:` & Tràn viền `½day`**: Cụm chọn thời gian ước tính bị ép trên 1 hàng đơn hẹp trong cột 260px, khiến chữ `EST:` bị bẻ đôi dòng (`ES` / `T:`) và nút `½day` đè lấn sang cột kế bên.  
> **Lỗi cắt cụt Placeholder**: Dòng chữ quá dài `Add week objective...` bị khung hẹp cắt cụt thành `Add week obje...`.

### ✅ Quy chuẩn Bố cục bất biến:
1. **Pill bo tròn tự động co giãn (`flex-wrap`)**:
   - Mọi nhóm nút bấm lựa chọn thời gian/trạng thái luôn dùng `flex-wrap gap-1` và bo tròn kiểu Thụy Sĩ (`rounded-full`).
   - Sử dụng nhãn chuẩn quốc tế ngắn gọn: `15m`, `30m`, `1h`, `2h`, `4h` (thay vì ký tự phân số `½day`).
2. **Placeholder ngắn gọn, súc tích**:
   - `Add task for day...`, `Add task for week...`, `Add habit for month...` (hiển thị trọn vẹn 100% trên mọi kích thước màn hình).
3. **100% Icon Vector SVG**:
   - Tuyệt đối không dùng emoji thô (`⏱`, `🔥`, `📅`, `💡`) trên các bảng dữ liệu chuyên nghiệp.
   - Toàn bộ dùng icon vector của **Lucide React** với `strokeWidth={1.5}` đến `2` và màu sắc đồng bộ.

---

## 4. 💾 QUY CHUẨN LƯU TRỮ DỮ LIỆU BẤT BIẾN (ZERO DATA LOSS ARCHITECTURE)

### ❌ Lỗi xương máu đã vượt qua:
> **Lỗi F5 bị mất dữ liệu / Reset trắng**:  
> 1. Hàm `loadFromLocalStorage` đọc chuỗi thô nhưng quên `JSON.parse()`, dẫn tới biến bị `undefined` và kích hoạt cơ chế fallback đè dữ liệu mặc định.  
> 2. `useState` khởi tạo ban đầu là `null` và `false`, tạo khoảng trễ bất đồng bộ khi F5 khiến React nạp nhầm phiên khách trống.  
> 3. Các hàm `saveGoal`, `saveHabit`, `saveExpense` không truyền `currentUser.email`, khiến dữ liệu bị lưu nhầm vào `default_user`.

### ✅ Quy chuẩn Lưu trữ bất biến:
1. **Khởi tạo đồng bộ tức thì (0ms Synchronous Mount)**:
   - `currentUser`, `isAuthenticated` và toàn bộ dữ liệu (`goals`, `habits`, `journal`, `expenses`, `scratchpad`) **phải được đọc và parse đồng bộ từ LocalStorage ngay trong hàm khởi tạo của `useState`**.
   - F5 là nạp trang hiển thị ngay tại millisecond đầu tiên, 0ms latency, không chớp màn hình.
2. **Kiến trúc lưu trữ 2 tầng (Dual-Tier Persistence)**:
   - **Tầng 1 (LocalStorage)**: Ghi tức thì vào `localStorage` theo cả 2 khóa: khóa cá nhân (`df_goals_todo_${email}`) và khóa dự phòng (`df_goals_todo`).
   - **Tầng 2 (Cloud Firestore)**: Tự động đồng bộ ngầm lên `users/${email}/...`.
3. **Bảo vệ khi rớt mạng / Timeout**:
   - Đặt giới hạn timeout cho Firestore (3-4 giây). Nếu mạng chậm hoặc mất kết nối, hệ thống **luôn giữ 100% dữ liệu LocalStorage**, tuyệt đối không được xóa trắng.
4. **An toàn Parse JSON**:
   - Mọi câu lệnh `JSON.parse()` phải nằm trong `try...catch` và kiểm tra `Array.isArray()` trước khi gán.
5. **Gắn chặt ID người dùng**:
   - Mọi hàm thao tác dữ liệu đều phải truyền `currentUser?.email` vào các hàm `save...` và `delete...`.

---

## 5. 🚫 QUY CHUẨN DỮ LIỆU THỰC — TUYỆT ĐỐI KHÔNG DÙNG MOCKUP CỨNG

### ❌ Lỗi xương máu đã vượt qua:
> **Lỗi lịch trình giả lập `timeBlocks` trên Dashboard**: Trang Executive Dashboard trước đây có mảng `timeBlocks` gán cứng (`08:00 Morning Setup...`, `09:30 Deep Focus...`), khiến người dùng thấy những mục lạ không phải do mình tạo.

### ✅ Quy tắc bất biến:
- **100% hiển thị từ dữ liệu người dùng thực tế**:
  - Bảng "Today's Daily Tasks" lấy trực tiếp từ `goals.filter(g => g.timeframe === 'daily')`.
  - Bảng "Strategic Objectives" lấy trực tiếp từ `goals.filter(g => g.timeframe !== 'daily')`.
  - Nếu chưa có dữ liệu, hiển thị Empty State sạch sẽ với nút bấm điều hướng, **tuyệt đối không hardcode dữ liệu mẫu vào view**.

---

## 6. 🧩 HỆ SINH THÁI 5 MODULE CỐT LÕI (THE 5 CORE PILLARS)

1. **Header Deep Work Timer**:
   - Đồng hồ Pomodoro 3 chế độ: `Focus` (25-90m), `Short Break` (3-10m), `Long Break` (15-30m) hoặc tùy chỉnh.
   - Đếm ngược trực tiếp trên tiêu đề Tab trình duyệt (`🎯 24:59 Deep Focus`).
   - Chuông Web Audio API êm dịu, không giật mình.
2. **Tasks Hub & Review Protocol**:
   - Phân tầng `Day` → `Week` → `Month` → `Year`.
   - Huy hiệu thời gian Swiss Pills (`15m`, `30m`, `1h`, `2h`, `4h`).
   - Lịch tháng Compact Dots kèm thanh kiểm tra chi tiết (Day Inspector).
   - Khung Review 3 câu hỏi (Thắng lợi lớn nhất, Điểm nghẽn lớn nhất, Mục tiêu số 1) với nút 1-Click chuyển thành Task.
3. **Ma trận Thói quen 31 ngày (Habit Matrix)**:
   - Check-in 31 ngày với tính toán `% Consistency`.
   - Tính năng liên kết thói quen với mục tiêu lớn (Goal-Habit Linker).
4. **Sổ cái Tài chính & Biểu đồ Timeline 320px (Financial Ledger)**:
   - Biểu đồ Bar Chart 320px trực quan hóa tốc độ đốt tiền theo ngày trong tháng.
   - 4 thẻ KPI Executive: Tổng chi, Tốc độ chi/ngày, Khoản chi lớn nhất, Danh mục chiếm nhiều nhất.
   - Biểu đồ Doughnut phân bổ danh mục và hỗ trợ đa tiền tệ.
5. **Nhật ký Năng lượng (Daily Journal)**:
   - Đánh giá năng lượng sinh học 1-5 sao kèm trình soạn thảo Markdown.

---

## 7. 🚀 CHECKLIST KIỂM THỬ & ĐÓNG GÓI BẮT BUỘC TRƯỚC KHI BÁO HOÀN THÀNH

Mỗi khi thực hiện bất kỳ chỉnh sửa nào, lập trình viên hoặc AI Agent **bắt buộc chạy đủ 4 bước**:

```bash
# Bước 1: Biên dịch kiểm tra TypeScript & Vite (0 lỗi)
npm run build

# Bước 2: Đồng bộ bản build sang Desktop App Electron
xcopy /E /I /Y dist dist-app\win-unpacked\resources\app\dist

# Bước 3: Đẩy mã nguồn lên Git repository để Vercel tự động deploy
git add -A
git commit -m "mô tả thay đổi rõ ràng theo chuẩn Conventional Commits"
git push origin main

# Bước 4: Kiểm tra F5 & Ctrl+F5 trực tiếp trên trình duyệt
# Đảm bảo dữ liệu nhập vào vẫn tồn tại nguyên vẹn 100% sau khi reload.
```

---
*Bản tài liệu DNA này là Hiến pháp phát triển của Deep Focus OS — Đảm bảo mọi phiên bản về sau luôn đạt độ hoàn thiện cao nhất.*

# 🚀 DEEPFOCUS OS — PROGRESS & HANDOFF MASTER DOCUMENT
> **Tài liệu Bàn giao & Theo dõi Tiến độ Toàn diện (Living Handoff Document)**  
> *Được cập nhật thường xuyên sau mỗi phiên làm việc để đảm bảo tính liên tục, minh bạch và nhất quán kỹ thuật giữa các phiên phát triển.*

---

## 📌 1. THÔNG TIN DỰ ÁN & TRẠNG THÁI HIỆN TẠI (PROJECT METADATA)

| Thông số | Giá trị hiện tại | Ghi chú |
| :--- | :--- | :--- |
| **Tên sản phẩm** | **DeepFocus OS** (Self-Development OS) | Hệ điều hành quản trị cá nhân & làm việc sâu |
| **Phiên bản (Version)** | **v5.0.0** | Bản hỗ trợ song song Web + Desktop App (.exe) |
| **Git Repository** | `phucnguyen36/phat-trien-ban-than` | Nhánh chính: `main` |
| **Trạng thái Build** | ✅ `tsc --noEmit` (0 lỗi), `vite build` (0 lỗi) | Đã kiểm thử tự động |
| **Công nghệ cốt lõi** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Electron, Firebase | Kiến trúc 2 tầng (Local 0ms + Cloud Firestore) |
| **Mô hình kinh doanh** | Freemium + Whop Commercial Licensing | $29/tháng & $99/6 tháng |
| **Lần cập nhật cuối** | **23/10/2026** | Pomodoro HUD & Notification Overhaul |

---

## 🧭 2. VỊ TRÍ HIỆN TẠI TRONG KẾ HOẠCH 7 NGÀY (7-DAY LAUNCH PLAN STATUS)

```
[Day 1: Core UX] ➔ [Day 2: Cloud Sync] ➔ [Day 3: Pomodoro Engine] ➔ [Day 4: Whop Monetization] ➔ [Day 5: Desktop & Mini Timer] ➔ [Day 6: Webhooks & Whop Flow] ➔ [Day 7: Launch]
      ✅                    ✅                     ✅                          ✅                                ✅                                 🔄 ĐANG LÀM                     ⏳ CHUẨN BỊ
```

### Chi tiết trạng thái từng ngày:
- [x] **Day 1 — Core UX & Swiss Design Standard**: Hoàn thiện toàn bộ triết lý thiết kế Thụy Sĩ (Onyx `#0b0c10`, Graphite `#12141a`, Electric Cyan `#1591DC`), bộ font chuẩn `Plus Jakarta Sans`, loại bỏ hoàn toàn lỗi font monospace vỡ nét và typography AI slop.
- [x] **Day 2 — Dual-Tier Persistence (Zero Data Loss)**: Xây dựng cơ chế tải tức thì 0ms từ `localStorage` kết hợp đồng bộ hai chiều thời gian thực với Cloud Firestore. Khắc phục triệt để lỗi mất dữ liệu khi F5 hoặc rớt mạng.
- [x] **Day 3 — Deep Work Pomodoro Station & Audio Engine**: Trạm tập trung toàn diện với âm thanh bát Tây Tạng (Tibetan Singing Bowl Chime), mở khóa Autoplay AudioContext, thông báo hệ thống Native OS Notification và cảnh báo chớp nháy tab nền.
- [x] **Day 4 — Commercial Whop Monetization & Licensing Engine**: 
  - Khóa tính năng theo mô hình Freemium (Miễn phí Pomodoro & Journal; khóa Tasks, Habits, Expenses yêu cầu Pro).
  - Cập nhật chuẩn giá mới: **$29/tháng** (Monthly Pass) và **$99/6 tháng** (6 Months Pass).
  - Hỗ trợ kích hoạt License Key tức thì (tự động phát hiện gói tháng và kiểm tra hạn 30 ngày).
- [x] **Day 5 — Desktop App & Frameless Floating Mini Timer (Cực kỳ tinh tế)**:
  - Cửa sổ Electron Mini Timer hoàn toàn **không có khung viền Windows (`frame: false`)**, trong suốt (`transparent: true`), ghim nổi (`alwaysOnTop: true`), hỗ trợ kéo thả (`-webkit-app-region: drag`).
  - Hỗ trợ Web Document Picture-in-Picture với dark color-scheme sạch sẽ.
  - **Tái thiết kế toàn diện Mini Timer HUD**: Giảm kích thước xuống `280px × 78px` cực kỳ gọn gàng, thanh lịch, loại bỏ hoàn toàn font thô monospace, thay bằng sans tabular số chuẩn cao cấp, dải tiến độ hairline 2px ở mép đáy, hỗ trợ thu gọn thành mini pill capsule.
  - **Đại tu hệ thống thông báo (Notifications & Completion Alert)**:
    - Loại bỏ hoàn toàn modal đen che kín toàn màn hình khi kết thúc phiên. Thay thế bằng **Floating Notification Banner** nổi ở góc phải trên với thanh đếm ngược tự động đóng 15s (tự tạm dừng khi rê chuột) và nút bấm trực tiếp chuyển phiên.
    - Tích hợp thông báo Native Windows qua IPC Electron (`electronAPI.showNotification`), hiển thị đúng icon ứng dụng, không lo bị Windows Action Center chặn hay nuốt thông báo.
    - Xóa sạch mọi emoji slop (`🎯`, `🔔`, `⚡`) trong thông báo hệ thống và tiêu đề tab nền, đưa về chuẩn typography Anh ngữ chuyên nghiệp.
- [ ] **Day 6 — Whop Purchase Redirect Flow & Webhook Verification (TIÊU ĐIỂM TIẾP THEO)**:
  - Kiểm tra và tinh chỉnh trải nghiệm khách hàng sau khi thanh toán trên Whop: Hướng dẫn khách lấy License Key hoặc tự động kích hoạt tài khoản.
  - Hoàn thiện trang Landing Page và đường link thanh toán đồng bộ.
- [ ] **Day 7 — Packaging Portable .exe & Official Distribution**:
  - Đóng gói file cài đặt / portable Windows `.exe`.
  - Kiểm thử toàn diện trên môi trường sạch trước khi phát hành rộng rãi.

---

## 🏗️ 3. MA TRẬN TIẾN ĐỘ TÍNH NĂNG (FEATURE PROGRESS MATRIX)

| Module | Chức năng | Trạng thái | Chi tiết triển khai |
| :--- | :--- | :---: | :--- |
| **Desktop App** | Frameless Mini Window | ✅ 100% | Không khung Windows, nền trong suốt, kéo thả mượt mà |
| | Document Picture-in-Picture | ✅ 100% | Tự động inject dark theme-color & color-scheme `#09090b` |
| | Cross-Window Realtime Sync | ✅ 100% | Đồng bộ 2 chiều tức thì giữa App chính và Mini Window qua `StorageEvent` & Electron IPC |
| | Standalone Mini Route | ✅ 100% | Tải tức thì `?mini=true` không tốn tài nguyên chạy ngầm full app |
| **Deep Work Timer** | Pomodoro Core Engine | ✅ 100% | Đếm giờ dựa trên timestamp chống nghẽn tab khi ẩn |
| | Background Audio Chime | ✅ 100% | Singleton AudioContext mở khóa tương tác chống chặn autoplay |
| | OS & Tab Notifications | ✅ 100% | Desktop Notification + Chớp nháy tiêu đề tab nền |
| | Session Completion Modal | ✅ 100% | Modal tổng kết phiên đẹp mắt, điều hướng phiên nghỉ tự động |
| | 100% English UI | ✅ 100% | Toàn bộ nhãn, tooltip, thông báo chuẩn tiếng Anh |
| **Tasks Hub** | Daily / Weekly / Monthly / Yearly | ✅ 100% | Quản lý mục tiêu theo khung thời gian |
| | Drag & Drop Priority Reordering | ✅ 100% | Kéo thả sắp xếp thứ tự ưu tiên trong Columns, Board và Table |
| | Database Filter & Multi-Sort | ✅ 100% | Lọc theo status, priority, context tag và sort 9 tiêu chí |
| **Habit Tracker** | Ma trận 30 ngày | ✅ 100% | Theo dõi thói quen, streak, hoàn thành theo ngày |
| **Daily Journal** | Stoic Energy & Reflection | ✅ 100% | Ghi chép năng lượng, bài học, nhật ký hàng ngày |
| **Expense Ledger**| Sổ thu chi cá nhân | ✅ 100% | Quản trị dòng tiền, phân loại danh mục, định dạng `1,618,000 ₫` |
| **Licensing** | Whop Integration | ✅ 100% | Đổi giá $29/tháng và $99/6 tháng |
| | ProFeatureLockGate | ✅ 100% | Khóa tính năng Pro theo chuẩn Freemium |
| | License Key Activation | ✅ 100% | Kích hoạt bản quyền qua Firebase với tự động kiểm tra hạn gói |
| | Admin Dashboard | ✅ 100% | Quản lý người dùng, cấp quyền Pro thủ công, xem số liệu |

---

## 🏛️ 4. KIẾN TRÚC KỸ THUẬT & CÁC QUYẾT ĐỊNH CỐT LÕI (TECHNICAL ARCHITECTURE)

### 4.1 Cửa sổ nổi Mini Timer (Frameless Electron Window & Document PiP)
- **Electron Native**:
  - `electron/main.js`: Sử dụng `BrowserWindow` với `frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, backgroundColor: '#00000000'`.
  - `electron/preload.cjs`: Cung cấp cầu nối an toàn `window.electronAPI` (`openMiniTimer`, `closeMiniTimer`, `toggleMiniTimer`, `onMiniTimerStatus`).
  - Thẻ `MiniTimerCard` áp dụng thuộc tính CSS `-webkit-app-region: drag` cho thân thẻ và `no-drag` cho các nút bấm điều khiển.
- **Web Browser Fallback**:
  - Sử dụng Chrome Document Picture-in-Picture (`documentPictureInPicture.requestWindow`).
  - Thiết lập `<meta name="color-scheme" content="dark">`, `<meta name="theme-color" content="#09090b">`, `disallowReturnToOpener: true` và layout tràn viền để loại bỏ hoàn toàn viền xám mặc định của Windows.

### 4.2 Cơ chế đồng bộ đa cửa sổ (Cross-Window Realtime Synchronization)
- Cửa sổ Mini Timer và Cửa sổ ứng dụng chính được đồng bộ trạng thái hai chiều 100% qua sự kiện `window.addEventListener('storage', handleStorageChange)`:
  - Khi bắt đầu, tạm dừng, đổi task hoặc bấm `+5m` ở bất kỳ cửa sổ nào, cửa sổ còn lại lập tức nhận diện và cập nhật trạng thái tương ứng.

### 4.3 Tách biệt Route tải nhanh (Zero-Delay Standalone Route)
- Khi nạp với tham số URL `?mini=true`, hệ thống chỉ render duy nhất component `<MiniTimerStandalone />` bên trong `<PomodoroProvider>`:
  - Không tải 2,300 dòng code của Dashboard chính, không khởi tạo biểu đồ, không gọi Firebase thừa thãi.
  - Đảm bảo thời gian mở cửa sổ con đạt mức mili-giây, tiêu tốn cực ít RAM và CPU.

---

## 📝 5. NHẬT KÝ COMMITS GẦN NHẤT (RECENT COMMITS CHANGELOG)

- `c0da8ac` — **feat: integrate Anti-AI-Slop Manifesto and 7-Day Plan modal into app**  
  *Tích hợp trực tiếp Sổ tay Anti-AI-Slop, 10 tiêu chuẩn kiểm định Quality Gate và Kế hoạch 7 ngày vào giao diện App (Sidebar, Settings modal, Command Palette Ctrl+K, phím tắt Ctrl+M).*
- `98f33dd` — **docs: add comprehensive ANTI_AI_SLOP_GUIDE.md manifesto**  
  *Đúc kết 7 quy chuẩn thép diệt AI Slop từ quá trình thiết kế DeepFocus OS.*
- `a5551af` — **docs: add living HANDOFF.md progress master document**  
  *Tạo tài liệu bàn giao và theo dõi tiến độ tổng thể kế hoạch 7 ngày.*
- `534baf9` — **refactor(timer): clean up mini timer panel layout and enforce full English UI**  
  *Tinh giản thanh panel mini timer theo chuẩn Swiss/Linear, loại bỏ nút rườm rà, nhường không gian cho tên task, chuyển đổi 100% ngôn ngữ sang tiếng Anh.*
- `1e94ecf` — **feat(timer): make floating mini timer clean and frameless without windows titlebar**  
  *Cấu hình Electron frameless và Web PiP dark theme-color, loại bỏ hoàn toàn khung viền Windows.*
- `76f5ce0` — **feat(timer): add floating mini timer at bottom right with OS-level Picture-in-Picture always-on-top mode**  
  *Xây dựng widget đồng hồ mini góc phải với khả năng ghim nổi ra ngoài màn hình desktop.*
- `c75bd42` — **fix(timer): fix background audio chime autoplay block, add system notifications, tab flasher and in-app completion modal**  
  *Vá lỗi autoplay âm thanh tab nền, bổ sung thông báo Native OS và modal hoàn thành phiên.*
- `e157052` — **feat(pricing): update pricing tiers to $29/month and $99 for 6 months**  
  *Cập nhật gói giá thương mại trên Whop: $29/tháng và $99/6 tháng.*
- `4db7915` — **feat(license): add monthly and lifetime activation support with auto-expiration check**  
  *Hỗ trợ kích hoạt License Key cho cả gói tháng và gói trọn đời với kiểm tra hạn dùng tự động.*

---

## 🎯 6. KẾ HOẠCH HÀNH ĐỘNG KẾ TIẾP (NEXT ACTIONS)

1. **Hoàn thiện luồng thanh toán Whop (Post-Purchase Experience)**:
   - Làm rõ trải nghiệm người dùng sau khi ấn thanh toán thành công trên Whop (Màn hình cảm ơn của Whop hiển thị gì? Hướng dẫn người dùng nhận License Key và dán vào app ra sao?).
   - Đảm bảo khách hàng không bị bỡ ngỡ sau khi thanh toán.
2. **Kiểm tra đồng bộ giá trên Landing Page & App**:
   - Rà soát toàn bộ các vị trí hiển thị giá trên trang chủ, landing page và trong ứng dụng, đảm bảo thống nhất đồng thời: **$29/tháng** và **$99/6 tháng**.
3. **Đóng gói bản Windows Desktop (.exe)**:
   - Chạy lệnh `npm.cmd run dist:exe` để xuất file Windows portable `.exe`, kiểm thử tính năng Frameless Mini Timer trên môi trường máy tính thực tế.

---

## 📖 7. HƯỚNG DẪN VẬN HÀNH & CẬP NHẬT FILE HANDOFF NÀY (MAINTENANCE PROTOCOL)

> [!IMPORTANT]
> **Quy tắc bắt buộc cho mọi phiên làm việc tiếp theo**:
> 1. **Trước khi bắt đầu task mới**: Đọc file này để nắm chính xác dự án đang ở bước nào trong kế hoạch 7 ngày.
> 2. **Sau khi hoàn thành tính năng hoặc sửa lỗi**:
>    - Cập nhật mục **2. VỊ TRÍ HIỆN TẠI TRONG KẾ HOẠCH 7 NGÀY**.
>    - Bổ sung tính năng mới vào **3. MA TRẬN TIẾN ĐỘ TÍNH NĂNG**.
>    - Ghi lại mã commit và tóm tắt ngắn vào **5. NHẬT KÝ COMMITS GẦN NHẤT**.
>    - Cập nhật **Lần cập nhật cuối** và đẩy file này cùng mã nguồn lên git.

### Các lệnh vận hành dự án:
```powershell
# Chạy môi trường Web Development
npm.cmd run dev

# Chạy môi trường Desktop App Electron Development
npm.cmd run electron:dev

# Kiểm tra lỗi Typescript
npm.cmd run lint

# Build bản Web Production
npm.cmd run build

# Đóng gói Windows Desktop Portable .exe
npm.cmd run dist:exe
```

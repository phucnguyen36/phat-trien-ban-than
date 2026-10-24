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
| **Trạng thái Build** | ✅ `vite build` (0 lỗi) + `dist-app/DeepFocus 5.0.0.exe` | Đã xuất bản cài đặt & portable .exe |
| **Công nghệ cốt lõi** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Electron, Firebase | Kiến trúc 2 tầng (Local 0ms + Cloud Firestore) |
| **Mô hình kinh doanh** | Freemium + Whop Commercial Licensing | $29/tháng & $99/6 tháng |
| **Lần cập nhật cuối** | **24/10/2026** | Hoàn tất tự động hóa A1-A5 (Day 6 & Day 7) |

---

## 🧭 2. VỊ TRÍ HIỆN TẠI TRONG KẾ HOẠCH 7 NGÀY (7-DAY LAUNCH PLAN STATUS)

```
[Day 1: Core UX] ➔ [Day 2: Cloud Sync] ➔ [Day 3: Pomodoro Engine] ➔ [Day 4: Whop Monetization] ➔ [Day 5: Desktop & Mini Timer] ➔ [Day 6: Webhooks & Whop Flow] ➔ [Day 7: Launch]
      ✅                    ✅                     ✅                          ✅                                ✅                                    ✅                       ✅ SẴN SÀNG
```

### Chi tiết trạng thái từng ngày:
- [x] **Day 1 — Core UX & Swiss Design Standard**: Hoàn thiện toàn bộ triết lý thiết kế Thụy Sĩ (Onyx `#0b0c10`, Graphite `#12141a`, Electric Cyan `#1591DC`), bộ font chuẩn `Plus Jakarta Sans`, loại bỏ hoàn toàn lỗi font monospace vỡ nét và typography AI slop.
- [x] **Day 2 — Dual-Tier Persistence (Zero Data Loss)**: Xây dựng cơ chế tải tức thì 0ms từ `localStorage` kết hợp đồng bộ hai chiều thời gian thực với Cloud Firestore. Khắc phục triệt để lỗi mất dữ liệu khi F5 hoặc rớt mạng.
- [x] **Day 3 — Deep Work Pomodoro Station & Audio Engine**: Trạm tập trung toàn diện với âm thanh bát Tây Tạng (Tibetan Singing Bowl Chime), mở khóa Autoplay AudioContext, thông báo hệ thống Native OS Notification và cảnh báo chớp nháy tab nền.
- [x] **Day 4 — Commercial Whop Monetization & Licensing Engine**: 
  - Khóa tính năng theo mô hình Freemium (Miễn phí Pomodoro & Journal; khóa Tasks, Habits, Expenses yêu cầu Pro).
  - Cập nhật chuẩn giá mới: **$29/tháng** (Monthly Pass) và **$99/6 tháng** (6 Months Pass).
  - Hỗ trợ kích hoạt License Key tức thì (tự động phát hiện gói tháng và kiểm tra hạn 30 ngày).
- [x] **Day 5 — Desktop App, Frameless Mini Timer & Dynamic Alert System (HOÀN TẤT 100%)**:
  - Cửa sổ Electron Mini Timer hoàn toàn **không có khung viền Windows (`frame: false`)**, trong suốt (`transparent: true`), ghim nổi (`alwaysOnTop: true`), hỗ trợ kéo thả (`-webkit-app-region: drag`).
  - Hỗ trợ Web Document Picture-in-Picture với dark color-scheme sạch sẽ.
  - **Tái thiết kế toàn diện Mini Timer HUD**: Giảm kích thước xuống `280px × 78px` cực kỳ gọn gàng, thanh lịch, loại bỏ hoàn toàn font thô monospace, thay bằng sans tabular số chuẩn cao cấp (`tabular-nums`), dải tiến độ hairline 2px ở mép đáy, hỗ trợ thu gọn thành mini pill capsule (`● 24:59 Focus ⤢ ✕`).
  - **Đại tu hệ thống thông báo (Notifications & Completion Alert)**:
    - Loại bỏ hoàn toàn modal đen che kín toàn màn hình khi kết thúc phiên. Thay thế bằng **Floating Notification Banner** nổi ở góc phải trên với thanh đếm ngược tự động đóng 15s (tự tạm dừng khi rê chuột) và nút bấm trực tiếp chuyển phiên (`Start Break (5m) →`).
    - Tích hợp thông báo Native Windows qua IPC Electron (`electronAPI.showNotification`), hiển thị đúng icon ứng dụng `deepfocus-app-icon-512.png`, không lo bị Windows Action Center chặn hay nuốt thông báo.
    - Xóa sạch mọi emoji slop (`🎯`, `🔔`, `⚡`) trong thông báo hệ thống và tiêu đề tab nền, đưa về chuẩn typography Anh ngữ chuyên nghiệp.
  - **Dọn sạch giao diện (Zero Clutter)**: Gỡ bỏ hoàn toàn panel/modal Anti-AI-Slop ra khỏi UI ứng dụng (Sidebar, Settings, Command Palette, phím tắt), giữ lại tài liệu kỹ thuật trong root repository để giao diện người dùng đạt độ tập trung cao nhất.
- [x] **Day 6 — Whop Purchase Redirect Flow & Webhook Verification (HOÀN TẤT 100%)**:
  - Đồng bộ 100% thông báo lỗi & trạng thái bằng tiếng Anh chuẩn quốc tế trong `api/verify-license.js`.
  - Chuẩn hóa nhãn `6-Month Pass ($99)` và định dạng `DFOS-6MON-XXXX-XXXX` trên toàn bộ Modal nâng cấp.
  - Tích hợp **Auto Post-Checkout Detection**: Khi khách thanh toán xong trên Whop và quay về ứng dụng với `?checkout=success` hoặc `?key=DFOS-...`, ứng dụng tự động bật bảng cảm ơn và điền sẵn mã kích hoạt.
  - Đã kiểm thử tự động End-to-End luồng `api/whop-webhook.js` ➔ tạo key `DFOS-6MON-SKXE-EB8G` lên Cloud Firestore ➔ xác thực thành công qua `api/verify-license.js` (HTTP 200 OK).
- [x] **Day 7 — Packaging Portable .exe & Official Distribution (HOÀN TẤT ĐÓNG GÓI)**:
  - Đã đóng gói thành công cả 2 định dạng Windows tại thư mục `dist-app/`:
    - Bản Portable chạy ngay: `dist-app/DeepFocus 5.0.0.exe`
    - Bản Cài đặt NSIS: `dist-app/DeepFocus Setup 5.0.0.exe`

---

## 🏗️ 3. MA TRẬN TIẾN ĐỘ TÍNH NĂNG (FEATURE PROGRESS MATRIX)

| Module | Chức năng | Trạng thái | Chi tiết triển khai |
| :--- | :--- | :---: | :--- |
| **Desktop App** | Frameless Mini Window | ✅ 100% | Không khung Windows, nền trong suốt, kéo thả mượt mà, kích thước `280x82` |
| | Document Picture-in-Picture | ✅ 100% | Tự động inject dark theme-color & color-scheme `#09090b` |
| | Cross-Window Realtime Sync | ✅ 100% | Đồng bộ 2 chiều tức thì giữa App chính và Mini Window qua `StorageEvent` & Electron IPC |
| | Standalone Mini Route | ✅ 100% | Tải tức thì `?mini=true` không tốn tài nguyên chạy ngầm full app |
| | Native OS Notification IPC | ✅ 100% | Bắn thông báo Windows Action Center từ Electron main process kèm icon chuẩn |
| **Deep Work Timer** | Pomodoro Core Engine | ✅ 100% | Đếm giờ dựa trên timestamp chống nghẽn tab khi ẩn |
| | Dynamic Island Mini HUD | ✅ 100% | Thu nhỏ `280x78px`, typography sans `tabular-nums`, gập mở pill capsule |
| | Background Audio Chime | ✅ 100% | Singleton AudioContext mở khóa tương tác chống chặn autoplay |
| | OS & Tab Notifications | ✅ 100% | Desktop Notification + Chớp nháy tiêu đề tab nền (không emoji slop) |
| | Floating Completion HUD | ✅ 100% | Banner thông báo góc phải trên, không chặn màn hình, tự đóng 15s có hover-pause |
| | 100% English UI | ✅ 100% | Toàn bộ nhãn, tooltip, thông báo chuẩn tiếng Anh |
| **Tasks Hub** | Daily / Weekly / Monthly / Yearly | ✅ 100% | Quản lý mục tiêu theo khung thời gian |
| | Drag & Drop Priority Reordering | ✅ 100% | Kéo thả sắp xếp thứ tự ưu tiên trong Columns, Board và Table |
| | Database Filter & Multi-Sort | ✅ 100% | Lọc theo status, priority, context tag và sort 9 tiêu chí |
| **Habit Tracker** | Ma trận 30 ngày | ✅ 100% | Theo dõi thói quen, streak, hoàn thành theo ngày |
| **Daily Journal** | Stoic Energy & Reflection | ✅ 100% | Ghi chép năng lượng, bài học, nhật ký hàng ngày |
| **Expense Ledger**| Sổ thu chi cá nhân | ✅ 100% | Quản trị dòng tiền, phân loại danh mục, định dạng `1,618,000 ₫` |
| **Licensing** | Whop Integration | ✅ 100% | Đổi giá $29/tháng (`plan_6rzHyaaNhKAaU`) và $99/6 tháng (`plan_vrUwKeR11Yh0T`) |
| | ProFeatureLockGate | ✅ 100% | Khóa tính năng Pro theo chuẩn Freemium |
| | License Key Activation | ✅ 100% | Kích hoạt bản quyền qua Firebase với tự động kiểm tra hạn gói |
| | Admin Dashboard | ✅ 100% | Quản lý người dùng, cấp quyền Pro thủ công, xem số liệu |

---

## 🏛️ 4. KIẾN TRÚC KỸ THUẬT & CÁC QUYẾT ĐỊNH CỐT LÕI (TECHNICAL ARCHITECTURE)

### 4.1 Cửa sổ nổi Mini Timer (Frameless Electron Window & Document PiP)
- **Electron Native**:
  - `electron/main.js`: Sử dụng `BrowserWindow` với `width: 280, height: 82, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, backgroundColor: '#00000000'`.
  - `electron/preload.cjs`: Cung cấp cầu nối an toàn `window.electronAPI` (`openMiniTimer`, `closeMiniTimer`, `toggleMiniTimer`, `showNotification`, `onMiniTimerStatus`).
  - Thẻ `MiniTimerCard` áp dụng thuộc tính CSS `-webkit-app-region: drag` cho thân thẻ và `no-drag` cho các nút bấm điều khiển.
- **Web Browser Fallback**:
  - Sử dụng Chrome Document Picture-in-Picture (`documentPictureInPicture.requestWindow`).
  - Thiết lập `<meta name="color-scheme" content="dark">`, `<meta name="theme-color" content="#09090b">`, `disallowReturnToOpener: true` và layout tràn viền để loại bỏ hoàn toàn viền xám mặc định của Windows.

### 4.2 Hệ thống thông báo đa tầng (Multi-Tier Notification Architecture)
1. **Desktop Native (Electron Main Process)**: Gọi `new Notification({ title, body, icon, urgency: 'critical' }).show()` qua IPC, khắc phục 100% lỗi Windows Action Center nuốt thông báo từ background renderer.
2. **Web Browser (HTML5 Notification API)**: Gọi `new Notification` với `requireInteraction: false` và tag có gắn timestamp tránh bị Chrome gộp thông báo ngầm.
3. **In-App Dynamic Alert HUD**: Banner nổi góc phải trên (`fixed top-6 right-6`), không chặn tương tác người dùng (`pointer-events-none` cho container, `pointer-events-auto` cho thẻ thông báo), tự động đóng sau 15s và tạm dừng khi rê chuột.
4. **Tab Background Flasher**: Chớp nháy tiêu đề tab sạch sẽ không emoji slop: `[Session Complete] DeepFocus` hoặc `[Break Ended] DeepFocus`.

### 4.3 Cơ chế đồng bộ đa cửa sổ (Cross-Window Realtime Synchronization)
- Cửa sổ Mini Timer và Cửa sổ ứng dụng chính được đồng bộ trạng thái hai chiều 100% qua sự kiện `window.addEventListener('storage', handleStorageChange)`:
  - Khi bắt đầu, tạm dừng, đổi task hoặc bấm `+5m` ở bất kỳ cửa sổ nào, cửa sổ còn lại lập tức nhận diện và cập nhật trạng thái tương ứng.

### 4.4 Tách biệt Route tải nhanh (Zero-Delay Standalone Route)
- Khi nạp với tham số URL `?mini=true`, hệ thống chỉ render duy nhất component `<MiniTimerStandalone />` bên trong `<PomodoroProvider>`:
  - Không tải 2,300 dòng code của Dashboard chính, không khởi tạo biểu đồ, không gọi Firebase thừa thãi.
  - Đảm bảo thời gian mở cửa sổ con đạt mức mili-giây, tiêu tốn cực ít RAM và CPU.

---

## 📝 5. NHẬT KÝ COMMITS GẦN NHẤT (RECENT COMMITS CHANGELOG)

- `0033fde` — **refactor(ui): remove in-app anti-ai-slop modal and clean up user interface**  
  *Gỡ bỏ hoàn toàn file AntiSlopManifestoModal.tsx, dọn sạch nút bấm trên Sidebar, thẻ banner trong Settings, mục điều hướng Command Palette và phím tắt Ctrl+M. Giữ UI người dùng sạch sẽ tuyệt đối.*
- `d06894e` — **feat(pomodoro): redesign mini timer HUD to sleek Dynamic Island capsule and overhaul notifications**  
  *Thu nhỏ Mini Timer HUD xuống 280x78px tối giản, thay modal che màn hình bằng Floating Notification Banner đếm ngược 15s tự động đóng, tích hợp Native Windows Action Center notification qua Electron IPC, xóa sạch emoji slop.*
- `ce52b4b` — **docs: update HANDOFF.md with latest manifesto modal integration**  
  *Cập nhật tài liệu tiến độ với việc tích hợp modal.*
- `c0da8ac` — **feat: integrate Anti-AI-Slop Manifesto and 7-Day Plan modal into app**  
  *Tích hợp trực tiếp Sổ tay Anti-AI-Slop, 10 tiêu chuẩn kiểm định Quality Gate và Kế hoạch 7 ngày vào giao diện App.*
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

1. **Hoàn thiện luồng thanh toán Whop & Trải nghiệm sau mua (Day 6 Priority)**:
   - Kiểm tra và tinh chỉnh trải nghiệm khách hàng sau khi thanh toán trên Whop: Đảm bảo khách hàng nhận License Key ngay tại màn hình cảm ơn (Customer Portal / Thank You page của Whop) hoặc qua email, và nhập vào DeepFocus OS để kích hoạt ngay tức thì.
   - Thử nghiệm mô phỏng gọi Webhook Whop tới `api/whop-webhook.js` để xác nhận lưu license vào Firestore tự động.
2. **Kiểm tra đồng bộ giá & link checkout trên toàn hệ thống**:
   - Rà soát các vị trí hiển thị giá trong ứng dụng và tài liệu:
     - Gói tháng: **$29/tháng** (`https://whop.com/checkout/plan_6rzHyaaNhKAaU`)
     - Gói 6 tháng: **$99/6 tháng** (`https://whop.com/checkout/plan_vrUwKeR11Yh0T`)
3. **Đóng gói bản Windows Desktop (.exe) (Day 7 Preparation)**:
   - Chạy thử nghiệm lệnh `npm.cmd run dist:exe` để xuất file Windows portable `.exe`, kiểm thử tính năng Frameless Mini Timer trên môi trường máy tính thực tế.

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

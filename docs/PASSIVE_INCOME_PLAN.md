# 🏛 DEEPFOCUS OS — KẾ HOẠCH TỔNG THỂ & DANH MỤC TRIỂN KHAI CHI TIẾT (THE SUZUKI APPROACH)
> **Phiên bản:** Master Execution Blueprint v5.0 (100% Autopilot via X)  
> **Mục tiêu:** Mở bán ngay tuần này $\rightarrow$ Chạm mốc **$2,000 – $3,000** trong 30 ngày đầu $\rightarrow$ Mở rộng lên **$10,000+/tháng**.  
> **Nguyên tắc vận hành:** 0 Hard Pitch trong DM | Lead Magnet $0 siêu giá trị | Chuỗi 5 Email Nuôi Dưỡng | 0 Chi phí Server | 0 Nhân viên hỗ trợ.

---

## 📦 HẠNG MỤC 1: KIỂM KÊ TÀI SẢN KỸ THUẬT & TIẾP THỊ ĐÃ HOÀN TẤT 100%

Toàn bộ các thành phần cốt lõi của sản phẩm và hệ thống bán hàng tự động đã được xây dựng, kiểm thử và đóng gói sẵn sàng:

| Mã | Tên hạng mục | Trạng thái | Chi tiết kỹ thuật & Đường dẫn thực tế |
| :---: | :--- | :---: | :--- |
| **1.1** | **Desktop App (`.exe` v5.0.0)** | ✅ 100% | • Bản Portable chạy ngay: `dist-app/DeepFocus 5.0.0.exe`<br>• Bản Installer cài đặt: `dist-app/DeepFocus Setup 5.0.0.exe`<br>• Frameless Floating Mini Timer HUD (`280x78px`, bo góc 10px chuẩn Swiss, không đổ bóng thừa), thông báo Native Windows Action Center. |
| **1.2** | **Web App & Sandbox Demo** | ✅ 100% | • Giao diện 100% tiếng Anh chuẩn quốc tế, 0% AI Slop.<br>• Cho phép khách dùng thử trực tiếp Pomodoro & Journal miễn phí; khóa Tasks, Habits, Expenses bằng `ProFeatureLockGate`. |
| **1.3** | **Cổng Thanh Toán Whop** | ✅ 100% | • **Gói Tháng ($29/month):** `https://whop.com/checkout/plan_6rzHyaaNhKAaU`<br>• **Gói 6 Tháng / Flagship ($99):** `https://whop.com/checkout/plan_vrUwKeR11Yh0T` |
| **1.4** | **Hệ thống Cấp & Xác thực Key Tự động** | ✅ 100% | • Webhook nhận thanh toán Whop: `api/whop-webhook.js` (Tự động sinh mã `DFOS-6MON-XXXX-XXXX` hoặc `DFOS-1MON-XXXX-XXXX` lưu lên Cloud Firestore).<br>• API kiểm tra bản quyền: `api/verify-license.js` (Đã test E2E HTTP 200 OK).<br>• Tự động nhận diện sau thanh toán (`?checkout=success` / `?key=DFOS-...`). |
| **1.5** | **Tài sản Lead Magnet $0** | ✅ 100% | • Cẩm nang *The 4-Hour Deep Work Protocol (Zero-Distraction Checklist)* tại file `docs/4_HOUR_DEEP_WORK_PROTOCOL.md`. |
| **1.6** | **Kịch bản Auto-DM & 5 Email** | ✅ 100% | • Kịch bản Auto-DM tặng quà $0 + Soft CTA.<br>• Chuỗi 5 Email Nuôi Dưỡng Tự Động (ConvertKit / Beehiiv) từ Ngày 1 đến Ngày 5. |

---

## 🛠️ HẠNG MỤC 2: 5 BƯỚC BẤM NÚT KÍCH HOẠT HỆ THỐNG (LÀM 1 LẦN DUY NHẤT — 90 PHÚT)

Đây là 5 thao tác cấu hình ngoài đời thực trên các tài khoản của bạn để nối thông toàn bộ đường ống từ X $\rightarrow$ Auto-DM $\rightarrow$ Email $\rightarrow$ Whop $\rightarrow$ App:

### 🔹 Mục 2.1: Cấu hình Giao hàng & Webhook trên Whop Dashboard (15 phút)
- [ ] **Bước 1:** Đăng nhập [Whop Dashboard](https://whop.com/dashboard).
- [ ] **Bước 2 (Đính kèm file `.exe`):** Vào phần quản lý sản phẩm của 2 gói `plan_6rzHyaaNhKAaU` ($29) và `plan_vrUwKeR11Yh0T` ($99) $\rightarrow$ Thêm App **Files / Downloadables** $\rightarrow$ Upload file `dist-app/DeepFocus 5.0.0.exe` để khách mua xong tải về máy ngay.
- [ ] **Bước 3 (Gắn Webhook tự sinh Key):** Vào mục **Developer $\rightarrow$ Webhooks** $\rightarrow$ Thêm Endpoint URL: `https://<domain-web-cua-ban>/api/whop-webhook` $\rightarrow$ Chọn sự kiện `payment.succeeded` và `membership.went_valid`.
- [ ] **Bước 4 (Redirect URL):** Cài đặt Redirect URL sau khi thanh toán thành công về: `https://<domain-web-cua-ban>/?checkout=success`.

### 🔹 Mục 2.2: Xuất bản Link Lead Magnet $0 (10 phút)
- [ ] **Bước 1:** Mở file `docs/4_HOUR_DEEP_WORK_PROTOCOL.md`, copy nội dung dán vào 1 trang **Notion Public** (hoặc xuất ra PDF đưa lên Google Drive).
- [ ] **Bước 2:** Lưu lại đường link này để dán vào tin nhắn Auto-DM ở Mục 2.4 và Email số 1 ở Mục 2.5.

### 🔹 Mục 2.3: Thiết lập Tài khoản X Faceless & Mua X Premium (15 phút)
- [ ] **Bước 1 (Cập nhật Profile):**
  - **Display Name:** `DeepFocus OS ⚡`
  - **Avatar:** Logo DeepFocus nền đen `#0b0c10` (`public/deepfocus-app-icon-512.png`).
  - **Banner:** Ảnh chụp màn hình giao diện Pomodoro đếm ngược + dòng chữ: *"A mind free from distractions is an unshakeable citadel. — Marcus Aurelius"*.
  - **Bio:**
    > *Engineering the single-task flow state. | 100% offline, local-first focus OS for deep workers. | Try the live Web Sandbox & grab the 4-Hour Checklist below ⬇️*
  - **Website:** Điền link Web App của bạn.
- [ ] **Bước 2 (Kích hoạt Tích xanh):** Đăng ký **X Premium ($8/tháng)** để thuật toán X ưu tiên phân phối hiển thị gấp 2–3 lần và mở giới hạn gửi DM tự động.

### 🔹 Mục 2.4: Cài đặt Tweet Hunter — Auto-DM & Auto-Retweet (20 phút)
- [ ] **Bước 1:** Đăng ký tài khoản [Tweet Hunter](https://tweethunter.io) (7 ngày dùng thử miễn phí, sau đó $30/tháng) và kết nối tài khoản X.
- [ ] **Bước 2 (Cấu hình Auto-DM):**
  - **Trigger:** Khi người dùng **Comment / Reply** từ khóa `"FOCUS"`.
  - **Nội dung tin nhắn tự động:** Copy nguyên văn kịch bản ở **Hạng mục 4.1** bên dưới.
- [ ] **Bước 3 (Cấu hình Auto-Retweet):**
  - Vào **Queue Settings $\rightarrow$ Auto-Retweet**: Bật tự động Retweet mỗi **3 giờ**, tối đa **3 lần** cho mỗi bài đăng để vét cạn người xem ở cả 3 múi giờ (Mỹ, Âu, Á).

### 🔹 Mục 2.5: Cài đặt Chuỗi 5 Email Tự Động trên ConvertKit / Beehiiv (30 phút)
- [ ] **Bước 1:** Tạo tài khoản miễn phí trên [ConvertKit (Kit.com)](https://kit.com) (Miễn phí cho tới 10,000 subscribers).
- [ ] **Bước 2:** Tạo 1 Landing Page / Form đơn giản mang tên *"The 4-Hour Deep Work Protocol & Web Sandbox"* để khách điền Email nhận tài liệu.
- [ ] **Bước 3:** Vào mục **Send $\rightarrow$ Sequences** $\rightarrow$ Tạo Sequence mới gồm **5 Email** (mỗi email cách nhau 1 ngày) $\rightarrow$ Copy-paste nguyên văn 5 bức thư ở **Hạng mục 4.2** bên dưới.

---

## 📅 HẠNG MỤC 3: LỊCH TRÌNH VẬN HÀNH 30 NGÀY CHUẨN SUZUKI (45 PHÚT / NGÀY)

- **Tuần 1 (Ngày 1 – 7):** Đăng 3–5 bài/ngày (19h, 22h, 01h, 04h giờ VN) + Follow-back 100% người mới để kích hoạt x4 Mutuals $\rightarrow$ Thu 50–100 người comment `"FOCUS"`.
- **Tuần 2 (Ngày 8 – 14):** Duy trì 3–5 bài/ngày + Auto-Retweet mỗi 3h + Bình luận sâu sắc dưới 10 tài khoản lớn cùng ngách mỗi ngày $\rightarrow$ Nổ 3–5 đơn đầu tiên ($150 – $400).
- **Tuần 3 (Ngày 15 – 21):** Lọc 5 bài có nhiều Shares (40x) & Bookmarks (20x) nhất để đăng lại (Recycle) kèm video 15s quay cảnh dùng Floating Mini Timer HUD $\rightarrow$ 8–12 đơn hàng ($500 – $1,000).
- **Tuần 4 (Ngày 22 – 30):** Bật Affiliate 40% trên Whop + Kích hoạt Post-Purchase Upsell gói Studio 5-Seat ($249) $\rightarrow$ Chạm mốc **$2,000 – $3,000 Net Profit**.

---

## 📜 HẠNG MỤC 4: TRỌN BỘ KỊCH BẢN COPY-PASTE

### 4.1. Kịch bản Auto-DM trên Tweet Hunter (Trigger: Comment `"FOCUS"`)

```text
Hey [First Name],

You asked for the zero-distraction toolkit — here it is.

🔗 1. Instant Web Sandbox (No sign-up required):
https://deepfocus.app
(Experience the single-task Pomodoro station and Stoic journal right in your browser).

📄 2. The 4-Hour Deep Work Protocol (Zero-Distraction Checklist):
[DÁN_LINK_NOTION_HOẶC_PDF_CỦA_BẠN_VÀO_ĐÂY]
(The exact framework I use to complete 8 hours of cognitive output before 12:00 PM).

Run a 25-minute block today. See how much mental clutter disappears when you strip away the tabs.

---
P.S. If you want to eliminate the browser completely and work 100% offline with a frameless floating desktop HUD, you can grab the native Windows desktop app here ($29/mo or $99 for 6-Month Pass):
https://whop.com/checkout/plan_vrUwKeR11Yh0T

No pressure at all — enjoy the sandbox and checklist first. Let me know what you build today.
```

### 4.2. Chuỗi 5 Email Nuôi Dưỡng Tự Động (ConvertKit / Beehiiv)
*(Xem toàn văn 5 bức thư tại `passive_income_execution_blueprint.md`)*.

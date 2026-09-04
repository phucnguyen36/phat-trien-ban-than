# 🛡️ DEEP FOCUS OS — LESSONS LEARNED & ENGINEERING STANDARDS
> **Mục đích**: Tài liệu này lưu trữ toàn bộ bài học kinh nghiệm, nguyên tắc thiết kế, quy chuẩn lưu trữ dữ liệu và kiểm thử chất lượng nhằm đảm bảo hệ thống phát triển liên tục, hoàn thiện vững chắc và **tuyệt đối không bao giờ lặp lại các sai lầm trong quá khứ**.

---

## 1. 💾 QUY CHUẨN DỮ LIỆU & LƯU TRỮ (ZERO DATA LOSS PROTOCOL)

### ❌ Các sai lầm từng gặp:
1. **Lỗi loadFromLocalStorage không parse JSON**: Đọc chuỗi thô từ localStorage nhưng quên JSON.parse(), dẫn đến biến bị undefined, kích hoạt cơ chế fallback và reset trắng dữ liệu khi người dùng bấm F5.
2. **Khởi tạo trạng thái bất đồng bộ chậm trễ**: Khởi tạo isAuthenticated = false và goals = [] rỗng theo mặc định. Khi F5, React nạp trang ở trạng thái 'chưa đăng nhập', gây ra độ trễ (flicker) và làm sai lệch luồng nạp dữ liệu.
3. **Mất định danh tài khoản khi gọi hàm lưu**: Các hàm handleAddGoal, handleToggleGoal, handleAddHabit, handleAddExpense gọi saveGoal(item) mà không truyền kèm currentUser?.email, dẫn đến dữ liệu bị lưu vào khóa ẩn danh default_user thay vì tài khoản cá nhân.
4. **Lỗi Firestore Realtime Snapshot trả về mảng rỗng `[]` đè trắng Local Data**: Khi người dùng F5, listener `onSnapshot` kết nối tới Firestore. Nếu collection trên Firestore chưa có dữ liệu hoặc đang rớt mạng, callback trả về `[]`. Code cũ kiểm tra `if (data)` (vốn luôn true vì `[]` là truthy) và gọi `setGoals([])`, khiến dữ liệu vừa nạp từ LocalStorage bị xóa sạch ngay lập tức.

### ✅ Quy tắc bắt buộc tuân thủ:
- [x] **Khởi tạo đồng bộ tức thì (0ms Instant Load)**: Mọi state cốt lõi (currentUser, isAuthenticated, goals, habits, journal, expenses, scratchpad) **phải** được đọc đồng bộ từ localStorage qua hàm lazy initializer của useState ngay tại mili-giây đầu tiên.
- [x] **Lưu trữ tự động liên tục (Continuous Zero-Delay Auto-Save)**: Thiết lập `useEffect` bám sát các state (`goals`, `habits`, `journalEntries`, `expenses`, `scratchpadText`) để ghi thẳng xuống `localStorage` ngay tức thì tại mỗi thay đổi state.
- [x] **Bảo vệ chống đè mảng rỗng từ Firestore Snapshot**: Listener `onSnapshot` và `loadData` **tuyệt đối không được phép** gọi `setGoals([])` nếu dữ liệu trả về từ Firestore là mảng rỗng. Chỉ cập nhật state khi `Array.isArray(data) && data.length > 0`.
- [x] **Kiến trúc lưu trữ 2 tầng (Dual-Tier Persistence)**:
  - **Tầng 1 (LocalStorage)**: Ghi tức thì vào localStorage theo khóa tài khoản (df_goals_todo_) và khóa dự phòng toàn cục (df_goals_todo).
  - **Tầng 2 (Cloud Firestore)**: Đồng bộ ngầm lên Firestore (users//...).
- [x] **Phòng vệ rớt mạng / Timeout**: Luôn thiết lập giới hạn timeout (3-4s). Nếu Firestore phản hồi chậm hoặc lỗi mạng, hệ thống **luôn ưu tiên giữ 100% dữ liệu LocalStorage**, không được phép xóa trắng hoặc reset về ban đầu.
- [x] **An toàn Parse JSON**: Luôn bọc JSON.parse() trong try...catch và kiểm tra Array.isArray() trước khi gán vào state.
- [x] **Đồng bộ tham số người dùng**: Mọi hàm thêm/sửa/xóa đều phải truyền currentUser?.email vào các hàm save... và delete....

---

## 2. 🎨 QUY CHUẨN THIẾT KẾ & CHỐNG 'AI SLOP' (SWISS DESIGN STANDARD)

> **Tham chiếu chuẩn**: [Thomas Nguyen Studio](https://www.thomasnguyen.online/) — Phong cách thiết kế Thụy Sĩ (Swiss Style): Tối giản, tương phản cao, typography tinh tế, không phô trương thừa thãi.

### ❌ Các sai lầm từng gặp:
1. **Ép letter-spacing: -0.025em toàn cục**: Áp dụng thuộc tính nén chữ lên cả các từ in hoa in đậm (GYM, JOURNALING), khiến các chữ cái bị dính chùm vào nhau như lỗi render.
2. **Font thứ cấp thô kệch**: Dùng font monospace pixel thô (ont-mono text-[9px]) kèm thẻ HTML <select> mặc định của hệ điều hành với mũi tên xám thô.
3. **Vỡ khung & Tràn ô do chuỗi cố định**: Nhãn ⏱ EST: cố định cạnh 5 nút bấm khiến chữ bị bẻ đôi dòng (ES / T:) và nút ½day tràn đè lên đường kẻ phân chia cột.
4. **Placeholder quá dài bị cắt cụt**: Add week objective... bị khung hẹp cắt cụt thành Add week obje....

### ✅ Quy tắc bắt buộc tuân thủ:
- [x] **Typography chuẩn Thụy Sĩ**:
  - Font chính: Neue Haas Grotesk Display Pro / Plus Jakarta Sans / Inter.
  - Body text: letter-spacing: -0.01em.
  - Heading lớn (h1, h2): letter-spacing: -0.02em.
  - Text in hoa / Badge / Uppercase: letter-spacing: 0.04em (tuyệt đối không để âm để chữ thở được).
  - Font thứ cấp: Dùng ont-sans text-[11px] text-[#9496a1] font-normal kèm icon vector nhỏ gọn (<Link2 className=" w-2.5 h-2.5 text-[#1591DC]\ />).
- [x] **Bố cục co giãn linh hoạt (Flex-Wrap & Clean Pills)**:
 - Các cụm nút chọn thời gian/trạng thái luôn dùng lex-wrap gap-1 và pill bo tròn (ounded-full), không fix cứng chiều rộng.
 - Sử dụng nhãn ngắn gọn, chuẩn quốc tế: 15m, 30m, 1h, 2h, 4h (thay vì ½day).
 - Placeholder ngắn gọn: Add task for day..., Add habit for month....
- [x] **Biểu tượng vector thay cho Emoji thô**:
 - Không sử dụng emoji thô (⏱, 🔥, 📅) trên các thẻ giao diện chuyên nghiệp.
 - Sử dụng toàn bộ Lucide React SVG icons với nét mảnh (stroke width 1.5 - 2) và màu accent đồng bộ (#1591DC).
- [x] **Màu sắc & Tương phản**:
 - Canvas nền tối: #0b0c10 kết hợp thẻ card #12141a viền mờ order-white/[0.08].
 - Màu điểm nhấn (Accent): Electric Cyan #1591DC.
 - Chế độ sáng (Light Mode): Porcelain White sạch sẽ, tương phản cao, không xám đục.

---

## 3. 🚀 QUY TRÌNH KIỂM TRA & ĐÓNG GÓI (QUALITY GATE CHECKLIST)

Mỗi khi hoàn thành bất kỳ thay đổi nào, bắt buộc thực hiện đủ 4 bước sau trước khi báo hoàn thành:

1. **Kiểm tra build TypeScript & Vite (
pm run build)**: Đảm bảo 0 lỗi biên dịch.
2. **Đồng bộ gói sang Desktop App**: xcopy /E /I /Y dist dist-app\win-unpacked\resources\app\dist.
3. **Đẩy mã nguồn lên Git repository**: git add -A; git commit -m '...'; git push origin main để kích hoạt Vercel deploy.
4. **Kiểm tra trực tiếp trên trình duyệt (F5 & Ctrl + F5)**: Xác thực dữ liệu còn nguyên vẹn 100%.

---

## 4. 📈 LỊCH SỬ TIẾN HÓA CÁC PHIÊN BẢN

| Phiên bản | Thay đổi chính | Bài học rút ra |
|:---|:---|:---|
| **v1.0 - v3.0** | Bản dựng khởi tạo giao diện cơ bản | Quá nhiều chi tiết AI rườm rà, chưa có tính đồng bộ. |
| **v4.0** | Chuẩn hóa Swiss Design theo phong cách Thomas Nguyen | Cần loại bỏ toàn bộ font pixel/terminal và thay emoji bằng vector SVG. |
| **v5.0** | Pomodoro Deep Work Timer, Review Protocol tuần/tháng, Financial Timeline Chart | Phân lập rành mạch các view mode (calendar vs eview), mở rộng biểu đồ tài chính 320px. |
| **v5.1** | Khắc phục vỡ layout EST: & căn chỉnh Typography Thụy Sĩ | Điều chỉnh letter-spacing riêng cho uppercase và sử dụng pill co giãn. |
| **v5.2** | Vá triệt để lỗi mất dữ liệu khi bấm F5 (Zero Data Loss Architecture) | Khởi tạo state đồng bộ từ LocalStorage, cấu hình lưu kép 2 tầng với Cloud Firestore. |
| **v5.3** | Khắc phục lỗi mở Dashboard trong Task, đồng bộ điều hướng & Database filter | Định nghĩa an toàn các hàm toggle/delete, bổ sung nút mở rộng Sidebar và phím tắt Executive Dashboard ngay trong Tasks. |

---
*Tài liệu này là cẩm nang bất biến cho mọi cập nhật tiếp theo của dự án Deep Focus OS.*

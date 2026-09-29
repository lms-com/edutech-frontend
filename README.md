# EduTech LMS — Frontend Web Application

Giao diện người dùng cho nền tảng đào tạo trực tuyến EduTech LMS.

- **Công nghệ chính:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand, Axios.
- **Sổ tay hướng dẫn chi tiết:** Xem file [HUONG-DAN-SU-DUNG.md](../HUONG-DAN-SU-DUNG.md) tại thư mục gốc của workspace.

---

## 1. Cấu trúc Phân hệ (Portals)

Ứng dụng chia thành 4 không gian trải nghiệm độc lập dựa theo vai trò người dùng:

1. **Học viên (Learner Portal):**
   - Khám phá danh mục khóa học đã xuất bản (`PUBLISHED`).
   - Mua khóa học qua VNPay hoặc ghi danh khóa miễn phí.
   - Phòng học Cinema Mode với video bảo mật và bài kiểm tra Quiz server-evaluated.
   - Nhận chứng chỉ số có mã QR tra cứu.
2. **Giảng viên (Instructor Studio):**
   - Quản lý danh sách khóa học của chính giảng viên.
   - Tạo khóa học bản nháp (`DRAFT`), soạn cấu trúc chương học và bài giảng.
   - Gửi yêu cầu phê duyệt khóa học (`PENDING`).
3. **Quản trị viên (Admin Console):**
   - Không gian quản trị tách biệt hoàn toàn (`AdminHeader` + `AdminPortal`).
   - Thẩm định khóa học: Duyệt phát hành (`PUBLISHED`) hoặc từ chối kèm lý do (`REJECTED`).
   - Thẩm định & Tra cứu chứng chỉ số: Đối soát mã băm SHA-256 từ Notification Service.
   - Giám sát phiên thiết bị (Redis) và quản lý yêu cầu rút tiền (Payouts).
4. **Tra cứu Công khai (Public Certificate Verification):**
   - Xác thực chứng chỉ điện tử không cần đăng nhập qua URL: `/?verify=<sha256-hash>`.

---

## 2. Hướng dẫn Chạy Local

### Cài đặt thư viện:
```powershell
npm.cmd install
```

### Chạy môi trường phát triển (Dev Server):
> **Lưu ý:** Luôn chỉ định host IPv4 để tránh xung đột bind IPv6 trên Windows.
```powershell
npm.cmd run dev -- --host 127.0.0.1
```
Ứng dụng sẽ khả dụng tại: **`http://127.0.0.1:5173`**

### Kiểm tra TypeScript & Đóng gói sản phẩm:
```powershell
npm.cmd run build
```

---

## 3. Tài khoản Kiểm thử mặc định
Mật khẩu chung: `KiemThu@123`
- **Học viên:** `kiemthu.gd1@lms.com`
- **Giảng viên:** `giangvien@lms.com`
- **Quản trị viên:** `admin@lms.com`

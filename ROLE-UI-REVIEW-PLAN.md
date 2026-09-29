# Rà soát giao diện và logic theo vai trò

Ngày rà soát: 28/09/2026

## Đã điều chỉnh trong đợt này

- **Học viên:** tách khóa có enrollment `ACTIVE` thành khu vực “Khóa học của tôi”; danh mục khám phá không còn nút vào học trực tiếp. Trang chi tiết chỉ hiện hành động phù hợp: tiếp tục học, thanh toán, hoặc ghi danh khóa miễn phí.
- **Quyền học:** frontend xác nhận enrollment đang `ACTIVE` trước khi mở phòng học và tải cấu trúc bài. Backend từ chối ghi danh trực tiếp khóa chưa xuất bản hoặc có phí.
- **Thanh toán:** kết quả trả về từ VNPay không còn được dùng để khẳng định quyền học đã kích hoạt; nếu ghi danh chưa đồng bộ thì giao diện báo cần chờ/xác nhận lại.
- **Giảng viên:** thêm trang quản lý danh sách khóa của chính giảng viên và tạo khóa bản nháp qua API. Studio chỉ mở khi chọn một khóa cụ thể; bỏ chọn mặc định khóa đầu tiên trong danh mục.
- **Xem trước:** chế độ xem trước cho nhân viên được đánh dấu rõ; không ghi tiến độ, mở quiz hoặc cấp chứng chỉ.
- **QR:** ẩn lối tra cứu khỏi header của giảng viên/quản trị. Tra cứu vẫn là chức năng công khai qua liên kết/mã QR; nó không phải chức năng dành riêng cho sinh viên.
- **Dữ liệu mẫu:** gắn cảnh báo rõ trên trang quản trị và studio rằng các bảng/thao tác mô phỏng chưa ghi lên máy chủ.

## Lỗi và khoảng trống tìm thấy

### Học viên

- Trước đây mọi thẻ khóa học đều có thể mở phòng học, kể cả khi chưa mua/ghi danh.
- Trang chi tiết đồng thời hiện nút mua và nút vào học cho khóa chưa có quyền.
- Kết quả VNPay trước đây nói quyền học đã kích hoạt ngay khi callback báo thành công, dù sự kiện ghi danh có thể đến muộn.
- Danh sách “Khóa học của tôi” đang ghép với danh mục khóa đã xuất bản. Nếu một khóa đã mua bị ẩn/gỡ khỏi danh mục thì enrollment có thể không hiện thành thẻ học; cần endpoint trả khóa học theo enrollment.
- Chi tiết khóa học cần phân biệt dữ liệu giới thiệu công khai với video/bài kiểm tra/tài liệu chỉ dành cho học viên đã ghi danh.

### Giảng viên

- Trước đây studio gắn với một khóa bất kỳ trong danh mục thay vì danh sách khóa thuộc giảng viên.
- Đã có API tạo bản nháp và lấy khóa của tôi nhưng UI chưa kết nối.
- Các KPI, thêm chương, upload video và yêu cầu rút tiền hiện vẫn dùng số liệu/state giả hoặc chỉ lưu trên trình duyệt.
- Cần thêm luồng sửa thông tin khóa, lưu chương/bài lên API, gửi duyệt, xem trạng thái/lý do từ chối, và báo lỗi/thành công thật.

### Quản trị viên

- Danh sách kiểm duyệt, payout, thiết bị và các thao tác duyệt/từ chối/thu hồi đang dùng dữ liệu mẫu, không gọi backend.
- Giao diện hiện có cảnh báo để tránh hiểu nhầm thao tác đã được thực hiện. Phần tiếp theo cần kết nối API thật hoặc chuyển các thao tác chưa hỗ trợ sang trạng thái “Chưa khả dụng”.
- Trang quản trị chưa có luồng quản lý người dùng, phân quyền, nhật ký thao tác và trạng thái xử lý có thể đối soát.

### Phân quyền backend — ưu tiên bảo mật

- Nhiều `@PreAuthorize` trong `CourseController`, `AdminCourseController`, `LessonController` đang bị comment; route được gateway xác thực đăng nhập chưa đồng nghĩa đã kiểm tra đúng role/ownership.
- Endpoint phát URL video `/lessons/{id}/play` hiện chưa kiểm tra enrollment ACTIVE; cần kiểm tra quyền phía server, không dựa vào việc ẩn nút ở frontend.
- Các API sửa/xóa chương và bài học cần xác minh khóa thuộc giảng viên hiện tại; API admin phải yêu cầu authority quản trị.
- API tạo enrollment miễn phí đã có kiểm tra giá/trạng thái khóa học; cần bổ sung kiểm tra nhất quán ở luồng thanh toán và kiểm tra trạng thái enrollment sau callback.

## Kế hoạch ưu tiên tiếp theo

1. **P0 — Chốt quyền truy cập server:** bật kiểm tra role và ownership cho create/edit/delete course, section, lesson; khóa API phát URL video và nội dung bài nếu chưa có enrollment ACTIVE; giới hạn API moderation cho admin.
2. **P1 — Hoàn thiện vòng đời học viên:** endpoint khóa học theo enrollment; trạng thái đơn hàng/ghi danh có thể truy vấn; nút “Kiểm tra lại quyền học”; khóa detail/video/quiz theo entitlement; xử lý enrollment bị thu hồi.
3. **P1 — Hoàn thiện quản lý khóa của giảng viên:** sửa metadata, lưu chương/bài thật, gửi duyệt, hiển thị rejection note và phân biệt DRAFT/PENDING/PUBLISHED/REJECTED.
4. **P1 — Quản trị thật:** nối API kiểm duyệt khóa, duyệt payout và quản lý session; thêm xác nhận cho hành động nhạy cảm và lịch sử thao tác.
5. **P2 — Các tính năng vận hành giảng viên:** nối KPI, upload media, payout/balance; bỏ dữ liệu mẫu khỏi các luồng được đưa vào vận hành.
6. **P2 — Hoàn thiện trải nghiệm:** thiết kế trạng thái loading/empty/error/permission cho từng role; thêm phân trang và lọc phía server; kiểm tra keyboard/mobile/accessibility.

## Điều kiện nghiệm thu

- Học viên chỉ thấy nút học khi enrollment `ACTIVE`; người chưa mua chỉ thấy nội dung giới thiệu và hành động mua/ghi danh miễn phí.
- Callback thanh toán thành công không tự mở quyền; quyền chỉ mở khi backend xác nhận enrollment.
- Giảng viên chỉ xem/sửa khóa thuộc mình và quản lý được nhiều khóa trên một trang.
- Quản trị viên mới thực hiện được moderation/payout/session khi API xác nhận quyền và lưu thành công.
- Mọi thao tác chưa nối backend được ghi rõ là bản mẫu hoặc bị khóa; frontend không hiển thị thông báo thành công giả.
- Truy cập trực tiếp URL/API phải tuân theo cùng một chính sách như thao tác qua giao diện.

## Ghi chú xác minh

Đợt này chưa chạy build hoặc test tự động. Cần xác minh compile/API integration sau khi backend và các dịch vụ phụ thuộc được chạy cùng cấu hình môi trường.

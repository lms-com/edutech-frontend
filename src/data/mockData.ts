import { Course, Certificate, NotificationItem, DeviceSession, PayoutRequest, ReviewItem } from '../types';

export const CURRENT_USER = {
  id: 'usr_vn_9824',
  name: 'Nguyễn Hoàng Long',
  email: 'long.nguyen@edutech.vn',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'LEARNER'
};

export const MOCK_CERTIFICATE: Certificate = {
  id: 'CERT-EDU-2026-98124',
  courseId: 'course_ms_01',
  courseTitle: 'Kiến Trúc Microservices Toàn Diện với Spring Cloud & Docker',
  studentName: 'NGUYỄN HOÀNG LONG',
  studentEmail: 'long.nguyen@edutech.vn',
  issueDate: '11/09/2026',
  qrCodeHash: 'a8f9c12e5d74b901fc88e99210aa3941b6c00d437e96a245f7823b1dc995e87a',
  pdfUrl: 'https://minio.edutech.internal/certificates/CERT-EDU-2026-98124.pdf',
  instructorName: 'TS. Trần Minh Khoa',
  directorName: 'Lê Đình Quang (CTO EduTech Corp)',
  grade: 'XUẤT SẮC (GPA: 9.6/10)'
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'course_ms_01',
    title: 'Kiến Trúc Microservices Toàn Diện với Spring Cloud, Kafka & Docker',
    slug: 'kien-truc-microservices-toan-dien',
    category: 'Lập trình Backend',
    subcategory: 'Spring Boot & Cloud',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    instructor: {
      id: 'inst_01',
      name: 'TS. Trần Minh Khoa',
      title: 'Principal Software Architect @ VinTech Solutions, Ex-Googler',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Chuyên gia hơn 14 năm kinh nghiệm thiết kế hệ thống phân tán xử lý hàng triệu RPM, giảng viên kiến trúc Microservices hàng đầu Việt Nam.',
      totalStudents: 18450,
      totalCourses: 6,
      rating: 4.9
    },
    rating: 4.9,
    reviewsCount: 1240,
    price: 1899000,
    discountPrice: 1299000,
    level: 'Nâng cao',
    durationHours: 24.5,
    totalLessons: 18,
    updatedAt: '09/2026',
    language: 'Tiếng Việt',
    shortDescription: 'Làm chủ thiết kế hệ thống Microservices hiện đại: API Gateway, JWT Authentication, HLS Media Streaming mã hoá AES-128, Kafka Event-Driven và Kubernetes.',
    whatYouWillLearn: [
      'Xây dựng kiến trúc API Gateway định tuyến động, phân quyền RBAC và rate-limiting',
      'Xử lý bảo mật luồng video bài giảng trực tuyến bằng HLS phân đoạn AES-128 chống tải trộm',
      'Đồng bộ dữ liệu thời gian thực giữa các Microservices bằng Apache Kafka & Debezium CDC',
      'Tích hợp lưu trữ object storage MinIO phân tán và sinh liên kết Presigned URL an toàn',
      'Triển khai kiến trúc Event-Driven kiến trúc thông báo SSE (Server-Sent Events) đa thiết bị',
      'Cấp phát chứng chỉ tự động chuẩn A4 với mã băm SHA-256 đối soát mã QR'
    ],
    status: 'PUBLISHED',
    sections: [
      {
        id: 'sec_01',
        title: 'Chương 1: Tổng quan Kiến trúc & Spring Cloud Gateway (:8080)',
        lessons: [
          {
            id: 'les_01',
            title: '1. Kiến trúc tổng thể EduTech Microservices & Sơ đồ luồng dữ liệu',
            durationMinutes: 14,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            mediaId: 'media_sec1_les1_720p',
            isHlsEncrypted: true,
            isPreview: true,
            summary: 'Giới thiệu về phân vùng 3 Portal (Learner, Instructor, Admin), API Gateway định tuyến ngược, cơ chế xác thực JWT và bảo mật token qua Gateway.',
            resources: [
              { name: 'Architecture-Diagram-Microservices.pdf', size: '2.4 MB', type: 'PDF', url: '#' },
              { name: 'docker-compose-infra.yml', size: '4 KB', type: 'YML', url: '#' }
            ]
          },
          {
            id: 'les_02',
            title: '2. Cài đặt & Cấu hình Spring Cloud Gateway định tuyến ngược',
            durationMinutes: 22,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            mediaId: 'media_sec1_les2_1080p',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Thiết lập Spring Cloud Gateway lọc request, gắn X-Forwarded-For, X-Device-Fingerprint và xử lý CORS đồng bộ với Gateway port 8080.',
            resources: [
              { name: 'gateway-application.yml', size: '3.1 KB', type: 'YML', url: '#' },
              { name: 'GatewayRouteConfig.java', size: '5.8 KB', type: 'JAVA', url: '#' }
            ]
          },
          {
            id: 'les_03',
            title: '3. Bảo vệ Gateway bằng Redis Rate Limiter & Token Bucket',
            durationMinutes: 18,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            mediaId: 'media_sec1_les3_hls',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Sử dụng Redis Reactive RateLimiter để chặn DDOS và giới hạn tần suất gọi API từ phía Client theo IP và Device Fingerprint.',
            resources: [
              { name: 'redis-rate-limiter.conf', size: '1.2 KB', type: 'CONF', url: '#' }
            ]
          }
        ],
        quiz: {
          id: 'quiz_sec_01',
          title: 'Quiz 01: Kiểm tra kiến thức Spring Cloud Gateway & Security',
          durationMinutes: 15,
          passScore: 80,
          questions: [
            {
              id: 'q1',
              question: 'Trong kiến trúc EduTech Microservices, vai trò chính của API Gateway (:8080) là gì?',
              options: [
                { key: 'A', text: 'Chỉ lưu trữ file video bài giảng tĩnh của giảng viên' },
                { key: 'B', text: 'Điểm tiếp nhận tập trung (Single Entry Point), định tuyến request, xác thực token và rate-limit' },
                { key: 'C', text: 'Thực hiện render mã HTML phía server cho toàn bộ giao diện' },
                { key: 'D', text: 'Quản lý kết nối trực tiếp đến tất cả Database riêng của từng service' }
              ],
              correctAnswer: 'B',
              explanation: 'API Gateway đóng vai trò Single Entry Point, tiếp nhận toàn bộ request từ Client, kiểm tra xác thực JWT, định tuyến đến các microservices nội bộ và kiểm soát lưu lượng.'
            },
            {
              id: 'q2',
              question: 'Giao thức bảo vệ phát video trực tuyến (HLS) nào được sử dụng để chống tải trộm nội dung?',
              options: [
                { key: 'A', text: 'Truyền file raw MP4 qua giao thức FTP không chứng thực' },
                { key: 'B', text: 'Chia nhỏ video thành các phân đoạn .ts và mã hóa từng đoạn bằng chuẩn AES-128' },
                { key: 'C', text: 'Nén file video thành định dạng ZIP đặt mật khẩu đơn giản' },
                { key: 'D', text: 'Chuyển toàn bộ video thành chuỗi Base64 nhúng thẳng vào file HTML' }
              ],
              correctAnswer: 'B',
              explanation: 'HLS (HTTP Live Streaming) phân đoạn video thành các file .ts nhỏ kết hợp file chỉ mục playlist .m3u8, được mã hóa bằng AES-128 và yêu cầu key giải mã qua API xác thực bảo mật.'
            },
            {
              id: 'q3',
              question: 'Khi học viên xem video đạt bao nhiêu phần trăm thì hệ thống LMS tự động đồng bộ tiến độ hoàn thành?',
              options: [
                { key: 'A', text: 'Chỉ cần mở video lên 1 giây' },
                { key: 'B', text: 'Khi đạt từ 90% đến 100% thời lượng bài học' },
                { key: 'C', text: 'Sau khi học viên bấm F5 tải lại trang 5 lần' },
                { key: 'D', text: 'Chỉ khi giảng viên thủ công bấm xác nhận cho từng học viên' }
              ],
              correctAnswer: 'B',
              explanation: 'Theo chuẩn LMS chuyên nghiệp, khi học viên xem đạt ngưỡng 90% - 100%, client gửi heartbeat hoặc gọi PUT /enrollment-service/api/v1/progress/lessons/{id} để ghi nhận bài đã hoàn thành.'
            },
            {
              id: 'q4',
              question: 'Trường dữ liệu nào trên chứng chỉ tốt nghiệp đảm bảo tính toàn vẹn và chống làm giả khi quét mã QR công khai?',
              options: [
                { key: 'A', text: 'Mã màu sắc viền chứng chỉ' },
                { key: 'B', text: 'Mã băm SHA-256 (qrCodeHash) duy nhất liên kết với bản ghi chứng chỉ gốc' },
                { key: 'C', text: 'Tên font chữ tiếng Việt Roboto' },
                { key: 'D', text: 'Số lượng bài giảng trong khóa học' }
              ],
              correctAnswer: 'B',
              explanation: 'Mã SHA-256 qrCodeHash duy nhất được tính từ dữ liệu học viên, khóa học và thời điểm cấp, cho phép bên thứ ba tra cứu trực tiếp trên Public Verification Page không thể giả mạo.'
            }
          ]
        }
      },
      {
        id: 'sec_02',
        title: 'Chương 2: Bảo mật Media HLS AES-128 & Tích hợp MinIO Storage',
        lessons: [
          {
            id: 'les_04',
            title: '4. Upload Video bằng MinIO Presigned URL từ Browser',
            durationMinutes: 19,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            mediaId: 'media_sec2_les4_hls',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Quy trình giảng viên lấy Presigned PUT URL từ media-service và tải trực tiếp file dung lượng lớn lên MinIO bucket, giảm tải 100% cho server ứng dụng.',
            resources: [
              { name: 'MinioClientConfig.java', size: '4.2 KB', type: 'JAVA', url: '#' }
            ]
          },
          {
            id: 'les_05',
            title: '5. Mã hóa phân đoạn HLS với FFmpeg & AES-128 Key Rotation',
            durationMinutes: 26,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            mediaId: 'media_sec2_les5_aes',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Chuyển đổi video MP4 sang m3u8 playlist, bẻ nhỏ chunk ts 6 giây, sinh key 16-bytes và tích hợp URL cấp phép phát nội dung bảo mật.',
            resources: [
              { name: 'ffmpeg-transcode-script.sh', size: '2.1 KB', type: 'SH', url: '#' }
            ]
          }
        ]
      },
      {
        id: 'sec_03',
        title: 'Chương 3: Cấp Chứng chỉ Tốt nghiệp & Xác thực QR Code SHA-256',
        lessons: [
          {
            id: 'les_06',
            title: '6. Tự động lắng nghe sự kiện hoàn thành 100% qua Kafka',
            durationMinutes: 16,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
            mediaId: 'media_sec3_les6_kafka',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Enrollment-service xuất bản topic course-completed. Notification-service lắng nghe consumer, tự động sinh chứng chỉ PDF và lưu trữ vào MinIO.',
            resources: [
              { name: 'CourseCompletedConsumer.java', size: '3.8 KB', type: 'JAVA', url: '#' }
            ]
          },
          {
            id: 'les_07',
            title: '7. Sinh PDF chuẩn A4 Landscape nhúng font Roboto & QR Code',
            durationMinutes: 21,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            mediaId: 'media_sec3_les7_cert',
            isHlsEncrypted: true,
            isPreview: false,
            summary: 'Tạo tài liệu PDF chất lượng cao kích thước A4 nằm ngang, nhúng font chữ tiếng Việt, tạo mã QR Code chuẩn xác thực URL công khai.',
            resources: [
              { name: 'PdfGeneratorService.java', size: '8.4 KB', type: 'JAVA', url: '#' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course_ms_02',
    title: 'Xây dựng Hệ thống E-Commerce Microservices với Event-Driven & Kafka',
    slug: 'ecommerce-microservices-kafka',
    category: 'Lập trình Backend',
    subcategory: 'Event-Driven Architecture',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    instructor: {
      id: 'inst_02',
      name: 'ThS. Nguyễn Văn Hùng',
      title: 'Senior Solutions Architect, AWS Certified',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Chuyên sâu giải pháp chịu tải cao và thanh toán trực tuyến.',
      totalStudents: 9200,
      totalCourses: 4,
      rating: 4.8
    },
    rating: 4.8,
    reviewsCount: 850,
    price: 1650000,
    discountPrice: 1150000,
    level: 'Trung cấp',
    durationHours: 19.0,
    totalLessons: 14,
    updatedAt: '08/2026',
    language: 'Tiếng Việt',
    shortDescription: 'Saga Pattern, Outbox Pattern, Debezium CDC, xử lý giao dịch phân tán và chống mất mát sự kiện thanh toán.',
    whatYouWillLearn: [
      'Áp dụng Saga Pattern điều phối luồng thanh toán',
      'Transactional Outbox Pattern chống mất mát dữ liệu',
      'Định cấu hình Kafka Cluster đa Broker chịu lỗi cao'
    ],
    status: 'PUBLISHED',
    sections: []
  },
  {
    id: 'course_ms_03',
    title: 'Triển khai Microservices Lên Kubernetes & CI/CD GitOps ArgoCD',
    slug: 'deploy-microservices-k8s-argocd',
    category: 'DevOps & Cloud',
    subcategory: 'Kubernetes',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&auto=format&fit=crop&q=80',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    instructor: {
      id: 'inst_03',
      name: 'Kỹ sư Lê Hoàng Nam',
      title: 'DevOps Lead @ TechHub Vietnam',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      bio: 'Chứng chỉ CKA, CKAD và chuyên gia tối ưu hóa hạ tầng Cloud Native.',
      totalStudents: 12100,
      totalCourses: 5,
      rating: 4.9
    },
    rating: 4.9,
    reviewsCount: 940,
    price: 1999000,
    discountPrice: 1499000,
    level: 'Nâng cao',
    durationHours: 28.0,
    totalLessons: 22,
    updatedAt: '09/2026',
    language: 'Tiếng Việt',
    shortDescription: 'Đóng gói Docker tối ưu kích thước, cấu hình Kube Ingress, Helm Chart và GitOps tự động triển khai với ArgoCD.',
    whatYouWillLearn: [
      'Viết Dockerfile Multi-stage build dung lượng nhẹ',
      'Cấu hình Ingress Nginx, Cert-Manager cấp chứng chỉ SSL Let\'s Encrypt',
      'Giám sát cụm bằng Prometheus, Grafana và OpenTelemetry APM'
    ],
    status: 'PENDING',
    sections: []
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_01',
    title: 'Cấp chứng chỉ tốt nghiệp thành công!',
    message: 'Chúc mừng bạn đã hoàn thành 100% khóa học Kiến Trúc Microservices Toàn Diện. Chứng chỉ mã CERT-EDU-2026-98124 đã sẵn sàng.',
    type: 'CERTIFICATE',
    timestamp: '5 phút trước',
    isRead: false,
    link: '#certificate'
  },
  {
    id: 'notif_02',
    title: 'Thanh toán khóa học thành công',
    message: 'Giao dịch chuyển khoản 1.299.000đ cho đơn hàng #ORD-88192 đã được xác nhận qua PayOS.',
    type: 'PAYMENT',
    timestamp: '2 giờ trước',
    isRead: true
  },
  {
    id: 'notif_03',
    title: 'Video bài giảng đã mã hóa HLS xong (FFmpeg)',
    message: 'Hệ thống Media-service đã hoàn tất tối ưu hóa và mã hóa AES-128 cho bài giảng "Cấu hình MinIO Presigned URL".',
    type: 'VIDEO_PROCESSED',
    timestamp: '1 ngày trước',
    isRead: true
  }
];

export const MOCK_DEVICES: DeviceSession[] = [
  {
    deviceId: 'dev_mac_01',
    deviceName: 'MacBook Pro 16" (Apple M2 Max)',
    ipAddress: '113.190.234.12',
    browser: 'Chrome 128.0 (macOS)',
    os: 'macOS Sonoma',
    lastActive: 'Đang hoạt động (Hiện tại)',
    isCurrent: true
  },
  {
    deviceId: 'dev_win_02',
    deviceName: 'PC Gaming Windows 11',
    ipAddress: '14.241.120.45',
    browser: 'Firefox 129.0 (Windows)',
    os: 'Windows 11 Pro',
    lastActive: '3 giờ trước',
    isCurrent: false
  },
  {
    deviceId: 'dev_iphone_03',
    deviceName: 'iPhone 15 Pro Max',
    ipAddress: '113.161.80.99',
    browser: 'Safari Mobile (iOS 17.5)',
    os: 'iOS 17.5.1',
    lastActive: 'Hôm qua, 22:15',
    isCurrent: false
  }
];

export const MOCK_PAYOUTS: PayoutRequest[] = [
  {
    id: 'pay_001',
    instructorId: 'inst_01',
    instructorName: 'TS. Trần Minh Khoa',
    amount: 18500000,
    bankName: 'Vietcombank (Chi nhánh Tân Bình)',
    bankAccount: '0071001234567',
    bankOwner: 'TRAN MINH KHOA',
    status: 'PENDING',
    requestedAt: '10/09/2026 09:30'
  },
  {
    id: 'pay_002',
    instructorId: 'inst_02',
    instructorName: 'ThS. Nguyễn Văn Hùng',
    amount: 12200000,
    bankName: 'Techcombank (Hội sở)',
    bankAccount: '19034567891011',
    bankOwner: 'NGUYEN VAN HUNG',
    status: 'APPROVED',
    requestedAt: '08/09/2026 14:15'
  }
];

export const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_01',
    userName: 'Vũ Mạnh Cường',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    date: '08/09/2026',
    comment: 'Khóa học thực sự chuẩn Production! Phần mã hóa HLS AES-128 và Spring Cloud Gateway giải thích cực kỳ cặn kẽ, mình áp dụng được ngay vào dự án công ty.'
  },
  {
    id: 'rev_02',
    userName: 'Đặng Thúy Nga',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    date: '04/09/2026',
    comment: 'Hệ sinh thái bài giảng mượt mà, sau khi học xong làm bài Quiz đạt yêu cầu là nhận được ngay chứng chỉ PDF có QR code quét ra trang xác thực xịn sò!'
  },
  {
    id: 'rev_03',
    userName: 'Hoàng Quốc Việt',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    rating: 4.8,
    date: '28/08/2026',
    comment: 'Rất ấn tượng với phần tích hợp MinIO Presigned URL trực tiếp từ Browser. Giảm tải server đáng kể.'
  }
];

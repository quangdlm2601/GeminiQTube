# Hướng dẫn sử dụng PWA Music Player

## Tính năng

✅ Nhạc nền loop tự động (auto-play bài tiếp theo khi hết)
✅ Button Play/Pause
✅ Button Next/Back để chuyển bài
✅ Add to Home Screen - chạy ở chế độ standalone
✅ Service Worker để cache và hoạt động offline
✅ Icons PWA chuẩn (192x192 và 512x512)

## Cách sử dụng

### 1. Chạy ứng dụng

```bash
# Cài đặt dependencies
yarn install

# Chạy development server
yarn dev
```

### 2. Test PWA trên Chrome Mobile

#### Bước 1: Deploy hoặc dùng ngrok
PWA cần HTTPS để hoạt động. Bạn có thể:

**Option A: Sử dụng ngrok (nhanh nhất)**
```bash
# Chạy dev server
yarn dev

# Trong terminal khác, chạy ngrok
ngrok http 5173
```

**Option B: Deploy lên Vercel**
```bash
vercel
```

#### Bước 2: Mở trên Chrome Mobile
1. Mở URL (từ ngrok hoặc Vercel) trên Chrome Mobile
2. Chrome sẽ tự động hiện prompt "Add to Home Screen" hoặc bạn có thể:
   - Nhấn menu (3 chấm) → "Add to Home Screen"
3. Đặt tên cho app và nhấn "Add"

#### Bước 3: Mở app ở chế độ Standalone
1. Tìm icon app trên Home Screen
2. Nhấn vào để mở - app sẽ chạy fullscreen không có browser bar

### 3. Sử dụng Music Player

- **Play/Pause**: Nhấn nút giữa để phát/tạm dừng
- **Next**: Nhấn nút mũi tên phải để chuyển bài tiếp theo
- **Back**: Nhấn nút mũi tên trái để quay lại bài trước
- **Loop**: Khi bài hát kết thúc, app tự động chuyển sang bài tiếp theo

## Cấu trúc Files PWA

```
public/
├── manifest.json       # PWA manifest file
├── sw.js              # Service Worker
├── register-sw.js     # Service Worker registration
├── icon-192.png       # Icon 192x192
└── icon-512.png       # Icon 512x512

src/
└── components/
    └── MusicPlayer.tsx # Music Player component với Play/Pause/Next/Back
```

## Kiểm tra PWA

### Trên Chrome Desktop
1. Mở DevTools (F12)
2. Chuyển sang tab "Application"
3. Kiểm tra:
   - Manifest
   - Service Workers
   - Storage/Cache

### Trên Chrome Mobile
1. Mở `chrome://inspect` trên desktop
2. Kết nối device và debug

## Troubleshooting

**PWA không hiện "Add to Home Screen"?**
- Kiểm tra HTTPS (ngrok hoặc deployed)
- Kiểm tra manifest.json đã load đúng
- Kiểm tra Service Worker đã register thành công

**Music không tự động chuyển bài?**
- Kiểm tra MusicPlayer component đã nhận props `onTrackEnd`
- Kiểm tra logic trong App.tsx để tự động next khi track kết thúc

**Service Worker không cache?**
- Xóa cache cũ trong DevTools → Application → Clear Storage
- Unregister service worker cũ và reload

## Technical Notes

- App sử dụng YouTube IFrame API để phát nhạc
- Service Worker cache static assets để tăng tốc load
- Manifest.json config cho standalone mode
- Icons được tạo từ logo.png với kích thước chuẩn PWA

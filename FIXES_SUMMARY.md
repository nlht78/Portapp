# Hướng dẫn khắc phục lỗi và test

## ✅ Đã sửa các lỗi:

### 1. TypeScript Errors
- **$tokenId.tsx**: Sửa lỗi `MultiPricingToken` không thể assign cho `number` - đã thêm `.price` property
- **dashboard.tsx**: Sửa lỗi `IUserTokenResponse` không thể assign cho `any[]` - đã cập nhật để extract `tokens` từ `metadata`

### 2. Null Safety
- Thêm null checks cho tất cả `toLocaleString()` calls
- Thêm null checks cho `token.quantity`, `token.purchasePrice` trong các function helper
- Cập nhật các function helper để handle undefined values

### 3. Service Structure
- Tạo `IUserTokenWithStatsResponse` interface mới
- Cập nhật `getUserTokensWithStats` service để trả về đúng structure
- Sử dụng services thay vì hardcode localhost URLs

## 🔧 Các bước test:

### 1. Kiểm tra TypeScript compilation
```bash
cd client
npm run build
```

### 2. Test local development
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client  
cd client
npm run dev
```

### 3. Test các chức năng:
- ✅ Login/Register
- ✅ Search tokens
- ✅ Add token to portfolio
- ✅ View dashboard
- ✅ View portfolio
- ✅ View token details
- ✅ Transaction history

### 4. Kiểm tra console errors
- Mở Developer Tools (F12)
- Kiểm tra Console tab
- Không nên có lỗi "Cannot read properties of undefined"

## 🚀 Deploy to Production:

### 1. Environment Variables trên Vercel:
```
API_URL=https://portapp-t6ms.onrender.com
API_APIKEY=your-secure-api-key-here
```

### 2. Environment Variables trên Render:
```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
API_APIKEY=your-secure-api-key-here
```

### 3. Redeploy:
- Push code lên GitHub
- Vercel và Render sẽ auto-deploy
- Test lại trên production

## 🐛 Troubleshooting:

### Nếu vẫn có lỗi 500:
1. Kiểm tra server logs trên Render
2. Kiểm tra API endpoints có hoạt động không:
   ```bash
   curl https://portapp-t6ms.onrender.com/api/v1/check-status
   ```

### Nếu có lỗi CORS:
1. Kiểm tra `ALLOWED_ORIGINS` trên Render
2. Đảm bảo URL Vercel đúng format

### Nếu có lỗi authentication:
1. Kiểm tra `API_APIKEY` giống nhau trên cả client và server
2. Kiểm tra JWT token có valid không

## 📝 Notes:
- Tất cả hardcode localhost đã được thay thế bằng services
- Các function helper đã được cập nhật để handle null/undefined values
- Interface structure đã được chuẩn hóa theo pattern của cmsdesk
- Code đã được optimize để tránh runtime errors

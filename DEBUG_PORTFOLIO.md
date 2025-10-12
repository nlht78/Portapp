# Debug Guide: My Portfolio không hiển thị dữ liệu

## 🔍 Các bước debug:

### 1. Kiểm tra Environment Variables

**Tạo file `.env.local` trong thư mục `client/`:**
```bash
# client/.env.local
API_URL=http://localhost:8080
API_APIKEY=your-api-key-here
```

**Kiểm tra server có API key không:**
```bash
# server/.env
API_APIKEY=your-api-key-here
```

### 2. Kiểm tra Console Logs

**Mở Developer Tools (F12) và kiểm tra Console:**
- Tìm logs bắt đầu với `🔧`, `🚀`, `✅`, `❌`
- Kiểm tra có lỗi fetch không
- Kiểm tra API_URL và API_APIKEY có được set đúng không

### 3. Kiểm tra Network Tab

**Trong Developer Tools > Network:**
- Tìm request đến `/api/v1/user-tokens/with-stats`
- Kiểm tra:
  - Request có được gửi không?
  - Status code là gì? (200, 401, 500?)
  - Headers có đúng không?
  - Response data có gì?

### 4. Kiểm tra Server Logs

**Chạy server và kiểm tra console:**
```bash
cd server
npm run dev
```

**Tìm logs:**
- Request đến `/api/v1/user-tokens/with-stats`
- Authentication middleware logs
- Database query logs

### 5. Test API trực tiếp

**Sử dụng script test:**
```bash
node test-user-tokens.js
```

**Hoặc dùng curl:**
```bash
curl -X GET "http://localhost:8080/api/v1/user-tokens/with-stats" \
  -H "x-api-key: your-api-key" \
  -H "x-client-id: your-user-id" \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json"
```

### 6. Kiểm tra Authentication

**Kiểm tra user đã login chưa:**
- Mở Developer Tools > Application > Cookies
- Kiểm tra có session cookie không
- Kiểm tra access token có valid không

**Kiểm tra authentication middleware:**
- Server có nhận được `x-client-id` và `Authorization` header không?
- Token có valid không?

### 7. Kiểm tra Database

**Kiểm tra có user tokens trong database không:**
```bash
# Vào MongoDB và kiểm tra
db.usertokens.find({userId: "your-user-id"})
```

## 🐛 Các lỗi thường gặp:

### 1. **API_URL không đúng**
```
🔧 API_URL: http://localhost:8080
🔧 API_APIKEY: NOT SET
```
**Giải pháp:** Tạo file `.env.local` với API_URL và API_APIKEY

### 2. **Authentication failed (401)**
```
❌ GET /user-tokens/with-stats 401
```
**Giải pháp:** 
- Kiểm tra user đã login chưa
- Kiểm tra access token có valid không
- Kiểm tra `x-client-id` header

### 3. **No data returned (200 but empty)**
```
✅ GET /user-tokens/with-stats 200
📦 Response data: { tokens: [] }
```
**Giải pháp:** 
- User chưa có tokens nào
- Thêm token vào portfolio trước

### 4. **Server error (500)**
```
❌ GET /user-tokens/with-stats 500
```
**Giải pháp:** 
- Kiểm tra server logs
- Kiểm tra database connection
- Kiểm tra authentication middleware

## 🔧 Quick Fixes:

### 1. **Tạo file .env.local:**
```bash
# client/.env.local
API_URL=http://localhost:8080
API_APIKEY=your-api-key-here
```

### 2. **Restart cả client và server:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2  
cd client && npm run dev
```

### 3. **Clear browser cache:**
- Hard refresh (Ctrl+Shift+R)
- Clear cookies và localStorage

### 4. **Kiểm tra user đã có tokens chưa:**
- Login vào app
- Thử add một token vào portfolio
- Sau đó kiểm tra dashboard

## 📞 Nếu vẫn không work:

1. **Chạy script test:** `node test-user-tokens.js`
2. **Chụp screenshot** console logs và network tab
3. **Chia sẻ** server logs và client logs
4. **Kiểm tra** database có data không

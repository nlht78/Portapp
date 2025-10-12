# Deployment Guide

## Vấn đề thường gặp khi deploy

### 1. API không hoạt động (Failed to search tokens, fetch failed)

**Nguyên nhân:**
- Environment variables không được cấu hình đúng
- CORS không cho phép domain client
- API URL không đúng

**Giải pháp:**

#### A. Cấu hình Environment Variables

**Trên Vercel (Client):**
```bash
API_URL=https://your-render-app.onrender.com
API_APIKEY=your_api_key_here
```

**Trên Render (Server):**
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
API_APIKEY=your_api_key_here
```

#### B. Kiểm tra CORS Configuration

Server đã được cấu hình CORS để:
- Cho phép tất cả origins trong development
- Chỉ cho phép origins trong `ALLOWED_ORIGINS` trong production

#### C. Kiểm tra API Endpoints

Đảm bảo các endpoints sau hoạt động:
- `GET /api/v1/coingecko/search?query=bitcoin`
- `GET /api/v1/coingecko/trending`
- `POST /api/v1/user-tokens`

### 2. Cách kiểm tra và debug

#### A. Kiểm tra API trực tiếp
```bash
# Test search endpoint
curl "https://your-render-app.onrender.com/api/v1/coingecko/search?query=bitcoin" \
  -H "x-api-key: your_api_key"

# Test trending endpoint  
curl "https://your-render-app.onrender.com/api/v1/coingecko/trending" \
  -H "x-api-key: your_api_key"
```

#### B. Kiểm tra logs trên Render
1. Vào Render Dashboard
2. Chọn service của bạn
3. Vào tab "Logs"
4. Xem lỗi CORS hoặc API

#### C. Kiểm tra Network tab trong Browser
1. Mở Developer Tools (F12)
2. Vào tab Network
3. Thử search token
4. Xem request failed với lỗi gì

### 3. Các bước khắc phục

#### Bước 1: Cập nhật Environment Variables

**Vercel:**
1. Vào Vercel Dashboard
2. Chọn project
3. Vào Settings > Environment Variables
4. Thêm:
   - `API_URL`: URL Render của bạn
   - `API_APIKEY`: API key từ server

**Render:**
1. Vào Render Dashboard  
2. Chọn service
3. Vào Environment
4. Thêm:
   - `ALLOWED_ORIGINS`: URL Vercel của bạn
   - `API_APIKEY`: API key

#### Bước 2: Redeploy

Sau khi cập nhật environment variables:
1. Redeploy cả client (Vercel) và server (Render)
2. Đợi deploy hoàn tất
3. Test lại

#### Bước 3: Kiểm tra API Key

Đảm bảo API key giống nhau trên cả client và server.

### 4. Troubleshooting

#### Lỗi CORS
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```
**Giải pháp:** Cập nhật `ALLOWED_ORIGINS` trên Render

#### Lỗi 401 Unauthorized
```
401 Unauthorized
```
**Giải pháp:** Kiểm tra `API_APIKEY` có đúng không

#### Lỗi 500 Internal Server Error
```
500 Internal Server Error
```
**Giải pháp:** Kiểm tra logs trên Render để xem lỗi cụ thể

### 5. Test Commands

```bash
# Test server health
curl https://your-render-app.onrender.com/api/v1/check-status

# Test search with API key
curl "https://your-render-app.onrender.com/api/v1/coingecko/search?query=bitcoin" \
  -H "x-api-key: your_api_key"

# Test trending
curl "https://your-render-app.onrender.com/api/v1/coingecko/trending" \
  -H "x-api-key: your_api_key"
```

### 6. Environment Variables Template

**Client (.env.local):**
```bash
API_URL=https://your-render-app.onrender.com
API_APIKEY=your_api_key_here
```

**Server (.env):**
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
API_APIKEY=your_api_key_here
```


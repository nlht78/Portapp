# ✅ GIẢI PHÁP CUỐI CÙNG - Vite Define

## 🔴 Vấn đề

Vercel **KHÔNG** tự động inject `process.env` vào client-side code trong Remix/Vite. 

- Server-side code: `process.env` hoạt động ✅
- Client-side code: `process.env` = undefined ❌

## ✅ Giải pháp

Sử dụng `vite.config.ts` để **define** env vars cho client-side:

```typescript
// client/vite.config.ts
export default defineConfig({
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:8080'),
    'process.env.API_APIKEY': JSON.stringify(process.env.API_APIKEY || ''),
  },
  // ... rest of config
});
```

## 🚀 Deploy

### 1. Commit changes
```bash
git add client/vite.config.ts
git commit -m "fix: define env vars in vite config for client-side access"
git push origin main
```

### 2. Vercel sẽ tự động redeploy

### 3. Kiểm tra
Sau khi deploy xong, mở production site:
- F12 > Network
- Navigate đến `/token/bitcoin`
- Requests phải gọi: `https://portapp-t6ms.onrender.com/api/v1/...`

## 🔍 Cách hoạt động

### Build time:
Vite thay thế:
```typescript
const API_URL = process.env.API_URL || 'http://localhost:8080';
```

Thành:
```typescript
const API_URL = "https://portapp-t6ms.onrender.com" || 'http://localhost:8080';
```

### Vercel Environment Variables:
```
API_URL=https://portapp-t6ms.onrender.com
API_APIKEY=2f63f7523d8617e121c5554d46c8abb6b615ca45475c09f23484fb8ca5f4d3a4
```

Được inject vào `process.env` lúc build → Vite define thay thế → Bundle final có giá trị đúng.

## 📝 Tại sao cần?

**Remix/Vite khác Create React App:**
- CRA: Tự động inject `REACT_APP_*` env vars
- Vite: Chỉ inject `VITE_*` env vars
- Remix: Không tự động inject gì cả

**Giải pháp:**
- Option 1: Đổi tên env vars thành `VITE_API_URL` ❌ (phải sửa nhiều)
- Option 2: Dùng `define` trong vite.config ✅ (đơn giản)

---

**Status:** ✅ Fixed - Ready to deploy  
**Date:** November 25, 2025

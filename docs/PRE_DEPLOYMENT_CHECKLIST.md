# Pre-Deployment Checklist

## ✅ Checklist trước khi đẩy lên Production

### 1. Code Quality
- [x] Đã xóa tất cả file test không cần thiết
- [x] Đã xóa tất cả file debug và documentation tạm thời
- [x] Đã xóa console.log debug (giữ lại console.error/warn)
- [x] Đã xóa code commented không sử dụng
- [x] Đã xóa file data test
- [ ] Đã test lại ứng dụng sau khi cleanup

### 2. Environment Variables

#### Server (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT` đã được set
- [ ] `MONGODB_HOST`, `MONGODB_USER`, `MONGODB_PWD` đã được cấu hình
- [ ] `API_APIKEY` đã được set (khác với development)
- [ ] `COINGECKO_API_KEY` đã được set
- [ ] `MEGALLM_API_KEY` và `MEGALLM_ENDPOINT` đã được set
- [ ] `ALLOWED_ORIGINS` chứa domain frontend production
- [ ] `JWT_SECRET` đã được set (strong secret)

#### Client (.env)
- [ ] `API_URL` trỏ đến server production
- [ ] `API_APIKEY` khớp với server

### 3. Security

- [x] File .env đã được gitignore
- [x] Không có API key hardcoded trong code
- [x] CORS đã được cấu hình đúng
- [ ] SSL/HTTPS đã được enable trên production
- [ ] Database connection sử dụng SSL
- [ ] Rate limiting đã được enable
- [ ] API key authentication đã hoạt động

### 4. Database

- [ ] MongoDB đã được setup trên production
- [ ] Database credentials đã được cấu hình
- [ ] Database backup đã được thiết lập
- [ ] Indexes đã được tạo (nếu cần)
- [ ] Migration scripts đã chạy (nếu có)

### 5. Build & Deploy

#### Server
```bash
cd server
npm install --production
npm run build
# Test build
node dist/server.js
```

#### Client
```bash
cd client
npm install
npm run build
# Test build locally
npm run preview
```

### 6. Testing

- [ ] API endpoints hoạt động đúng
  - [ ] `/api/v1/coingecko/search`
  - [ ] `/api/v1/coingecko/trending`
  - [ ] `/api/v1/user-tokens`
  - [ ] `/api/v1/ai-research/token`
- [ ] Authentication hoạt động
- [ ] CORS hoạt động với frontend domain
- [ ] Error handling hoạt động đúng
- [ ] Logging hoạt động

### 7. Performance

- [ ] Response caching đã được enable
- [ ] Database queries đã được optimize
- [ ] Static files được serve với cache headers
- [ ] Compression middleware đã enable
- [ ] Rate limiting đã được cấu hình

### 8. Monitoring

- [ ] Log rotation đã được cấu hình
- [ ] Error tracking đã được setup (optional)
- [ ] Performance monitoring đã được setup (optional)
- [ ] Uptime monitoring đã được setup (optional)

### 9. Documentation

- [x] README.md đã được cập nhật
- [x] DEPLOYMENT_GUIDE.md đã có
- [x] SECURITY.md đã có
- [ ] API documentation đã được cập nhật
- [ ] Environment variables đã được document

### 10. Git

- [ ] Tất cả changes đã được commit
- [ ] Commit message rõ ràng
- [ ] Branch đã được merge vào main/master
- [ ] Tags đã được tạo cho version (optional)

### 11. Deployment Platform

#### Render (Server)
- [ ] Service đã được tạo
- [ ] Environment variables đã được set
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Health check endpoint đã được cấu hình

#### Vercel (Client)
- [ ] Project đã được tạo
- [ ] Environment variables đã được set
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Domain đã được cấu hình

### 12. Post-Deployment

- [ ] Kiểm tra application hoạt động trên production
- [ ] Kiểm tra logs không có error
- [ ] Test các chức năng chính
- [ ] Monitor performance trong 24h đầu
- [ ] Backup database sau khi deploy thành công

## 🚀 Deploy Commands

### Server (Render)
```bash
# Render sẽ tự động build và deploy khi push code
git push origin main
```

### Client (Vercel)
```bash
# Vercel sẽ tự động build và deploy khi push code
git push origin main
```

## 🆘 Rollback Plan

Nếu có vấn đề sau khi deploy:

1. **Rollback Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Rollback Database** (nếu có migration)
   - Restore từ backup gần nhất

3. **Rollback Environment Variables**
   - Restore từ backup hoặc git history

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trên Render/Vercel
2. Check DEPLOYMENT_GUIDE.md
3. Check SECURITY.md
4. Contact development team

---

**Last Updated:** November 25, 2025  
**Status:** Ready for Review

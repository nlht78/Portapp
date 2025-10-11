# 🚀 CoinGecko API Integration + Token Holders

## ✅ Tính năng đã triển khai

### 1. **CoinGecko API Integration**
- ✅ **Token Information**: Lấy thông tin chi tiết token
- ✅ **Search Tokens**: Tìm kiếm token theo tên/symbol
- ✅ **Trending Tokens**: Danh sách token trending
- ✅ **Price Charts**: Biểu đồ giá với 3 APIs miễn phí
- ✅ **Multi-API Fallback**: CoinGecko → CoinCap → CryptoCompare → Mock Data

### 2. **Token Holders (NEW)**
- ✅ **Top Token Holders**: Xem top 10 ví nắm giữ token ERC-20
- ✅ **Ethplorer Integration**: Sử dụng Ethplorer API
- ✅ **Address Formatting**: Hiển thị địa chỉ rút gọn
- ✅ **Balance Formatting**: Format số lượng token
- ✅ **Share Percentage**: Phần trăm nắm giữ
- ✅ **Etherscan Links**: Link đến Etherscan để xem chi tiết

## 🔧 API Endpoints

### CoinGecko Endpoints
```bash
# Token information
GET /api/v1/coingecko/tokens/{tokenId}

# Search tokens
GET /api/v1/coingecko/search?query={query}

# Trending tokens
GET /api/v1/coingecko/trending

# Price chart data
GET /api/v1/coingecko/tokens/{tokenId}/chart?days={days}
```

### Token Holders Endpoints (NEW)
```bash
# Get top token holders
GET /api/v1/token-holders/{tokenAddress}/holders?limit={limit}

# Get token info
GET /api/v1/token-holders/{tokenAddress}/info

# Get address info
GET /api/v1/token-holders/address/{address}
```

## 📊 Multi-API Fallback System

### Chart Data Sources
1. **CoinGecko API** (Miễn phí với rate limits)
2. **CoinCap API** (Hoàn toàn miễn phí)
3. **CryptoCompare API** (Miễn phí)
4. **Mock Data** (Fallback cuối cùng)

### Token Holders Data Source
- **Ethplorer API** (Miễn phí với API key)

## 🎯 Cách sử dụng

### 1. **Xem thông tin token**
```
http://localhost:5173/token/bitcoin
```

### 2. **Xem biểu đồ giá**
- 1D: Sparkline data
- 7D: Historical data
- 30D: Historical data

### 3. **Xem top token holders (NEW)**
- Chỉ hiển thị cho token ERC-20 có địa chỉ contract
- Hiển thị top 10 ví nắm giữ
- Click "View" để xem chi tiết trên Etherscan

## 🔧 Cấu hình

### Environment Variables
```env
# CoinGecko API (tùy chọn)
COINGECKO_API_KEY=your_api_key_here

# Ethplorer API (tùy chọn)
ETHPLORER_API_KEY=your_api_key_here
```

### API Keys
- **CoinGecko**: Miễn phí 10,000 calls/tháng
- **Ethplorer**: Miễn phí với rate limits

## 📈 Tính năng nổi bật

### ✅ **Hoàn toàn miễn phí**
- Không cần API key trả phí
- Fallback system đảm bảo luôn có dữ liệu

### ✅ **Dữ liệu thực**
- Real-time data từ nhiều nguồn
- Historical price data chính xác
- Token holders data từ blockchain

### ✅ **UI/UX tốt**
- Responsive design
- Loading states
- Error handling
- Interactive charts

## 🚀 Bắt đầu

1. **Khởi động server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Khởi động client**:
   ```bash
   cd client
   npm run dev
   ```

3. **Truy cập**:
   ```
   http://localhost:5173/token/bitcoin
   ```

## 🧪 Testing

### Test Chart API
```bash
cd server
node test-chart-api.js
```

### Test Token Holders API
```bash
cd server
node test-token-holders.js
```

## 📝 Ghi chú

- Token Holders chỉ hoạt động với token ERC-20 trên Ethereum
- Cần có địa chỉ contract token để xem holders
- Data được cung cấp bởi Ethplorer API
- Rate limits có thể áp dụng cho Ethplorer API

---

**🎉 Hệ thống hoàn chỉnh với Chart Data và Token Holders!** 
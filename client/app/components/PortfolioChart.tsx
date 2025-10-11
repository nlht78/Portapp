import React, { useState, useEffect } from 'react';

interface ChartDataPoint {
  date: string;
  value: number;
  profit: number;
  profitPercent: number;
}

interface PortfolioChartProps {
  userTokens: any[];
  marketPrices: Record<string, number>;
  loadingPrices: boolean;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function PortfolioChart({ userTokens, marketPrices, loadingPrices }: PortfolioChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock historical data based on current portfolio
  const generateHistoricalData = (period: TimePeriod): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    let days = 0;
    let interval = 1;

    switch (period) {
      case 'day':
        days = 7;
        interval = 1;
        break;
      case 'week':
        days = 30;
        interval = 1;
        break;
      case 'month':
        days = 90;
        interval = 3;
        break;
      case 'year':
        days = 365;
        interval = 7;
        break;
    }

    // Calculate current portfolio value
    const currentValue = userTokens.reduce((total, token) => {
      const currentPrice = marketPrices[token.tokenId] || token.currentPrice || 0;
      return total + (token.quantity * currentPrice);
    }, 0);

    const currentPurchaseValue = userTokens.reduce((total, token) => {
      return total + (token.quantity * token.purchasePrice);
    }, 0);

    // Generate realistic historical data based on actual purchase dates
    // Tìm ngày mua gần nhất
    const getEarliestPurchaseDate = () => {
      if (userTokens.length === 0) return new Date();
      
      const purchaseDates = userTokens.map(token => {
        const purchaseDate = token.createdAt ? new Date(token.createdAt) : new Date();
        return purchaseDate;
      });
      
      return new Date(Math.min(...purchaseDates.map(d => d.getTime())));
    };

    const earliestPurchaseDate = getEarliestPurchaseDate();
    const daysSinceEarliestPurchase = Math.floor((now.getTime() - earliestPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Bắt đầu từ ngày mua gần nhất, không phải từ days ngày trước
    const startDays = Math.min(days, daysSinceEarliestPurchase);
    let runningValue = currentPurchaseValue;
    
    for (let i = startDays; i >= 0; i -= interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      if (i === startDays) {
        // Start with purchase value
        runningValue = currentPurchaseValue;
      } else {
        // Simulate realistic market movements
        const dailyVolatility = (Math.random() - 0.5) * 0.06; // -3% to +3%
        const trendFactor = Math.sin((startDays - i) / startDays * Math.PI) * 0.02;
        const randomFactor = (Math.random() - 0.5) * 0.01;
        
        const totalChange = dailyVolatility + trendFactor + randomFactor;
        runningValue = runningValue * (1 + totalChange);
      }
      
      const profit = runningValue - currentPurchaseValue;
      const profitPercent = currentPurchaseValue > 0 ? (profit / currentPurchaseValue) * 100 : 0;

      data.push({
        date: date.toISOString().split('T')[0],
        value: runningValue,
        profit: profit,
        profitPercent: profitPercent
      });
    }

    return data;
  };

  // Update chart data when time period or portfolio changes
  useEffect(() => {
    if (userTokens.length === 0) return;
    
    setIsLoading(true);
    const data = generateHistoricalData(timePeriod);
    setChartData(data);
    setIsLoading(false);
  }, [timePeriod, userTokens.length, Object.keys(marketPrices).length]);

  // Calculate current metrics
  const currentValue = userTokens.reduce((total, token) => {
    const currentPrice = marketPrices[token.tokenId] || token.currentPrice || 0;
    return total + (token.quantity * currentPrice);
  }, 0);

  const currentPurchaseValue = userTokens.reduce((total, token) => {
    return total + (token.quantity * token.purchasePrice);
  }, 0);

  const totalProfit = currentValue - currentPurchaseValue;
  const totalProfitPercent = currentPurchaseValue > 0 ? (totalProfit / currentPurchaseValue) * 100 : 0;

  // Calculate 7-day and 30-day profits (CORRECTED LOGIC)
  // Cần xem xét thời gian mua token để tính chính xác
  
  // Tìm ngày mua gần nhất trong portfolio
  const getEarliestPurchaseDate = () => {
    if (userTokens.length === 0) return new Date();
    
    const purchaseDates = userTokens.map(token => {
      // Giả sử token có createdAt field, nếu không thì dùng ngày hiện tại
      const purchaseDate = token.createdAt ? new Date(token.createdAt) : new Date();
      return purchaseDate;
    });
    
    return new Date(Math.min(...purchaseDates.map(d => d.getTime())));
  };

  const earliestPurchaseDate = getEarliestPurchaseDate();
  const now = new Date();
  const daysSincePurchase = Math.floor((now.getTime() - earliestPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));

  // 7-Day Change: 
  // - Nếu mua trong 7 ngày qua: Lợi nhuận từ ngày mua
  // - Nếu mua trước 7 ngày: Thay đổi giá trị trong 7 ngày qua
  let profit7d, profit7dPercent;
  if (daysSincePurchase <= 7) {
    // Mua trong 7 ngày qua: Lợi nhuận từ ngày mua
    profit7d = totalProfit;
    profit7dPercent = totalProfitPercent;
  } else {
    // Mua trước 7 ngày: Thay đổi giá trị trong 7 ngày qua
    const value7dAgo = chartData.length > 6 ? chartData[chartData.length - 7].value : currentValue;
    profit7d = currentValue - value7dAgo;
    profit7dPercent = value7dAgo > 0 ? (profit7d / value7dAgo) * 100 : 0;
  }

  // 30-Day Change:
  // - Nếu mua trong 30 ngày qua: Lợi nhuận từ ngày mua  
  // - Nếu mua trước 30 ngày: Thay đổi giá trị trong 30 ngày qua
  let profit30d, profit30dPercent;
  if (daysSincePurchase <= 30) {
    // Mua trong 30 ngày qua: Lợi nhuận từ ngày mua
    profit30d = totalProfit;
    profit30dPercent = totalProfitPercent;
  } else {
    // Mua trước 30 ngày: Thay đổi giá trị trong 30 ngày qua
    const value30dAgo = chartData.length > 29 ? chartData[chartData.length - 30].value : currentValue;
    profit30d = currentValue - value30dAgo;
    profit30dPercent = value30dAgo > 0 ? (profit30d / value30dAgo) * 100 : 0;
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get color for profit/loss
  const getProfitColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Get background color for profit/loss
  const getProfitBgColor = (value: number) => {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Profit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* 7-Day Profit */}
        <div className={`rounded-lg p-4 ${getProfitBgColor(profit7d)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {daysSincePurchase <= 7 ? '7-Day Profit' : '7-Day Change'}
              </p>
              <p className={`text-lg font-semibold ${getProfitColor(profit7d)}`}>
                {formatCurrency(profit7d)}
              </p>
              <p className={`text-xs ${getProfitColor(profit7dPercent)}`}>
                {formatPercentage(profit7dPercent)}
              </p>
              {daysSincePurchase <= 7 && (
                <p className="text-xs text-gray-500">Since purchase</p>
              )}
            </div>
            <div className="text-2xl">
              {profit7d >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </div>

        {/* 30-Day Profit */}
        <div className={`rounded-lg p-4 ${getProfitBgColor(profit30d)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {daysSincePurchase <= 30 ? '30-Day Profit' : '30-Day Change'}
              </p>
              <p className={`text-lg font-semibold ${getProfitColor(profit30d)}`}>
                {formatCurrency(profit30d)}
              </p>
              <p className={`text-xs ${getProfitColor(profit30dPercent)}`}>
                {formatPercentage(profit30dPercent)}
              </p>
              {daysSincePurchase <= 30 && (
                <p className="text-xs text-gray-500">Since purchase</p>
              )}
            </div>
            <div className="text-2xl">
              {profit30d >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className={`rounded-lg p-4 ${getProfitBgColor(totalProfit)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className={`text-lg font-semibold ${getProfitColor(totalProfit)}`}>
                {formatCurrency(totalProfit)}
              </p>
              <p className={`text-xs ${getProfitColor(totalProfitPercent)}`}>
                {formatPercentage(totalProfitPercent)}
              </p>
            </div>
            <div className="text-2xl">
              {totalProfit >= 0 ? '💰' : '💸'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Portfolio Performance</h3>
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-md transition-colors ${
                  timePeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No data available for chart</p>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full overflow-hidden">
            {/* Responsive SVG Chart */}
            <div className="w-full h-full flex items-center justify-center">
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 800 200" 
                className="max-w-full max-h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {chartData.length > 1 && (() => {
                  // Calculate dynamic scaling based on data range
                  const profitValues = chartData.map(p => p.profitPercent);
                  
                  // Handle edge cases
                  if (profitValues.length === 0) return null;
                  
                  const minProfit = Math.min(...profitValues);
                  const maxProfit = Math.max(...profitValues);
                  const range = maxProfit - minProfit;
                  
                  // Handle case where all values are the same
                  if (range === 0) {
                    const centerValue = minProfit;
                    const padding = Math.max(Math.abs(centerValue) * 0.1, 1);
                    return (
                      <>
                        <rect width="100%" height="100%" fill="#f9fafb" />
                        <line
                          x1="20"
                          y1="100"
                          x2="780"
                          y2="100"
                          stroke={centerValue >= 0 ? "#10b981" : "#ef4444"}
                          strokeWidth="3"
                        />
                        <text x="400" y="100" textAnchor="middle" fontSize="12" fill="#6b7280">
                          {centerValue.toFixed(2)}%
                        </text>
                      </>
                    );
                  }
                  
                  // Add padding to range (20% on each side)
                  const padding = Math.max(range * 0.2, 5); // At least 5% padding
                  const scaledMin = minProfit - padding;
                  const scaledMax = maxProfit + padding;
                  const scaledRange = scaledMax - scaledMin;
                  
                  // Ensure zero line is visible if data crosses zero
                  const zeroInRange = scaledMin <= 0 && scaledMax >= 0;
                  const finalMin = zeroInRange ? Math.min(scaledMin, -Math.abs(scaledMax) * 0.1) : scaledMin;
                  const finalMax = zeroInRange ? Math.max(scaledMax, Math.abs(scaledMin) * 0.1) : scaledMax;
                  const finalRange = finalMax - finalMin;
                  
                  return (
                    <>
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                        <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={totalProfit >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.3"/>
                          <stop offset="100%" stopColor={totalProfit >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Area under curve */}
                      <polygon
                        fill="url(#profitGradient)"
                        points={[
                          `20,180`, // Start at bottom left
                          ...chartData.map((point, index) => {
                            const x = (index / (chartData.length - 1)) * 760 + 20;
                            const y = 180 - ((point.profitPercent - finalMin) / finalRange) * 160;
                            return `${x},${y}`;
                          }),
                          `780,180` // End at bottom right
                        ].join(' ')}
                      />

                      {/* Profit line */}
                      <polyline
                        fill="none"
                        stroke={totalProfit >= 0 ? "#10b981" : "#ef4444"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={chartData.map((point, index) => {
                          const x = (index / (chartData.length - 1)) * 760 + 20;
                          const y = 180 - ((point.profitPercent - finalMin) / finalRange) * 160;
                          return `${x},${y}`;
                        }).join(' ')}
                      />

                      {/* Data points */}
                      {chartData.map((point, index) => {
                        const x = (index / (chartData.length - 1)) * 760 + 20;
                        const y = 180 - ((point.profitPercent - finalMin) / finalRange) * 160;
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="white"
                              stroke={totalProfit >= 0 ? "#10b981" : "#ef4444"}
                              strokeWidth="2"
                              className="hover:r-6 transition-all cursor-pointer"
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r="2"
                              fill={totalProfit >= 0 ? "#10b981" : "#ef4444"}
                            />
                          </g>
                        );
                      })}

                      {/* Zero line */}
                      {zeroInRange && (
                        <line
                          x1="20"
                          y1={180 - ((0 - finalMin) / finalRange) * 160}
                          x2="780"
                          y2={180 - ((0 - finalMin) / finalRange) * 160}
                          stroke="#6b7280"
                          strokeWidth="1"
                          strokeDasharray="5,5"
                        />
                      )}

                      {/* Y-axis labels */}
                      <text x="10" y={180 - ((finalMax - finalMin) / finalRange) * 160 + 5} fontSize="10" fill="#6b7280">
                        {finalMax.toFixed(1)}%
                      </text>
                      <text x="10" y="185" fontSize="10" fill="#6b7280">
                        {finalMin.toFixed(1)}%
                      </text>
                      {zeroInRange && (
                        <text x="10" y={180 - ((0 - finalMin) / finalRange) * 160 + 5} fontSize="10" fill="#6b7280">
                          0%
                        </text>
                      )}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Chart labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
              <span>{chartData[0]?.date}</span>
              <span className="text-center">
                {chartData.length > 0 && (
                  <span className="font-medium">
                    {chartData[chartData.length - 1]?.profitPercent.toFixed(2)}%
                  </span>
                )}
              </span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Chart summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Profit/Loss %</span>
            </div>
            {loadingPrices && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600 mr-2"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            <div>Last updated: {new Date().toLocaleTimeString()}</div>
            <div>Days since purchase: {daysSincePurchase}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

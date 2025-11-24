import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  tokenId: string;
  tokenName: string;
  currentPrice: number;
}

interface ChartData {
  labels: string[];
  prices: number[];
  volumes: number[];
  marketCaps: number[];
}

const timeRanges = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
];

export default function PriceChart({ tokenId, tokenName, currentPrice }: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

    const fetchChartData = async (days: number) => {
    setLoading(true);
    setError(null);
    setIsMockData(false);
    
    try {
      const API_URL = process.env.API_URL || 'http://localhost:8080';
      const API_KEY = process.env.API_APIKEY || '';
      const url = `${API_URL}/api/v1/coingecko/tokens/${tokenId}/chart?days=${days}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.metadata) {
        throw new Error('Invalid response format');
      }
      
      setChartData(data.metadata);
      
      // Check if this is mock data
      if (data.metadata && data.metadata.labels && data.metadata.labels.length > 0) {
        setIsMockData(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(selectedRange);
  }, [tokenId, selectedRange]);

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(8)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const getChartData = () => {
    if (!chartData) return null;

    const priceChange = chartData.prices.length > 1 
      ? ((chartData.prices[chartData.prices.length - 1] - chartData.prices[0]) / chartData.prices[0]) * 100
      : 0;

    const isPositive = priceChange >= 0;

    return {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Price',
          data: chartData.prices,
          borderColor: isPositive ? '#10B981' : '#EF4444',
          backgroundColor: isPositive 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPositive ? '#10B981' : '#EF4444',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return `${tokenName} Price`;
          },
          label: (context: any) => {
            return `Price: ${formatPrice(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: (value: any) => formatPrice(value),
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 6,
        hoverBorderWidth: 2,
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Price Chart</h3>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <button
                key={range.days}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md"
                disabled
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Price Chart</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => fetchChartData(selectedRange)}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = getChartData();
  
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Price Chart</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No chart data available</p>
        </div>
      </div>
    );
  }

  const priceChange = chartData!.prices.length > 1 
    ? ((chartData!.prices[chartData!.prices.length - 1] - chartData!.prices[0]) / chartData!.prices[0]) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Price Chart</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            <span className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
          {isMockData && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Demo Data (Free API Limit Reached)
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedRange === range.days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <Line data={data} options={chartOptions} />
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">24h Volume</p>
          <p className="font-medium text-gray-900">
            {chartData && chartData.volumes.length > 0 
              ? formatVolume(chartData.volumes[chartData.volumes.length - 1])
              : 'N/A'
            }
          </p>
        </div>
        <div>
          <p className="text-gray-500">Market Cap</p>
          <p className="font-medium text-gray-900">
            {chartData && chartData.marketCaps.length > 0 
              ? formatVolume(chartData.marketCaps[chartData.marketCaps.length - 1])
              : 'N/A'
            }
          </p>
        </div>
        <div>
          <p className="text-gray-500">Price Change</p>
          <p className={`font-medium ${
            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
} 
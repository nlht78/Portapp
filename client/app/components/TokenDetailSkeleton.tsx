import React from 'react';

export default function TokenDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="ml-4">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* Description Skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  stage: 'initial' | 'fallback' | 'timeout' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function TokenLoadingState({ stage, message, onRetry }: LoadingStateProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'initial':
        return {
          icon: '🔍',
          title: 'Loading Token Data...',
          description: 'Fetching latest information from CoinPaprika',
          color: 'blue'
        };
      case 'fallback':
        return {
          icon: '⚠️',
          title: 'Switching to Backup Source...',
          description: 'Primary API unavailable, using CoinGecko fallback',
          color: 'yellow'
        };
      case 'timeout':
        return {
          icon: '⏱️',
          title: 'Taking Longer Than Expected...',
          description: 'Please wait while we fetch the data from multiple sources',
          color: 'orange'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Failed to Load Token Data',
          description: message || 'Unable to fetch token information at this time',
          color: 'red'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">{stageInfo.icon}</div>
          <h2 className={`text-xl font-semibold mb-2 text-${stageInfo.color}-800`}>
            {stageInfo.title}
          </h2>
          <p className="text-gray-600 mb-6">{stageInfo.description}</p>
          
          {stage !== 'error' && (
            <div className="flex items-center justify-center mb-4">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${stageInfo.color}-600`}></div>
            </div>
          )}

          {stage === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Try Again
            </button>
          )}

          {stage === 'timeout' && (
            <div className="text-sm text-gray-500">
              This usually takes 2-5 seconds. If it's taking longer, there might be high API traffic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

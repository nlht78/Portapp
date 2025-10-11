import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  totalTokens: number;
  marketPrices: Record<string, number>;
  loadingPrices: boolean;
  lastUpdate: Date | null;
  source: string;
}

interface PortfolioContextType {
  portfolioData: PortfolioData;
  updatePortfolioData: (data: Partial<PortfolioData>) => void;
  updateMarketPrices: (prices: Record<string, number>, source: string) => void;
  refreshPrices: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: ReactNode;
  initialData?: Partial<PortfolioData>;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ 
  children, 
  initialData 
}) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    totalTokens: 0,
    marketPrices: {},
    loadingPrices: false,
    lastUpdate: null,
    source: 'unknown',
    ...initialData
  });

  const updatePortfolioData = useCallback((data: Partial<PortfolioData>) => {
    setPortfolioData(prev => {
      // Chỉ update nếu có thay đổi thực sự
      const hasChanges = Object.keys(data).some(key => {
        if (key === 'lastUpdate') return false; // Bỏ qua lastUpdate
        return prev[key as keyof PortfolioData] !== data[key as keyof PortfolioData];
      });
      
      if (!hasChanges) return prev;
      
      return {
        ...prev,
        ...data,
        lastUpdate: new Date()
      };
    });
  }, []);

  const updateMarketPrices = useCallback((prices: Record<string, number>, source: string) => {
    setPortfolioData(prev => ({
      ...prev,
      marketPrices: prices,
      source,
      lastUpdate: new Date()
    }));
  }, []);

  const refreshPrices = useCallback(() => {
    setPortfolioData(prev => ({
      ...prev,
      loadingPrices: true
    }));
  }, []);

  const contextValue = useMemo(() => ({
    portfolioData,
    updatePortfolioData,
    updateMarketPrices,
    refreshPrices
  }), [portfolioData, updatePortfolioData, updateMarketPrices, refreshPrices]);

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};

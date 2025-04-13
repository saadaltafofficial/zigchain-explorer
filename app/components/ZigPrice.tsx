import React, { useEffect, useState } from 'react';
import { getCoinPriceData, CoinPriceData } from '../services/coingecko';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface ZigPriceProps {
  coinId?: string; // CoinGecko ID for the coin
  className?: string;
  showDetails?: boolean;
}

const ZigPrice: React.FC<ZigPriceProps> = ({ 
  coinId = 'zig-finance', // Default to Zig Finance
  className = '',
  showDetails = false
}) => {
  const [priceData, setPriceData] = useState<CoinPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getCoinPriceData(coinId);
        setPriceData(data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
        setLoading(false);
      }
    };

    fetchPriceData();

    // Refresh price data every 2 minutes
    const intervalId = setInterval(fetchPriceData, 120000);
    
    return () => clearInterval(intervalId);
  }, [coinId]);

  // Format price with appropriate decimal places
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <Loader2 size={16} className="animate-spin mr-2 text-gray-400" />
        <span className="text-gray-500">Loading price...</span>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className={`text-gray-500 ${className}`}>
        Price unavailable
      </div>
    );
  }

  const priceChangeColor = priceData.price_change_percentage_24h >= 0 
    ? 'text-green-500' 
    : 'text-red-500';

  const PriceChangeIcon = priceData.price_change_percentage_24h >= 0 
    ? ArrowUp 
    : ArrowDown;

  return (
    <div className={`${className}`}>
      {/* Basic price display */}
      <div className="flex items-center">
        {priceData.image && (
          <img 
            src={priceData.image} 
            alt={priceData.name} 
            className="w-6 h-6 mr-2 rounded-full"
          />
        )}
        <span className="font-medium">{priceData.name}</span>
        <span className="ml-2 font-bold">${formatPrice(priceData.current_price)}</span>
        <div className={`flex items-center ml-2 ${priceChangeColor}`}>
          <PriceChangeIcon size={14} className="mr-1" />
          <span>{Math.abs(priceData.price_change_percentage_24h).toFixed(2)}%</span>
        </div>
      </div>

      {/* Detailed stats (optional) */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Market Cap</div>
            <div className="font-medium">{formatLargeNumber(priceData.market_cap)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-1">24h Volume</div>
            <div className="font-medium">{formatLargeNumber(priceData.total_volume)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Circulating Supply</div>
            <div className="font-medium">
              {priceData.circulating_supply.toLocaleString()} {priceData.symbol.toUpperCase()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-1">7d Change</div>
            <div className={priceData.price_change_percentage_7d >= 0 ? 'text-green-500' : 'text-red-500'}>
              {priceData.price_change_percentage_7d >= 0 ? '+' : ''}
              {priceData.price_change_percentage_7d?.toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZigPrice;

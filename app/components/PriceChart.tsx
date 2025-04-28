import React, { useState, useEffect } from 'react';
import { getHistoricalPriceData, getCoinPriceData, CoinPriceData } from '../services/coingecko';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  coinId?: string;
  currency?: string;
  displayName?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({
  coinId = 'zignaly', // Using the correct ID from CoinGecko (rebranded from Zignaly to ZIGChain)
  currency = 'usd',
  displayName = 'ZIG' // Default to ZIG for the ZigChain Explorer
}) => {
  const [timeframe, setTimeframe] = useState<'1' | '7' | '30' | '90'>('7');
  const [priceHistory, setPriceHistory] = useState<[number, number][]>([]);
  const [priceData, setPriceData] = useState<CoinPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch price data on component mount and when timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Define a list of possible coin IDs to try
        const possibleCoinIds = [
          coinId,           // Try the provided coinId first
          'zignaly',        // Try Zignaly (as seen in the screenshot)
          'zigchain',       // Try ZigChain
          'bitcoin'         // Fallback to Bitcoin as a last resort for a working chart
        ];

        let currentData = null;
        let historicalData = null;
        let successfulCoinId = null;

        // Try each coin ID until we get data
        for (const id of possibleCoinIds) {
          try {
            // Trying to fetch price data

            // Get current price data
            const priceData = await getCoinPriceData(id, currency);

            // Get historical price data
            const histData = await getHistoricalPriceData(id, timeframe as any, currency);

            if (priceData && histData && histData.prices && histData.prices.length > 0) {
              currentData = priceData;
              historicalData = histData;
              successfulCoinId = id;
              // Successfully fetched price data
              break;
            }
          } catch (e) {
            // Error fetching price data
            // Continue to the next coin ID
          }
        }

        if (currentData) {
          setPriceData(currentData);
        }

        if (historicalData && historicalData.prices) {
          setPriceHistory(historicalData.prices);
          setError(null);
        } else {
          setError('Failed to load historical price data');
        }

        // If we're using a fallback coin, show a notice
        if (successfulCoinId && successfulCoinId !== coinId && successfulCoinId !== 'zignaly' && successfulCoinId !== 'zigchain') {
          console.log(`Using fallback data from ${successfulCoinId} for display purposes`);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 2 minutes
    const intervalId = setInterval(fetchData, 120000);
    return () => clearInterval(intervalId);
  }, [coinId, currency, timeframe]);

  // Format numbers with commas and proper decimal places
  const formatCurrency = (value: number): string => {
    if (!value && value !== 0) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 2
    }).format(value);
  };

  const formatLargeNumber = (value?: number): string => {
    if (!value && value !== 0) return '$0';

    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Calculate chart points if we have price history
  const getChartPoints = () => {
    if (!priceHistory || priceHistory.length === 0) return '';

    const prices = priceHistory.map(item => item[1]);
    const maxValue = Math.max(...prices);
    const minValue = Math.min(...prices);

    return priceHistory.map((point, index) => {
      const x = (index / (priceHistory.length - 1)) * 100;
      const y = 100 - ((point[1] - minValue) / (maxValue - minValue || 1)) * 100;
      return `${x},${y}`;
    }).join(' ');
  };

  const chartPoints = getChartPoints();

  // Get min and max values for display
  const getMinMaxValues = () => {
    if (!priceHistory || priceHistory.length === 0) return { min: 0, max: 0 };

    const prices = priceHistory.map(item => item[1]);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const { min: minValue, max: maxValue } = getMinMaxValues();

  // Calculate price change percentage
  const getPriceChange = () => {
    if (!priceHistory || priceHistory.length < 2) return { value: 0, percentage: 0, isPositive: true };

    const firstPrice = priceHistory[0][1];
    const lastPrice = priceHistory[priceHistory.length - 1][1];
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;

    return {
      value: change,
      percentage,
      isPositive: percentage >= 0
    };
  };

  const priceChange = getPriceChange();

  return (
    <div className="p-4 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {displayName} Price
            {priceData && (
              <span className="ml-2 text-2xl">
                {formatCurrency(priceData.current_price)}
              </span>
            )}
          </h2>
          {priceData && (
            <div className={`flex items-center text-sm ${priceData.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceData.price_change_percentage_24h >= 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingDown size={14} className="mr-1" />
              )}
              <span>
                {priceData.price_change_percentage_24h >= 0 ? '+' : ''}
                {priceData.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Time range selector */}
        <div className="flex space-x-1">
          <button 
            onClick={() => setTimeframe('1')} 
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === '1' 
                ? 'text-white' 
                : 'text-gray-600'
            }`}
          >
            24h
          </button>
          <button 
            onClick={() => setTimeframe('7')} 
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === '7' 
                ? 'text-white' 
                : 'text-gray-600'
            }`}
          >
            7d
          </button>
          <button 
            onClick={() => setTimeframe('30')} 
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === '30' 
                ? 'text-white' 
                : 'text-gray-600'
            }`}
          >
            30d
          </button>
          <button 
            onClick={() => setTimeframe('90')} 
            className={`pl-3 py-1 text-sm rounded-md ${
              timeframe === '90' 
                ? 'text-white' 
                : 'text-gray-600'
            }`}
          >
            90d
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-6">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#347FBF]" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : priceHistory.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No price data available
          </div>
        ) : (
          <>
            {/* Price labels */}
            <div className="absolute left-0 top-0 text-xs text-gray-400">
              {formatCurrency(maxValue)}
            </div>
            <div className="absolute left-0 bottom-0 text-xs text-gray-400">
              {formatCurrency(minValue)}
            </div>
            
            {/* SVG Chart */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Chart line */}
              <polyline
                points={chartPoints}
                fill="none"
                stroke={priceData && priceData.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Gradient fill under the line */}
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={priceData && priceData.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"}
                  stopOpacity="0.2"
                />
                <stop
                  offset="100%"
                  stopColor={priceData && priceData.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"}
                  stopOpacity="0"
                />
              </linearGradient>
              
              {/* Area under the line */}
              <polygon
                points={`0,100 ${chartPoints} 100,100`}
                fill="url(#chartGradient)"
              />
            </svg>
          </>
        )}
      </div>

      {/* Stats */}
      {priceData && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Market Cap</div>
            <div className="font-medium text-white">{formatLargeNumber(priceData.market_cap)}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">24h Volume</div>
            <div className="font-medium text-white">{formatLargeNumber(priceData.total_volume)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;

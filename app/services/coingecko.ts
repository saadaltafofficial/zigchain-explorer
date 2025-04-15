import axios from 'axios';

// Create a custom axios instance with timeout and headers
const api = axios.create({
  timeout: 15000, // 15 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Helper function to get or set cache
const getOrSetCache = async (key: string, fetcher: () => Promise<any>) => {
  const now = Date.now();
  const cached = cache[key];
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached data for ${key}`);
    return cached.data;
  }
  
  try {
    const data = await fetcher();
    cache[key] = { data, timestamp: now };
    return data;
  } catch (error) {
    // If we have stale cache, return it in case of error
    if (cached) {
      console.log(`Using stale cached data for ${key} due to error`);
      return cached.data;
    }
    throw error;
  }
};

// CoinGecko API base URL and configuration
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-1GJ74LknZhC7x1MsvtehVPk6';

// Interface for coin price data
export interface CoinPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number;
  image: string;
  last_updated: string;
}

// Interface for historical price data
export interface HistoricalPriceData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][]; // [timestamp, market_cap]
  total_volumes: [number, number][]; // [timestamp, volume]
}

/**
 * Get current price data for a specific coin
 * @param coinId - The CoinGecko ID for the coin (e.g., 'bitcoin', 'ethereum')
 * @param currency - The currency to get prices in (default: 'usd')
 */
export const getCoinPriceData = async (coinId: string, currency = 'usd'): Promise<CoinPriceData | null> => {
  const cacheKey = `price_${coinId}_${currency}`;
  
  try {
    return await getOrSetCache(cacheKey, async () => {
      console.log(`Fetching price data for ${coinId} in ${currency}`);
      
      const params: Record<string, any> = {
        vs_currency: currency,
        ids: coinId,
        order: 'market_cap_desc',
        per_page: 1,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h,7d,30d',
        x_cg_api_key: API_KEY
      };
      
      const response = await api.get(`${COINGECKO_API_URL}/coins/markets`, { params });

      if (response.data && response.data.length > 0) {
        console.log('Price data received successfully');
        return response.data[0];
      }
      console.log('No price data received');
      return null;
    });
  } catch (error) {
    console.error('Error fetching coin price data:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    return null;
  }
};

/**
 * Get historical price data for a specific coin
 * @param coinId - The CoinGecko ID for the coin
 * @param days - Number of days of data to retrieve (1, 7, 14, 30, 90, 180, 365, max)
 * @param currency - The currency to get prices in (default: 'usd')
 */
export const getHistoricalPriceData = async (
  coinId: string, 
  days: number | 'max' = 30, 
  currency = 'usd'
): Promise<HistoricalPriceData | null> => {
  const cacheKey = `history_${coinId}_${days}_${currency}`;
  
  try {
    return await getOrSetCache(cacheKey, async () => {
      console.log(`Fetching historical price data for ${coinId} over ${days} days in ${currency}`);
      const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
      
      const params: Record<string, any> = {
        vs_currency: currency,
        days: days,
        interval: days === 1 ? 'hourly' : 'daily',
        x_cg_api_key: API_KEY
      };
      
      console.log('Request params:', params);
      
      const response = await api.get(url, { params });

      if (response.data) {
        console.log('Historical price data received successfully');
        return response.data;
      }
      console.log('No data received from API');
      return null;
    });
  } catch (error) {
    console.error('Error fetching historical price data:', error);
    // Add more detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // If rate limited, wait and retry once
      if (error.response?.status === 429) {
        console.log('Rate limited, retrying after 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
          const params: Record<string, any> = {
            vs_currency: currency,
            days: days,
            interval: days === 1 ? 'hourly' : 'daily',
            x_cg_api_key: API_KEY
          };
          const retryResponse = await api.get(url, { params });
          if (retryResponse.data) {
            console.log('Retry successful');
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    }
    return null;
  }
};

/**
 * Search for coins by name or symbol
 * @param query - Search query
 */
export const searchCoins = async (query: string): Promise<any[]> => {
  const cacheKey = `search_${query}`;
  
  try {
    return await getOrSetCache(cacheKey, async () => {
      const params: Record<string, any> = { 
        query,
        x_cg_api_key: API_KEY
      };
      
      const response = await api.get(`${COINGECKO_API_URL}/search`, { params });

      if (response.data && response.data.coins) {
        return response.data.coins;
      }
      return [];
    });
  } catch (error) {
    console.error('Error searching coins:', error);
    if (axios.isAxiosError(error)) {
      console.error('Search API Error:', error.message);
    }
    return [];
  }
};

/**
 * Get global cryptocurrency market data
 */
export const getGlobalMarketData = async (): Promise<any | null> => {
  const cacheKey = 'global_market';
  
  try {
    return await getOrSetCache(cacheKey, async () => {
      const params: Record<string, any> = {
        x_cg_api_key: API_KEY
      };
      
      const response = await api.get(`${COINGECKO_API_URL}/global`, { params });

      if (response.data) {
        return response.data;
      }
      return null;
    });
  } catch (error) {
    console.error('Error fetching global market data:', error);
    if (axios.isAxiosError(error)) {
      console.error('Global Market API Error:', error.message);
    }
    return null;
  }
};

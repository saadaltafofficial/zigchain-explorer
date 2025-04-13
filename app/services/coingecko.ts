import axios from 'axios';

// CoinGecko API base URL
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
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: currency,
        ids: coinId,
        order: 'market_cap_desc',
        per_page: 1,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h,7d,30d',
        x_cg_api_key: API_KEY
      }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching coin price data:', error);
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
  try {
    console.log(`Fetching historical price data for ${coinId} over ${days} days in ${currency}`);
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
    console.log('API URL:', url);
    
    const params = {
      vs_currency: currency,
      days: days,
      interval: days === 1 ? 'hourly' : 'daily',
      x_cg_api_key: API_KEY
    };
    console.log('Request params:', params);
    
    const response = await axios.get(url, { params });

    if (response.data) {
      console.log('Historical price data received successfully');
      return response.data;
    }
    console.log('No data received from API');
    return null;
  } catch (error) {
    console.error('Error fetching historical price data:', error);
    // Add more detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return null;
  }
};

/**
 * Search for coins by name or symbol
 * @param query - Search query
 */
export const searchCoins = async (query: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/search`, {
      params: {
        query: query,
        x_cg_api_key: API_KEY
      }
    });

    if (response.data && response.data.coins) {
      return response.data.coins;
    }
    return [];
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
};

/**
 * Get global cryptocurrency market data
 */
export const getGlobalMarketData = async (): Promise<any | null> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/global`, {
      params: {
        x_cg_api_key: API_KEY
      }
    });

    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    return null;
  }
};

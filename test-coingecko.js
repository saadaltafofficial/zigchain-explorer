// Test script for CoinGecko API
const axios = require('axios');

// Create a custom axios instance with timeout and headers
const api = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// CoinGecko API base URL and configuration
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-1GJ74LknZhC7x1MsvtehVPk6';

// Test getting price data
async function testGetCoinPrice() {
  try {
    console.log('Testing CoinGecko API - Getting price data for bitcoin...');
    
    const params = {
      vs_currency: 'usd',
      ids: 'bitcoin',
      order: 'market_cap_desc',
      per_page: 1,
      page: 1,
      sparkline: false,
      price_change_percentage: '24h,7d,30d',
      x_cg_api_key: API_KEY
    };
    
    const response = await api.get(`${COINGECKO_API_URL}/coins/markets`, { params });

    if (response.data && response.data.length > 0) {
      console.log('✅ Price data received successfully');
      console.log(`Bitcoin price: $${response.data[0].current_price}`);
      return true;
    }
    console.log('❌ No price data received');
    return false;
  } catch (error) {
    console.error('❌ Error fetching coin price data:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });
    }
    return false;
  }
}

// Test getting historical data
async function testGetHistoricalData() {
  try {
    console.log('\nTesting CoinGecko API - Getting historical data for bitcoin...');
    
    const coinId = 'bitcoin';
    const days = 7;
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
    
    const params = {
      vs_currency: 'usd',
      days: days,
      interval: 'daily',
      x_cg_api_key: API_KEY
    };
    
    const response = await api.get(url, { params });

    if (response.data && response.data.prices) {
      console.log('✅ Historical price data received successfully');
      console.log(`Received ${response.data.prices.length} price points`);
      return true;
    }
    console.log('❌ No historical data received');
    return false;
  } catch (error) {
    console.error('❌ Error fetching historical price data:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });
    }
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Starting CoinGecko API tests...\n');
  
  const priceTestResult = await testGetCoinPrice();
  const historicalTestResult = await testGetHistoricalData();
  
  console.log('\nTest Results:');
  console.log(`Price data test: ${priceTestResult ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Historical data test: ${historicalTestResult ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (priceTestResult && historicalTestResult) {
    console.log('\n✅ All tests passed! CoinGecko API is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

// Execute tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});

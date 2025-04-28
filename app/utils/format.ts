// Format date to a readable format
export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
};

// Format blockchain time to relative time (e.g., '5 minutes ago')
export const formatBlockTime = (timeString: string): string => {
  try {
    if (!timeString) return 'Unknown time';
    
    // Log the timestamp for debugging
    console.log('Processing timestamp:', timeString);
    
    let date: Date;
    
    // Handle the specific format from the API: 2025-04-26T08:17:37.985273
    // This format is missing the timezone indicator (Z)
    if (timeString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/)) {
      // Add Z to indicate UTC if it's missing
      date = new Date(timeString + 'Z');
      console.log('Added Z to timestamp:', timeString + 'Z');
    } else {
      // Standard parsing for other formats
      date = new Date(timeString);
    }
    
    // Check if date parsing was successful
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', timeString);
      
      // Try manual parsing as a last resort
      const manualParsed = parseManualTimestamp(timeString);
      if (manualParsed) {
        date = manualParsed;
      } else {
        return 'Invalid date';
      }
    }
    
    // Log the parsed date for debugging
    console.log('Parsed date:', date.toISOString());
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  } catch (error) {
    console.error('Error formatting block time:', error, 'for timestamp:', timeString);
    return 'Invalid date';
  }
};

// Helper function to manually parse timestamps if standard parsing fails
function parseManualTimestamp(timeString: string): Date | null {
  try {
    // Try to parse format: 2025-04-26T08:17:37.985273
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d+)$/;
    const match = timeString.match(regex);
    
    if (match) {
      const [_, year, month, day, hour, minute, second, fraction] = match;
      console.log('Manual parse components:', { year, month, day, hour, minute, second, fraction });
      
      // JavaScript months are 0-indexed
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
        parseInt(fraction.substring(0, 3)) // Take only milliseconds part
      );
      
      console.log('Manually parsed date:', date.toISOString());
      return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error in manual timestamp parsing:', error);
    return null;
  }
};

// Format large numbers with commas
export const formatNumber = (num: number): string => {
  try {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
};

// Truncate strings (like addresses or hashes)
export const truncateString = (str: string, startChars: number = 8, endChars: number = 8): string => {
  try {
    if (str === null || str === undefined) return 'Unknown';
    
    // Ensure str is a string
    const strValue = String(str);
    
    if (strValue.length <= startChars + endChars) return strValue;
    return `${strValue.substring(0, startChars)}...${strValue.substring(strValue.length - endChars)}`;
  } catch (error) {
    console.error('Error truncating string:', error);
    return 'Error';
  }
};

// Format token amounts with proper decimals
export const formatTokenAmount = (amount: string | number, decimals: number = 6): string => {
  try {
    if (amount === null || amount === undefined) return '0';
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if num is a valid number
    if (isNaN(num)) return '0';
    
    const divisor = Math.pow(10, decimals);
    return (num / divisor).toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6 
    });
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

// Convert uzig to ZIG (1 ZIG = 1,000,000 uzig)
export const convertUzigToZig = (amount: string | undefined): string => {
  try {
    // Check if the input is a valid string
    if (!amount) return '0 ZIG';
    
    // Extract the numeric part and the denomination
    const parts = amount.trim().split(' ');
    const numericPart = parts[0];
    const denom = parts.length > 1 ? parts[1].toLowerCase() : '';
    
    // If the denomination is not uzig, return the original amount
    if (denom !== 'uzig') return amount;
    
    // Convert uzig to ZIG
    const uzigAmount = parseFloat(numericPart);
    if (isNaN(uzigAmount)) return '0 ZIG';
    
    const zigAmount = uzigAmount / 1000000;
    
    // Format with appropriate precision
    return `${zigAmount.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6 
    })} ZIG`;
  } catch (error) {
    console.error('Error converting uzig to ZIG:', error);
    return amount || '0 ZIG'; // Return original amount or default on error
  }
};

// Format percentage values
export const formatPercentage = (value: string | number): string => {
  try {
    if (value === null || value === undefined) return '0%';
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if num is a valid number
    if (isNaN(num)) return '0%';
    
    // Multiply by 100 if the value is in decimal form (e.g., 0.05 for 5%)
    const percentage = num < 1 ? num * 100 : num;
    
    return `${percentage.toFixed(2)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
};

// Format address for display
export const formatAddress = (address: string): string => {
  try {
    if (!address) return 'Unknown address';
    
    // For long addresses, truncate the middle
    if (address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    }
    
    return address;
  } catch (error) {
    console.error('Error formatting address:', error);
    return 'Error formatting address';
  }
};

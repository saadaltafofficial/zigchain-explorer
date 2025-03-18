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
export const truncateString = (str: any, startChars: number = 8, endChars: number = 8): string => {
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

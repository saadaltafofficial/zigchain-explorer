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

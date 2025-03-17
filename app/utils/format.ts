// Format date to a readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Format large numbers with commas
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Truncate strings (like addresses or hashes)
export const truncateString = (str: any, startChars: number = 8, endChars: number = 8): string => {
  if (str === null || str === undefined) return '';
  
  // Ensure str is a string
  const strValue = String(str);
  
  if (strValue.length <= startChars + endChars) return strValue;
  return `${strValue.substring(0, startChars)}...${strValue.substring(strValue.length - endChars)}`;
};

// Format token amounts with proper decimals
export const formatTokenAmount = (amount: string | number, decimals: number = 6): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  return (num / divisor).toLocaleString(undefined, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 6 
  });
};

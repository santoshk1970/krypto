/**
 * Mathematical utility functions for market data analysis
 */

/**
 * Generate realistic price movement using random walk with volatility
 * @param {number} currentPrice - Current price
 * @param {number} volatility - Price volatility (0.01 = 1%)
 * @returns {number} New price
 */
function generatePriceMovement(currentPrice, volatility = 0.02) {
  const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
  const change = currentPrice * volatility * randomFactor;
  return Math.max(0.001, currentPrice + change); // Ensure price doesn't go negative
}

/**
 * Generate OHLC data for a single interval
 * @param {number} openPrice - Opening price
 * @param {number} volatility - Price volatility
 * @returns {Object} OHLC data
 */
function generateOHLC(openPrice, volatility = 0.015) {
  const prices = [openPrice];
  
  // Generate 3 additional price points within the interval
  for (let i = 0; i < 3; i++) {
    const nextPrice = generatePriceMovement(prices[prices.length - 1], volatility);
    prices.push(nextPrice);
  }
  
  const closePrice = prices[prices.length - 1];
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);
  
  return {
    open: parseFloat(openPrice.toFixed(6)),
    high: parseFloat(highPrice.toFixed(6)),
    low: parseFloat(lowPrice.toFixed(6)),
    close: parseFloat(closePrice.toFixed(6))
  };
}

/**
 * Calculate Simple Moving Average
 * @param {Array} prices - Array of prices
 * @param {number} period - Period for SMA
 * @returns {number} Simple Moving Average
 */
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return parseFloat((sum / period).toFixed(6));
}

/**
 * Calculate SMA series for entire dataset
 * @param {Array} prices - Array of prices
 * @param {number} period - Period for SMA
 * @returns {Array} Array of SMA values
 */
function calculateSMASeries(prices, period) {
  if (prices.length < period) return [];
  
  const smaValues = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, price) => acc + price, 0);
    smaValues.push(parseFloat((sum / period).toFixed(6)));
  }
  return smaValues;
}

/**
 * Calculate price change percentage
 * @param {number} oldPrice 
 * @param {number} newPrice 
 * @returns {number} Percentage change
 */
function calculatePercentageChange(oldPrice, newPrice) {
  if (oldPrice === 0) return 0;
  return parseFloat(((newPrice - oldPrice) / oldPrice * 100).toFixed(2));
}

/**
 * Calculate volatility (standard deviation of returns)
 * @param {Array} prices 
 * @returns {number} Volatility
 */
function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const mean = returns.reduce((acc, ret) => acc + ret, 0) / returns.length;
  const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return parseFloat(Math.sqrt(variance).toFixed(6));
}

/**
 * Round to specified decimal places
 * @param {number} number 
 * @param {number} decimals 
 * @returns {number} Rounded number
 */
function roundToDecimals(number, decimals = 6) {
  return parseFloat(number.toFixed(decimals));
}

module.exports = {
  generatePriceMovement,
  generateOHLC,
  calculateSMA,
  calculateSMASeries,
  calculatePercentageChange,
  calculateVolatility
};

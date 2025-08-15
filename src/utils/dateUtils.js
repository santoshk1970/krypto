/**
 * Date and time utility functions for market data
 */

/**
 * Generate market trading hours (8:00 AM to 8:00 PM) for a given date
 * @param {Date} date - The date to generate trading hours for
 * @returns {Array} Array of timestamps for 15-minute intervals
 */
function generateTradingHours(date) {
  const timestamps = [];
  const startHour = 8; // 8:00 AM
  const endHour = 20;  // 8:00 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timestamp = new Date(date);
      timestamp.setHours(hour, minute, 0, 0);
      timestamps.push(new Date(timestamp));
    }
  }
  
  return timestamps;
}

/**
 * Generate timestamps for multiple days
 * @param {Date} startDate - Starting date
 * @param {number} days - Number of days
 * @returns {Array} Array of all timestamps
 */
function generateMultiDayTimestamps(startDate, days) {
  const allTimestamps = [];
  
  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    const dayTimestamps = generateTradingHours(currentDate);
    allTimestamps.push(...dayTimestamps);
  }
  
  return allTimestamps;
}

/**
 * Format timestamp to ISO string
 * @param {Date} timestamp 
 * @returns {string} ISO formatted timestamp
 */
function formatTimestamp(timestamp) {
  return timestamp.toISOString();
}

/**
 * Get trading day info
 * @param {Date} date 
 * @returns {Object} Trading day information
 */
function getTradingDayInfo(date) {
  const startTime = new Date(date);
  startTime.setHours(8, 0, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(20, 0, 0, 0);
  
  return {
    date: date.toDateString(),
    startTime: startTime,
    endTime: endTime,
    duration: 12, // hours
    intervals: 48 // 15-minute intervals
  };
}

module.exports = {
  generateTradingHours,
  generateMultiDayTimestamps,
  formatTimestamp,
  getTradingDayInfo
};

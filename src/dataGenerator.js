const fs = require('fs');
const path = require('path');
const { generateMultiDayTimestamps, formatTimestamp } = require('./utils/dateUtils');
const { generateOHLC } = require('./utils/mathUtils');

/**
 * Crypto token configuration
 */
const TOKENS = [
  { id: 'BTC', name: 'Bitcoin', basePrice: 43000, volatility: 0.025 },
  { id: 'ETH', name: 'Ethereum', basePrice: 2600, volatility: 0.03 },
  { id: 'ADA', name: 'Cardano', basePrice: 0.45, volatility: 0.04 },
  { id: 'SOL', name: 'Solana', basePrice: 98, volatility: 0.045 },
  { id: 'DOT', name: 'Polkadot', basePrice: 7.2, volatility: 0.035 },
  { id: 'LINK', name: 'Chainlink', basePrice: 14.5, volatility: 0.04 },
  { id: 'MATIC', name: 'Polygon', basePrice: 0.85, volatility: 0.05 },
  { id: 'AVAX', name: 'Avalanche', basePrice: 36, volatility: 0.042 },
  { id: 'ATOM', name: 'Cosmos', basePrice: 10.3, volatility: 0.038 },
  { id: 'ALGO', name: 'Algorand', basePrice: 0.18, volatility: 0.045 }
];

/**
 * Generate sample market data for all tokens
 */
function generateSampleData() {
  console.log('🚀 Generating crypto market data...');
  
  // Generate timestamps for 5 days starting from today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 4); // Start 4 days ago to include today
  const timestamps = generateMultiDayTimestamps(startDate, 5);
  
  console.log(`📅 Generated ${timestamps.length} timestamps (${timestamps.length / 48} days)`);
  
  const marketData = [];
  
  // Generate data for each token
  TOKENS.forEach(token => {
    console.log(`💰 Generating data for ${token.name} (${token.id})...`);
    
    let currentPrice = token.basePrice;
    
    timestamps.forEach(timestamp => {
      const ohlc = generateOHLC(currentPrice, token.volatility);
      
      marketData.push({
        token_id: token.id,
        timestamp: formatTimestamp(timestamp),
        open_price: ohlc.open,
        high_price: ohlc.high,
        low_price: ohlc.low,
        close_price: ohlc.close
      });
      
      // Update current price for next interval
      currentPrice = ohlc.close;
    });
  });
  
  // Sort by timestamp, then by token_id for better organization
  marketData.sort((a, b) => {
    const timeCompare = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (timeCompare !== 0) return timeCompare;
    return a.token_id.localeCompare(b.token_id);
  });
  
  return marketData;
}

/**
 * Write data to CSV file
 */
function writeToCSV(data) {
  const csvHeader = 'token_id,timestamp,open_price,high_price,low_price,close_price\n';
  
  const csvRows = data.map(row => 
    `${row.token_id},${row.timestamp},${row.open_price},${row.high_price},${row.low_price},${row.close_price}`
  );
  
  const csvContent = csvHeader + csvRows.join('\n');
  const outputPath = path.join(__dirname, '../data/sample_data.csv');
  
  try {
    fs.writeFileSync(outputPath, csvContent);
    console.log(`✅ Sample data written to: ${outputPath}`);
    console.log(`📊 Total records: ${data.length}`);
    console.log(`🏪 Tokens: ${TOKENS.length}`);
    console.log(`📈 Data points per token: ${data.length / TOKENS.length}`);
    
    // Display sample of the data
    console.log('\\n📋 Sample data preview:');
    console.log('token_id,timestamp,open_price,high_price,low_price,close_price');
    data.slice(0, 5).forEach(row => {
      console.log(`${row.token_id},${row.timestamp},${row.open_price},${row.high_price},${row.low_price},${row.close_price}`);
    });
    console.log('...');
    
    return outputPath;
  } catch (error) {
    console.error('❌ Error writing CSV file:', error);
    throw error;
  }
}

/**
 * Main function to generate sample data
 */
function main() {
  try {
    console.log('🎯 Starting crypto market data generation...');
    console.log(`📊 Configuration:`);
    console.log(`   • Tokens: ${TOKENS.length}`);
    console.log(`   • Days: 5`);
    console.log(`   • Trading hours: 8:00 AM - 8:00 PM`);
    console.log(`   • Interval: 15 minutes`);
    console.log(`   • Data points per day: 48`);
    console.log(`   • Total expected records: ${TOKENS.length * 5 * 48}`);
    console.log('');
    
    const marketData = generateSampleData();
    const outputPath = writeToCSV(marketData);
    
    console.log('\\n🎉 Data generation completed successfully!');
    console.log(`📂 File location: ${outputPath}`);
    
  } catch (error) {
    console.error('💥 Error generating sample data:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSampleData,
  writeToCSV,
  TOKENS
};

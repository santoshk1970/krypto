const fs = require('fs');
const path = require('path');
const { calculateSMA, calculatePercentageChange, calculateVolatility } = require('./utils/mathUtils');

/**
 * Market Data Analyzer for Crypto Tokens
 */
class CryptoAnalyzer {
  constructor(csvFilePath) {
    this.csvFilePath = csvFilePath;
    this.data = [];
    this.tokenData = new Map();
  }

  /**
   * Load and parse CSV data
   */
  loadData() {
    try {
      console.log(`📖 Loading data from: ${this.csvFilePath}`);
      
      const csvContent = fs.readFileSync(this.csvFilePath, 'utf8');
      const lines = csvContent.trim().split('\\n');
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      this.data = dataLines.map(line => {
        const [token_id, timestamp, open_price, high_price, low_price, close_price] = line.split(',');
        
        return {
          token_id: token_id.trim(),
          timestamp: new Date(timestamp.trim()),
          open_price: parseFloat(open_price),
          high_price: parseFloat(high_price),
          low_price: parseFloat(low_price),
          close_price: parseFloat(close_price)
        };
      });
      
      // Group data by token
      this.data.forEach(record => {
        if (!this.tokenData.has(record.token_id)) {
          this.tokenData.set(record.token_id, []);
        }
        this.tokenData.get(record.token_id).push(record);
      });
      
      // Sort each token's data by timestamp
      this.tokenData.forEach(tokenRecords => {
        tokenRecords.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
      
      console.log(`✅ Loaded ${this.data.length} records for ${this.tokenData.size} tokens`);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      throw error;
    }
  }

  /**
   * Get basic statistics for a token
   */
  getTokenStats(tokenId) {
    const records = this.tokenData.get(tokenId);
    if (!records || records.length === 0) {
      return null;
    }

    const closePrices = records.map(r => r.close_price);
    const highPrices = records.map(r => r.high_price);
    const lowPrices = records.map(r => r.low_price);
    
    const firstPrice = records[0].open_price;
    const lastPrice = records[records.length - 1].close_price;
    const priceChange = calculatePercentageChange(firstPrice, lastPrice);
    
    const volatility = calculateVolatility(closePrices);
    
    return {
      token_id: tokenId,
      total_records: records.length,
      first_price: firstPrice,
      last_price: lastPrice,
      price_change_percent: priceChange,
      highest_price: Math.max(...highPrices),
      lowest_price: Math.min(...lowPrices),
      average_close: closePrices.reduce((sum, price) => sum + price, 0) / closePrices.length,
      volatility: volatility,
      sma_10: calculateSMA(closePrices, 10),
      sma_20: calculateSMA(closePrices, 20)
    };
  }

  /**
   * Get market overview for all tokens
   */
  getMarketOverview() {
    console.log('\\n📊 CRYPTO MARKET ANALYSIS OVERVIEW');
    console.log('=====================================');
    
    const overview = [];
    
    this.tokenData.forEach((records, tokenId) => {
      const stats = this.getTokenStats(tokenId);
      if (stats) {
        overview.push(stats);
      }
    });
    
    // Sort by price change percentage
    overview.sort((a, b) => b.price_change_percent - a.price_change_percent);
    
    console.log('\\n🏆 Top Performers (by price change):');
    console.log('Token | Price Change | Current Price | Volatility | High    | Low');
    console.log('------|-------------|---------------|------------|---------|--------');
    
    overview.forEach(token => {
      const changeIcon = token.price_change_percent >= 0 ? '📈' : '📉';
      console.log(
        `${token.token_id.padEnd(5)} | ${changeIcon} ${token.price_change_percent.toString().padStart(8)}% | ` +
        `$${token.last_price.toString().padStart(11)} | ${token.volatility.toString().padStart(8)} | ` +
        `$${token.highest_price.toString().padStart(7)} | $${token.lowest_price.toString().padStart(7)}`
      );
    });
    
    return overview;
  }

  /**
   * Analyze daily patterns
   */
  analyzeDailyPatterns() {
    console.log('\\n📅 DAILY TRADING PATTERNS');
    console.log('==========================');
    
    const dailyStats = new Map();
    
    this.data.forEach(record => {
      const dateKey = record.timestamp.toDateString();
      
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, {
          date: dateKey,
          total_volume: 0,
          avg_volatility: 0,
          token_count: 0,
          daily_changes: []
        });
      }
      
      const dayStats = dailyStats.get(dateKey);
      dayStats.total_volume += (record.high_price - record.low_price);
      dayStats.token_count++;
    });
    
    console.log('\\nDaily Market Activity:');
    console.log('Date                | Avg Daily Range | Active Tokens');
    console.log('--------------------|-----------------|---------------');
    
    Array.from(dailyStats.entries())
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .forEach(([date, stats]) => {
        const avgRange = (stats.total_volume / stats.token_count).toFixed(4);
        const uniqueTokens = Math.floor(stats.token_count / 48); // 48 intervals per day
        console.log(`${date.padEnd(19)} | $${avgRange.toString().padStart(13)} | ${uniqueTokens.toString().padStart(13)}`);
      });
  }

  /**
   * Find trading opportunities
   */
  findTradingOpportunities() {
    console.log('\\n🎯 TRADING OPPORTUNITIES');
    console.log('=========================');
    
    const opportunities = [];
    
    this.tokenData.forEach((records, tokenId) => {
      if (records.length < 20) return; // Need enough data for analysis
      
      const recentRecords = records.slice(-20); // Last 20 intervals
      const closePrices = recentRecords.map(r => r.close_price);
      
      const currentPrice = closePrices[closePrices.length - 1];
      const sma10 = calculateSMA(closePrices, 10);
      const sma20 = calculateSMA(closePrices, 20);
      
      if (sma10 && sma20) {
        let signal = 'HOLD';
        let strength = 0;
        
        // Simple moving average crossover strategy
        if (sma10 > sma20 && currentPrice > sma10) {
          signal = 'BUY';
          strength = ((sma10 - sma20) / sma20 * 100);
        } else if (sma10 < sma20 && currentPrice < sma10) {
          signal = 'SELL';
          strength = ((sma20 - sma10) / sma10 * 100);
        }
        
        opportunities.push({
          token_id: tokenId,
          signal: signal,
          strength: Math.abs(strength),
          current_price: currentPrice,
          sma10: sma10,
          sma20: sma20
        });
      }
    });
    
    // Sort by signal strength
    opportunities.sort((a, b) => b.strength - a.strength);
    
    console.log('\\nTrading Signals (SMA Crossover Strategy):');
    console.log('Token | Signal | Strength | Current Price | SMA10   | SMA20');
    console.log('------|--------|----------|---------------|---------|--------');
    
    opportunities.slice(0, 10).forEach(opp => {
      const signalIcon = opp.signal === 'BUY' ? '🟢' : opp.signal === 'SELL' ? '🔴' : '🟡';
      console.log(
        `${opp.token_id.padEnd(5)} | ${signalIcon} ${opp.signal.padEnd(4)} | ${opp.strength.toFixed(2).padStart(6)}% | ` +
        `$${opp.current_price.toString().padStart(11)} | $${opp.sma10.toFixed(4).padStart(7)} | $${opp.sma20.toFixed(4).padStart(7)}`
      );
    });
  }

  /**
   * Generate detailed token report
   */
  generateTokenReport(tokenId) {
    const stats = this.getTokenStats(tokenId);
    if (!stats) {
      console.log(`❌ No data found for token: ${tokenId}`);
      return;
    }

    console.log(`\\n📄 DETAILED REPORT: ${tokenId}`);
    console.log('========================');
    console.log(`Total Records: ${stats.total_records}`);
    console.log(`Price Range: $${stats.lowest_price} - $${stats.highest_price}`);
    console.log(`Current Price: $${stats.last_price}`);
    console.log(`Price Change: ${stats.price_change_percent}%`);
    console.log(`Average Close: $${stats.average_close.toFixed(4)}`);
    console.log(`Volatility: ${stats.volatility.toFixed(4)}`);
    console.log(`SMA(10): ${stats.sma_10 ? '$' + stats.sma_10.toFixed(4) : 'N/A'}`);
    console.log(`SMA(20): ${stats.sma_20 ? '$' + stats.sma_20.toFixed(4) : 'N/A'}`);
  }

  /**
   * Run complete analysis
   */
  runAnalysis() {
    try {
      this.loadData();
      
      console.log('\\n🔍 Starting comprehensive market analysis...');
      
      // Market Overview
      this.getMarketOverview();
      
      // Daily Patterns
      this.analyzeDailyPatterns();
      
      // Trading Opportunities
      this.findTradingOpportunities();
      
      // Sample detailed reports
      console.log('\\n📊 SAMPLE TOKEN REPORTS');
      console.log('========================');
      
      const sampleTokens = ['BTC', 'ETH', 'SOL'];
      sampleTokens.forEach(tokenId => {
        if (this.tokenData.has(tokenId)) {
          this.generateTokenReport(tokenId);
        }
      });
      
      console.log('\\n✅ Analysis completed successfully!');
      
    } catch (error) {
      console.error('💥 Error during analysis:', error);
      throw error;
    }
  }
}

/**
 * Main function
 */
function main() {
  const csvPath = path.join(__dirname, '../data/sample_data.csv');
  
  // Check if data file exists
  if (!fs.existsSync(csvPath)) {
    console.log('❌ Sample data file not found. Please run: npm run generate-data');
    process.exit(1);
  }
  
  const analyzer = new CryptoAnalyzer(csvPath);
  analyzer.runAnalysis();
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = CryptoAnalyzer;

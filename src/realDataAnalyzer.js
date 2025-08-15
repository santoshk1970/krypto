const fs = require('fs');
const path = require('path');
const { calculateSMA, calculateSMASeries, calculateVolatility } = require('./utils/mathUtils');

/**
 * Real Crypto Data Analyzer for Binance Format
 * Analyzes actual trading data with volume, trades, and advanced metrics
 */
class RealCryptoAnalyzer {
  constructor() {
    this.data = [];
  }

  /**
   * Load and parse real crypto data from CSV
   */
  loadData(filePath) {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      this.data = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          open_time: new Date(values[0]),
          open: parseFloat(values[1]),
          high: parseFloat(values[2]),
          low: parseFloat(values[3]),
          close: parseFloat(values[4]),
          volume: parseFloat(values[5]),
          close_time: new Date(values[6]),
          quote_asset_volume: parseFloat(values[7]),
          number_of_trades: parseInt(values[8]),
          taker_buy_base_asset_volume: parseFloat(values[9]),
          taker_buy_quote_asset_volume: parseFloat(values[10]),
          symbol: values[11]
        };
      });

      console.log(`✅ Loaded ${this.data.length} records for ${this.data[0]?.symbol || 'Unknown'}`);
      return this.data;
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      throw error;
    }
  }

  /**
   * Calculate technical indicators
   */
  calculateTechnicalIndicators() {
    const prices = this.data.map(d => d.close);
    const volumes = this.data.map(d => d.volume);
    
    return {
      sma_5: prices.length >= 5 ? calculateSMASeries(prices, 5) : [],
      sma_10: prices.length >= 10 ? calculateSMASeries(prices, 10) : [],
      sma_20: prices.length >= 20 ? calculateSMASeries(prices, 20) : [],
      volatility: calculateVolatility(prices),
      volumeMA_5: volumes.length >= 5 ? calculateSMASeries(volumes, 5) : [],
      volumeMA_10: volumes.length >= 10 ? calculateSMASeries(volumes, 10) : []
    };
  }

  /**
   * Analyze price action and patterns
   */
  analyzePriceAction() {
    const prices = this.data.map(d => d.close);
    const volumes = this.data.map(d => d.volume);
    
    const priceChange = prices[prices.length - 1] - prices[0];
    const priceChangePercent = (priceChange / prices[0]) * 100;
    
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const avgVolume = totalVolume / volumes.length;
    const maxVolume = Math.max(...volumes);
    
    return {
      openPrice: prices[0],
      closePrice: prices[prices.length - 1],
      highestPrice,
      lowestPrice,
      avgPrice,
      priceChange,
      priceChangePercent,
      totalVolume,
      avgVolume,
      maxVolume,
      priceRange: highestPrice - lowestPrice,
      priceRangePercent: ((highestPrice - lowestPrice) / lowestPrice) * 100
    };
  }

  /**
   * Analyze trading activity and market sentiment
   */
  analyzeTradingActivity() {
    const totalTrades = this.data.reduce((sum, d) => sum + d.number_of_trades, 0);
    const avgTradesPerInterval = totalTrades / this.data.length;
    
    const takerBuyRatios = this.data.map(d => ({
      time: d.open_time,
      ratio: d.taker_buy_base_asset_volume / d.volume,
      volume: d.volume,
      trades: d.number_of_trades
    }));
    
    const avgTakerBuyRatio = takerBuyRatios.reduce((sum, d) => sum + d.ratio, 0) / takerBuyRatios.length;
    
    // Market sentiment based on taker buy ratio
    const sentiment = avgTakerBuyRatio > 0.5 ? 'Bullish' : 'Bearish';
    const sentimentStrength = Math.abs(avgTakerBuyRatio - 0.5) * 2;
    
    return {
      totalTrades,
      avgTradesPerInterval,
      avgTakerBuyRatio,
      sentiment,
      sentimentStrength,
      takerBuyRatios: takerBuyRatios.slice(-10) // Last 10 intervals
    };
  }

  /**
   * Find significant price movements and volume spikes
   */
  findSignificantEvents() {
    const avgVolume = this.data.reduce((sum, d) => sum + d.volume, 0) / this.data.length;
    const volumeThreshold = avgVolume * 1.5; // 50% above average
    
    const events = [];
    
    for (let i = 1; i < this.data.length; i++) {
      const current = this.data[i];
      const previous = this.data[i - 1];
      
      const priceChange = ((current.close - previous.close) / previous.close) * 100;
      const isVolumeSpike = current.volume > volumeThreshold;
      const isSignificantMove = Math.abs(priceChange) > 2; // 2% move
      
      if (isVolumeSpike || isSignificantMove) {
        events.push({
          time: current.open_time,
          type: isVolumeSpike && isSignificantMove ? 'Major Event' : 
                isVolumeSpike ? 'Volume Spike' : 'Price Movement',
          priceChange: priceChange.toFixed(2),
          volume: current.volume,
          volumeRatio: (current.volume / avgVolume).toFixed(2),
          price: current.close,
          trades: current.number_of_trades
        });
      }
    }
    
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  }

  /**
   * Generate trading signals based on technical analysis
   */
  generateTradingSignals() {
    const indicators = this.calculateTechnicalIndicators();
    const priceAction = this.analyzePriceAction();
    const tradingActivity = this.analyzeTradingActivity();
    
    const signals = [];
    const currentPrice = this.data[this.data.length - 1].close;
    const sma5 = indicators.sma_5[indicators.sma_5.length - 1];
    const sma10 = indicators.sma_10[indicators.sma_10.length - 1];
    const sma20 = indicators.sma_20[indicators.sma_20.length - 1];
    
    // Moving Average Crossover Signals
    if (sma5 > sma10 && sma10 > sma20) {
      signals.push({
        type: 'BUY',
        reason: 'Bullish MA alignment (5>10>20)',
        strength: 'Strong',
        price: currentPrice
      });
    } else if (sma5 < sma10 && sma10 < sma20) {
      signals.push({
        type: 'SELL',
        reason: 'Bearish MA alignment (5<10<20)',
        strength: 'Strong',
        price: currentPrice
      });
    }
    
    // Volume and Sentiment Signals
    if (tradingActivity.sentiment === 'Bullish' && tradingActivity.sentimentStrength > 0.2) {
      signals.push({
        type: 'BUY',
        reason: `Strong bullish sentiment (${(tradingActivity.avgTakerBuyRatio * 100).toFixed(1)}% taker buys)`,
        strength: 'Medium',
        price: currentPrice
      });
    }
    
    // Support/Resistance Levels
    if (currentPrice <= priceAction.lowestPrice * 1.02) {
      signals.push({
        type: 'BUY',
        reason: 'Price near support level',
        strength: 'Medium',
        price: currentPrice
      });
    } else if (currentPrice >= priceAction.highestPrice * 0.98) {
      signals.push({
        type: 'SELL',
        reason: 'Price near resistance level',
        strength: 'Medium',
        price: currentPrice
      });
    }
    
    return signals;
  }

  /**
   * Generate comprehensive analysis report
   */
  generateReport() {
    console.log('\n🔍 ═══════════════════════════════════════════════════════');
    console.log('              REAL CRYPTO DATA ANALYSIS REPORT');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const symbol = this.data[0]?.symbol || 'Unknown';
    const timeRange = `${this.data[0].open_time.toISOString().split('T')[0]} (${this.data.length} intervals)`;
    
    console.log(`📊 SYMBOL: ${symbol}`);
    console.log(`📅 DATE RANGE: ${timeRange}`);
    console.log(`⏱️  INTERVAL: 30 minutes\n`);
    
    // Price Action Analysis
    const priceAction = this.analyzePriceAction();
    console.log('💰 PRICE ACTION SUMMARY:');
    console.log(`   Opening Price: $${priceAction.openPrice.toFixed(4)}`);
    console.log(`   Closing Price: $${priceAction.closePrice.toFixed(4)}`);
    console.log(`   Highest Price: $${priceAction.highestPrice.toFixed(4)}`);
    console.log(`   Lowest Price: $${priceAction.lowestPrice.toFixed(4)}`);
    console.log(`   Average Price: $${priceAction.avgPrice.toFixed(4)}`);
    console.log(`   Daily Change: ${priceAction.priceChange >= 0 ? '+' : ''}${priceAction.priceChangePercent.toFixed(2)}%`);
    console.log(`   Price Range: ${priceAction.priceRangePercent.toFixed(2)}%\n`);
    
    // Volume Analysis
    console.log('📈 VOLUME ANALYSIS:');
    console.log(`   Total Volume: ${priceAction.totalVolume.toLocaleString()} STRK`);
    console.log(`   Average Volume: ${priceAction.avgVolume.toLocaleString()} STRK`);
    console.log(`   Maximum Volume: ${priceAction.maxVolume.toLocaleString()} STRK\n`);
    
    // Trading Activity
    const tradingActivity = this.analyzeTradingActivity();
    console.log('🎯 TRADING ACTIVITY:');
    console.log(`   Total Trades: ${tradingActivity.totalTrades.toLocaleString()}`);
    console.log(`   Avg Trades/Interval: ${tradingActivity.avgTradesPerInterval.toFixed(0)}`);
    console.log(`   Market Sentiment: ${tradingActivity.sentiment}`);
    console.log(`   Taker Buy Ratio: ${(tradingActivity.avgTakerBuyRatio * 100).toFixed(1)}%`);
    console.log(`   Sentiment Strength: ${(tradingActivity.sentimentStrength * 100).toFixed(1)}%\n`);
    
    // Technical Indicators
    const indicators = this.calculateTechnicalIndicators();
    console.log('📊 TECHNICAL INDICATORS:');
    console.log(`   SMA(5): $${indicators.sma_5[indicators.sma_5.length - 1]?.toFixed(4) || 'N/A'}`);
    console.log(`   SMA(10): $${indicators.sma_10[indicators.sma_10.length - 1]?.toFixed(4) || 'N/A'}`);
    console.log(`   SMA(20): $${indicators.sma_20[indicators.sma_20.length - 1]?.toFixed(4) || 'N/A'}`);
    console.log(`   Volatility: ${(indicators.volatility * 100).toFixed(2)}%\n`);
    
    // Significant Events
    const events = this.findSignificantEvents();
    if (events.length > 0) {
      console.log('🚨 SIGNIFICANT EVENTS:');
      events.slice(0, 5).forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.type} at ${event.time.toLocaleTimeString()}`);
        console.log(`      Price: $${event.price.toFixed(4)} (${event.priceChange}%)`);
        console.log(`      Volume: ${event.volume.toLocaleString()} (${event.volumeRatio}x avg)`);
      });
      console.log('');
    }
    
    // Trading Signals
    const signals = this.generateTradingSignals();
    if (signals.length > 0) {
      console.log('⚡ TRADING SIGNALS:');
      signals.forEach((signal, i) => {
        const emoji = signal.type === 'BUY' ? '🟢' : '🔴';
        console.log(`   ${emoji} ${signal.type} Signal (${signal.strength})`);
        console.log(`      Reason: ${signal.reason}`);
        console.log(`      Price Level: $${signal.price.toFixed(4)}`);
      });
    } else {
      console.log('⚡ TRADING SIGNALS: No clear signals at this time');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('               ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
  }
}

module.exports = { RealCryptoAnalyzer };

// If run directly
if (require.main === module) {
  const analyzer = new RealCryptoAnalyzer();
  const dataPath = path.join(__dirname, '../data/20250104.csv');
  
  try {
    analyzer.loadData(dataPath);
    analyzer.generateReport();
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

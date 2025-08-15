const fs = require('fs');
const path = require('path');
const { RealCryptoAnalyzer } = require('./realDataAnalyzer');

/**
 * Advanced Multi-File Crypto Analyzer with ML Features
 * Handles multiple data files and provides comparative analysis
 */
class AdvancedCryptoAnalyzer {
  constructor() {
    this.datasets = new Map();
    this.results = new Map();
  }

  /**
   * Load multiple data files from a directory (with recursive search)
   */
  loadDataDirectory(dirPath = './data') {
    const getAllCsvFiles = (dir) => {
      let csvFiles = [];
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Recursively scan subdirectories
            csvFiles = csvFiles.concat(getAllCsvFiles(fullPath));
          } else if (file.endsWith('.csv')) {
            csvFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.log(`Error reading directory ${dir}: ${error.message}`);
      }
      
      return csvFiles;
    };

    try {
      const dataDir = path.resolve(dirPath);
      const csvFiles = getAllCsvFiles(dataDir);
      
      console.log(`🔍 Found ${csvFiles.length} CSV files to process`);
      
      let processed = 0;
      let loaded = 0;
      
      for (const filePath of csvFiles) {
        try {
          const fileName = path.basename(filePath);
          const parentDir = path.basename(path.dirname(filePath));
          
          // Create unique key combining directory and filename
          const key = `${parentDir}/${fileName}`;
          
          const analyzer = new RealCryptoAnalyzer();
          analyzer.loadData(filePath);
          
          this.datasets.set(key, analyzer);
          loaded++;
          
          if (loaded % 10 === 0) {
            console.log(`✅ Loaded ${loaded} files...`);
          }
        } catch (error) {
          console.error(`❌ Failed to load ${filePath}:`, error.message);
        }
        processed++;
      }

      console.log(`✅ Successfully loaded ${loaded} out of ${processed} files`);
      return this.datasets.size;
    } catch (error) {
      console.error('❌ Error loading data directory:', error.message);
      throw error;
    }
  }

  /**
   * Load data for specific symbols only
   */
  loadSpecificSymbols(dirPath, symbols = [], maxFilesPerSymbol = 10) {
    const getAllCsvFiles = (dir) => {
      let csvFiles = [];
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Check if this directory is for one of our target symbols
            if (symbols.length === 0 || symbols.includes(file)) {
              const subFiles = fs.readdirSync(fullPath)
                .filter(f => f.endsWith('.csv'))
                .slice(0, maxFilesPerSymbol) // Limit files per symbol
                .map(f => path.join(fullPath, f));
              csvFiles = csvFiles.concat(subFiles);
            }
          } else if (file.endsWith('.csv')) {
            csvFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.log(`Error reading directory ${dir}: ${error.message}`);
      }
      
      return csvFiles;
    };

    try {
      const dataDir = path.resolve(dirPath);
      const csvFiles = getAllCsvFiles(dataDir);
      
      console.log(`🔍 Found ${csvFiles.length} CSV files for symbols: ${symbols.join(', ')}`);
      
      let loaded = 0;
      
      for (const filePath of csvFiles) {
        try {
          const fileName = path.basename(filePath);
          const parentDir = path.basename(path.dirname(filePath));
          const key = `${parentDir}/${fileName}`;
          
          const analyzer = new RealCryptoAnalyzer();
          analyzer.loadData(filePath);
          
          this.datasets.set(key, analyzer);
          loaded++;
          
          console.log(`✅ Loaded: ${key}`);
        } catch (error) {
          console.error(`❌ Failed to load ${filePath}:`, error.message);
        }
      }

      console.log(`✅ Successfully loaded ${loaded} files`);
      return this.datasets.size;
    } catch (error) {
      console.error('❌ Error loading specific symbols:', error.message);
      throw error;
    }
  }

  /**
   * Analyze all loaded datasets
   */
  analyzeAll() {
    console.log('\n🚀 Starting comprehensive analysis...\n');
    
    for (const [filename, analyzer] of this.datasets) {
      console.log(`\n📊 Analyzing: ${filename}`);
      console.log('═'.repeat(60));
      
      try {
        // Run analysis
        analyzer.generateReport();
        
        // Store results for comparison
        const priceAction = analyzer.analyzePriceAction();
        const tradingActivity = analyzer.analyzeTradingActivity();
        const indicators = analyzer.calculateTechnicalIndicators();
        
        this.results.set(filename, {
          symbol: analyzer.data[0]?.symbol || filename,
          priceAction,
          tradingActivity,
          indicators,
          dataPoints: analyzer.data.length
        });
        
      } catch (error) {
        console.error(`❌ Analysis failed for ${filename}:`, error.message);
      }
    }
    
    this.generateComparativeReport();
  }

  /**
   * Generate comparative analysis across all datasets
   */
  generateComparativeReport() {
    if (this.results.size === 0) {
      console.log('⚠️  No results to compare');
      return;
    }

    console.log('\n📈 ═══════════════════════════════════════════════════════');
    console.log('                COMPARATIVE ANALYSIS REPORT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Performance comparison
    console.log('🏆 PERFORMANCE RANKING:');
    const performances = Array.from(this.results.entries())
      .map(([file, data]) => ({
        file,
        symbol: data.symbol,
        performance: data.priceAction.priceChangePercent,
        volume: data.priceAction.totalVolume,
        volatility: data.indicators.volatility * 100
      }))
      .sort((a, b) => b.performance - a.performance);

    performances.forEach((item, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
      const sign = item.performance >= 0 ? '+' : '';
      console.log(`   ${emoji} ${item.symbol}: ${sign}${item.performance.toFixed(2)}% (Vol: ${item.volatility.toFixed(2)}%)`);
    });

    // Volume analysis
    console.log('\n💰 VOLUME LEADERS:');
    const volumeLeaders = performances
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    volumeLeaders.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.symbol}: ${item.volume.toLocaleString()}`);
    });

    // Market sentiment overview
    console.log('\n🎯 MARKET SENTIMENT OVERVIEW:');
    let bullishCount = 0;
    let bearishCount = 0;
    let totalSentimentStrength = 0;

    for (const [file, data] of this.results) {
      if (data.tradingActivity.sentiment === 'Bullish') {
        bullishCount++;
      } else {
        bearishCount++;
      }
      totalSentimentStrength += data.tradingActivity.sentimentStrength;
    }

    const avgSentimentStrength = totalSentimentStrength / this.results.size;
    const bullishPercentage = (bullishCount / this.results.size) * 100;

    console.log(`   Bullish Assets: ${bullishCount}/${this.results.size} (${bullishPercentage.toFixed(1)}%)`);
    console.log(`   Bearish Assets: ${bearishCount}/${this.results.size} (${(100 - bullishPercentage).toFixed(1)}%)`);
    console.log(`   Avg Sentiment Strength: ${(avgSentimentStrength * 100).toFixed(1)}%`);

    // Risk assessment
    console.log('\n⚠️  RISK ASSESSMENT:');
    const riskLevels = performances.map(item => ({
      symbol: item.symbol,
      risk: this.calculateRiskScore(item.volatility, Math.abs(item.performance))
    })).sort((a, b) => b.risk - a.risk);

    riskLevels.forEach(item => {
      const riskLabel = item.risk > 7 ? 'HIGH' : item.risk > 4 ? 'MEDIUM' : 'LOW';
      const emoji = item.risk > 7 ? '🔴' : item.risk > 4 ? '🟡' : '🟢';
      console.log(`   ${emoji} ${item.symbol}: ${riskLabel} (${item.risk.toFixed(1)}/10)`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('            COMPARATIVE ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
  }

  /**
   * Calculate risk score based on volatility and performance
   */
  calculateRiskScore(volatility, absPerformance) {
    // Risk score from 0-10 based on volatility and performance magnitude
    const volatilityScore = Math.min(volatility / 2, 5); // Max 5 points for volatility
    const performanceScore = Math.min(absPerformance / 2, 5); // Max 5 points for performance
    return volatilityScore + performanceScore;
  }

  /**
   * Predict price trends using simple linear regression
   */
  predictTrends() {
    console.log('\n🔮 TREND PREDICTIONS (Simple Linear Regression):');
    console.log('═'.repeat(60));

    for (const [filename, analyzer] of this.datasets) {
      const prices = analyzer.data.map(d => d.close);
      const trend = this.calculateTrend(prices);
      
      const symbol = analyzer.data[0]?.symbol || filename;
      const currentPrice = prices[prices.length - 1];
      const predictedPrice = currentPrice + trend.slope;
      const confidence = Math.min(Math.abs(trend.rSquared) * 100, 100);
      
      const direction = trend.slope > 0 ? '📈 UP' : '📉 DOWN';
      const strength = Math.abs(trend.slope) > 0.01 ? 'Strong' : 'Weak';
      
      console.log(`\n${symbol}:`);
      console.log(`   Current: $${currentPrice.toFixed(4)}`);
      console.log(`   Predicted: $${predictedPrice.toFixed(4)} (${direction})`);
      console.log(`   Trend Strength: ${strength}`);
      console.log(`   Confidence: ${confidence.toFixed(1)}%`);
    }
  }

  /**
   * Calculate linear trend using least squares method
   */
  calculateTrend(prices) {
    const n = prices.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return { slope, intercept, rSquared };
  }

  /**
   * Run complete analysis suite
   */
  runCompleteAnalysis(dataDir = './data') {
    console.log('🚀 ADVANCED CRYPTO ANALYSIS SUITE');
    console.log('═'.repeat(60));
    
    const filesLoaded = this.loadDataDirectory(dataDir);
    
    if (filesLoaded === 0) {
      console.log('⚠️  No data files found. Please add CSV files to the data directory.');
      return;
    }
    
    this.analyzeAll();
    this.predictTrends();
    
    console.log('\n🎉 Analysis complete! Check the reports above for insights.');
  }
}

module.exports = { AdvancedCryptoAnalyzer };

// If run directly
if (require.main === module) {
  const analyzer = new AdvancedCryptoAnalyzer();
  analyzer.runCompleteAnalysis();
}

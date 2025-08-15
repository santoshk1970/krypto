const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { RealCryptoAnalyzer } = require('./realDataAnalyzer');

/**
 * Database-powered Crypto Analysis System
 * Processes all historical data and stores results for fast querying
 */
class DatabaseAnalyzer {
  constructor(dbPath = './data/crypto_analysis.db') {
    this.dbPath = path.resolve(dbPath);
    this.db = null;
    this.initDatabase();
  }

  /**
   * Initialize SQLite database with analysis results schema
   */
  initDatabase() {
    this.db = new sqlite3.Database(this.dbPath);
    
    // Create analysis results table
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol TEXT NOT NULL,
          date TEXT NOT NULL,
          file_path TEXT NOT NULL,
          
          -- Price Action Data
          open_price REAL,
          close_price REAL,
          high_price REAL,
          low_price REAL,
          avg_price REAL,
          daily_change_pct REAL,
          price_range_pct REAL,
          
          -- Volume Data
          total_volume REAL,
          avg_volume REAL,
          max_volume REAL,
          volume_volatility REAL,
          
          -- Trading Activity
          total_trades INTEGER,
          avg_trades_per_interval REAL,
          taker_buy_ratio REAL,
          sentiment TEXT,
          sentiment_strength REAL,
          
          -- Technical Indicators
          sma_5 REAL,
          sma_10 REAL,
          sma_20 REAL,
          volatility REAL,
          
          -- ML Predictions
          predicted_price REAL,
          prediction_confidence REAL,
          trend_direction TEXT,
          
          -- Risk Assessment
          risk_score REAL,
          risk_category TEXT,
          
          -- Events
          significant_events_count INTEGER,
          max_volume_spike_ratio REAL,
          max_price_move_pct REAL,
          
          -- Metadata
          intervals_count INTEGER,
          analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(symbol, date)
        )
      `);

      // Create indexes for fast querying
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_symbol ON analysis_results(symbol)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_date ON analysis_results(date)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_symbol_date ON analysis_results(symbol, date)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_daily_change ON analysis_results(daily_change_pct)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_risk_score ON analysis_results(risk_score)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_sentiment ON analysis_results(sentiment)`);

      // Create events table for detailed event tracking
      this.db.run(`
        CREATE TABLE IF NOT EXISTS significant_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          analysis_id INTEGER,
          symbol TEXT NOT NULL,
          date TEXT NOT NULL,
          event_time TEXT,
          event_type TEXT,
          description TEXT,
          price REAL,
          volume REAL,
          volume_ratio REAL,
          price_change_pct REAL,
          FOREIGN KEY(analysis_id) REFERENCES analysis_results(id)
        )
      `);

      console.log('✅ Database initialized successfully');
    });
  }

  /**
   * Process all files in directory and store results in database
   */
  async processAllFiles(dataDir, options = {}) {
    const { maxFiles = null } = options;
    const getAllCsvFiles = (dir) => {
      let csvFiles = [];
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            csvFiles = csvFiles.concat(getAllCsvFiles(fullPath));
          } else if (file.endsWith('.csv')) {
            csvFiles.push({
              path: fullPath,
              symbol: path.basename(path.dirname(fullPath)),
              date: path.basename(file, '.csv')
            });
          }
        }
      } catch (error) {
        console.log(`Error reading directory ${dir}: ${error.message}`);
      }
      
      return csvFiles;
    };

    const csvFiles = getAllCsvFiles(dataDir);
    
    // Apply maxFiles limit if specified
    const filesToProcess = maxFiles ? csvFiles.slice(0, maxFiles) : csvFiles;
    
    console.log(`🔍 Found ${csvFiles.length} CSV files total`);
    if (maxFiles) {
      console.log(`🎯 Processing first ${filesToProcess.length} files (limited by --max-files)`);
    } else {
      console.log(`📊 Processing all ${filesToProcess.length} files`);
    }

    let processed = 0;
    let stored = 0;
    let errors = 0;

    // Process in batches to avoid memory issues
    const batchSize = 100;
    
    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize);
      
      console.log(`\n📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filesToProcess.length/batchSize)}`);
      console.log(`Files ${i + 1} to ${Math.min(i + batchSize, filesToProcess.length)} of ${filesToProcess.length}`);
      
      for (const fileInfo of batch) {
        try {
          // Check if already processed
          if (await this.isAlreadyProcessed(fileInfo.symbol, fileInfo.date)) {
            processed++;
            continue;
          }

          const analyzer = new RealCryptoAnalyzer();
          analyzer.loadData(fileInfo.path);
          
          // Extract analysis data
          const priceAction = analyzer.analyzePriceAction();
          const tradingActivity = analyzer.analyzeTradingActivity();
          const indicators = analyzer.calculateTechnicalIndicators();
          const signals = analyzer.generateTradingSignals();
          const events = analyzer.findSignificantEvents();
          
          // Store in database
          await this.storeAnalysisResult({
            fileInfo,
            priceAction,
            tradingActivity,
            indicators,
            signals,
            events,
            dataLength: analyzer.data.length
          });
          
          stored++;
        } catch (error) {
          console.error(`❌ Error processing ${fileInfo.path}: ${error.message}`);
          errors++;
        }
        
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`Progress: ${processed}/${filesToProcess.length} (${stored} stored, ${errors} errors)`);
        }
      }
      
      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Total processed: ${processed}`);
    console.log(`💾 Successfully stored: ${stored}`);
    console.log(`❌ Errors: ${errors}`);
    
    return { processed, stored, errors };
  }

  /**
   * Check if file already processed
   */
  isAlreadyProcessed(symbol, date) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM analysis_results WHERE symbol = ? AND date = ?',
        [symbol, date],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  /**
   * Store analysis result in database
   */
  storeAnalysisResult(data) {
    return new Promise((resolve, reject) => {
      const { fileInfo, priceAction, tradingActivity, indicators, signals, events, dataLength } = data;
      
      // Calculate derived values for prediction fields
      const currentPrice = priceAction.closePrice;
      const priceChangePercent = priceAction.priceChangePercent;
      const trendDirection = priceChangePercent > 0 ? 'BULLISH' : 'BEARISH';
      const riskScore = Math.min(Math.abs(priceChangePercent) * 0.1 + indicators.volatility * 0.05, 1.0);
      const riskCategory = riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW';
      
      // Get latest SMA values
      const sma5 = indicators.sma_5.length > 0 ? indicators.sma_5[indicators.sma_5.length - 1] : currentPrice;
      const sma10 = indicators.sma_10.length > 0 ? indicators.sma_10[indicators.sma_10.length - 1] : currentPrice;
      const sma20 = indicators.sma_20.length > 0 ? indicators.sma_20[indicators.sma_20.length - 1] : currentPrice;
      
      const sql = `
        INSERT OR REPLACE INTO analysis_results (
          symbol, date, file_path, open_price, close_price, high_price, low_price,
          avg_price, daily_change_pct, price_range_pct, total_volume, avg_volume,
          max_volume, volume_volatility, total_trades, avg_trades_per_interval,
          taker_buy_ratio, sentiment, sentiment_strength, sma_5, sma_10, sma_20,
          volatility, predicted_price, prediction_confidence, trend_direction,
          risk_score, risk_category, significant_events_count, max_volume_spike_ratio,
          max_price_move_pct, intervals_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        fileInfo.symbol,
        fileInfo.date,
        fileInfo.path,
        priceAction.openPrice,
        priceAction.closePrice,
        priceAction.highestPrice,
        priceAction.lowestPrice,
        priceAction.avgPrice,
        priceAction.priceChangePercent,
        priceAction.priceRangePercent,
        priceAction.totalVolume,
        priceAction.avgVolume,
        priceAction.maxVolume,
        indicators.volatility || 0,
        tradingActivity.totalTrades,
        tradingActivity.avgTradesPerInterval,
        tradingActivity.avgTakerBuyRatio,
        tradingActivity.sentiment,
        tradingActivity.sentimentStrength,
        sma5,
        sma10,
        sma20,
        indicators.volatility || 0,
        currentPrice, // predicted price (using current as baseline)
        0.5, // prediction confidence (neutral)
        trendDirection,
        riskScore,
        riskCategory,
        events.length,
        events.length > 0 ? Math.max(...events.map(e => parseFloat(e.volumeRatio) || 1)) : 1,
        events.length > 0 ? Math.max(...events.map(e => Math.abs(parseFloat(e.priceChange) || 0))) : 0,
        dataLength
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          // Store individual events
          const analysisId = this.lastID;
          const eventPromises = events.map(event => 
            this.storeEvent(analysisId, fileInfo.symbol, fileInfo.date, event)
          );
          Promise.all(eventPromises)
            .then(() => resolve(analysisId))
            .catch(reject);
        }
      }.bind(this));
    });
  }

  /**
   * Store individual significant event
   */
  storeEvent(analysisId, symbol, date, event) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO significant_events (
          analysis_id, symbol, date, event_time, event_type, 
          description, price, volume, volume_ratio, price_change_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        analysisId,
        symbol,
        date,
        event.time || null,
        event.type || 'unknown',
        `${event.type}: ${event.priceChange}% price change`,
        event.price || null,
        event.volume || null,
        parseFloat(event.volumeRatio) || null,
        parseFloat(event.priceChange) || null
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Query methods for analysis
   */
  
  // Get top performers
  getTopPerformers(limit = 10, timeframe = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT symbol, date, daily_change_pct, close_price, total_volume
        FROM analysis_results 
        WHERE daily_change_pct IS NOT NULL
      `;
      
      const params = [];
      
      if (timeframe) {
        sql += ` AND date >= ?`;
        params.push(timeframe);
      }
      
      sql += ` ORDER BY daily_change_pct DESC LIMIT ?`;
      params.push(limit);
      
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get correlation analysis
  getCorrelationData(symbols, startDate, endDate) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT symbol, date, daily_change_pct, close_price
        FROM analysis_results 
        WHERE symbol IN (${symbols.map(() => '?').join(',')})
        AND date BETWEEN ? AND ?
        ORDER BY date, symbol
      `;
      
      this.db.all(sql, [...symbols, startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get risk analysis
  getRiskAnalysis() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          symbol,
          AVG(risk_score) as avg_risk,
          AVG(volatility) as avg_volatility,
          COUNT(*) as data_points,
          MIN(date) as first_date,
          MAX(date) as last_date
        FROM analysis_results 
        GROUP BY symbol
        ORDER BY avg_risk DESC
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { DatabaseAnalyzer };

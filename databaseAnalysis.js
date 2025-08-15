#!/usr/bin/env node

const { DatabaseAnalyzer } = require('./src/databaseAnalyzer');
const path = require('path');

/**
 * Full Dataset Database Analysis Script
 * Processes ALL crypto data and stores in SQLite database for querying
 */

const args = process.argv.slice(2);

// Set default data path
let dataPath = '/Users/santosh/development/krypto/data/d_binance_30min';

console.log('🗄️  Crypto Database Analysis System');
console.log('═'.repeat(60));

// Command line options
const options = {
  mode: 'process',  // 'process', 'query', 'report'
  batchSize: 100,
  maxFiles: null,   // null = process all
  symbols: null,    // null = all symbols
  force: false      // force reprocessing
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--mode' && args[i + 1]) {
    options.mode = args[i + 1];
    i++;
  } else if (args[i] === '--batch-size' && args[i + 1]) {
    options.batchSize = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--max-files' && args[i + 1]) {
    options.maxFiles = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--symbols' && args[i + 1]) {
    options.symbols = args[i + 1].split(',');
    i++;
  } else if (args[i] === '--force') {
    options.force = true;
  } else if (args[i] === '--path' && args[i + 1]) {
    dataPath = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--') && i === 0) {
    // First non-option argument is the data path
    dataPath = args[i];
  }
}

console.log(`📁 Data Directory: ${dataPath}`);
console.log(`💾 Database: ./data/crypto_analysis.db`);
console.log('═'.repeat(60));

async function runDatabaseAnalysis() {
  const analyzer = new DatabaseAnalyzer();
  
  try {
    switch (options.mode) {
      case 'process':
        await processAllData(analyzer);
        break;
        
      case 'query':
        await runSampleQueries(analyzer);
        break;
        
      case 'report':
        await generateAnalysisReport(analyzer);
        break;
        
      default:
        console.log('❌ Unknown mode. Use: process, query, or report');
        showUsage();
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
    process.exit(1);
  } finally {
    analyzer.close();
  }
}

/**
 * Process all data files into database
 */
async function processAllData(analyzer) {
  console.log('\n🚀 Starting full dataset processing...');
  console.log('⚠️  WARNING: This will process hundreds of thousands of files!');
  console.log('⏱️  Estimated time: Several hours');
  
  if (!options.force) {
    console.log('\n🛑 Add --force flag to confirm you want to proceed');
    console.log('💡 Tip: Start with --max-files 1000 to test first');
    return;
  }
  
  const startTime = Date.now();
  const results = await analyzer.processAllFiles(dataPath, { maxFiles: options.maxFiles });
  const endTime = Date.now();
  
  const duration = Math.round((endTime - startTime) / 1000);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  console.log('\n🎉 Database processing completed!');
  console.log(`⏱️  Total time: ${hours}h ${minutes}m ${seconds}s`);
  console.log(`📊 Files processed: ${results.processed}`);
  console.log(`💾 Records stored: ${results.stored}`);
  console.log(`❌ Errors: ${results.errors}`);
  console.log(`📈 Success rate: ${((results.stored / results.processed) * 100).toFixed(1)}%`);
}

/**
 * Run sample queries to demonstrate database capabilities
 */
async function runSampleQueries(analyzer) {
  console.log('\n📊 Running sample database queries...\n');
  
  try {
    // Top performers
    console.log('🏆 TOP 10 DAILY PERFORMERS (All Time):');
    const topPerformers = await analyzer.getTopPerformers(10);
    topPerformers.forEach((row, i) => {
      console.log(`${i + 1}. ${row.symbol} (${row.date}): ${row.daily_change_pct.toFixed(2)}%`);
    });
    
    // Risk analysis
    console.log('\n⚠️  RISK ANALYSIS BY SYMBOL:');
    const riskAnalysis = await analyzer.getRiskAnalysis();
    riskAnalysis.slice(0, 10).forEach((row, i) => {
      console.log(`${i + 1}. ${row.symbol}: Risk ${row.avg_risk.toFixed(1)}/10, Vol ${row.avg_volatility.toFixed(2)}% (${row.data_points} days)`);
    });
    
    // Correlation example (BTC vs ETH)
    console.log('\n🔗 CORRELATION ANALYSIS (BTC vs ETH, Recent 30 days):');
    const correlationData = await analyzer.getCorrelationData(
      ['BTCUSDT', 'ETHUSDT'], 
      '20250701', 
      '20250731'
    );
    
    if (correlationData.length > 0) {
      console.log(`Found ${correlationData.length} data points for correlation analysis`);
      
      // Simple correlation calculation
      const btcData = correlationData.filter(r => r.symbol === 'BTCUSDT');
      const ethData = correlationData.filter(r => r.symbol === 'ETHUSDT');
      
      if (btcData.length > 0 && ethData.length > 0) {
        console.log(`BTC range: ${btcData[0].date} to ${btcData[btcData.length-1].date}`);
        console.log(`ETH range: ${ethData[0].date} to ${ethData[ethData.length-1].date}`);
      }
    } else {
      console.log('No recent data found - try running with --mode process first');
    }
    
  } catch (error) {
    console.error('Query error:', error.message);
  }
}

/**
 * Generate comprehensive analysis report
 */
async function generateAnalysisReport(analyzer) {
  console.log('\n📈 Generating comprehensive analysis report...\n');
  
  // This would generate detailed reports, charts, etc.
  console.log('🔜 Coming soon: PDF reports, correlation matrices, performance charts');
  console.log('💡 For now, use --mode query to see sample analysis');
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
🗄️  Crypto Database Analysis Usage:

MODES:
  --mode process    Process all files into database (WARNING: Very long process!)
  --mode query      Run sample queries on existing database
  --mode report     Generate analysis reports

OPTIONS:
  --batch-size N    Process N files at a time (default: 100)
  --max-files N     Limit processing to N files (for testing)
  --symbols A,B,C   Only process specific symbols
  --force          Force processing (required for full dataset)

EXAMPLES:
  # Test with small dataset
  node databaseAnalysis.js --mode process --max-files 100 --force
  
  # Process specific symbols only
  node databaseAnalysis.js --mode process --symbols BTCUSDT,ETHUSDT --force
  
  # Query existing database
  node databaseAnalysis.js --mode query
  
  # Full processing (WARNING: Takes hours!)
  node databaseAnalysis.js --mode process --force

ESTIMATED SCALE:
  Your dataset: 280+ symbols × ~1,800 files each = ~500,000 files
  Processing time: ~3-6 hours (depends on hardware)
  Database size: ~2-5 GB
  Query performance: Milliseconds for most queries
`);
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the analysis
runDatabaseAnalysis();

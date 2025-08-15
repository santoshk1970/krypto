#!/usr/bin/env node

const { AdvancedCryptoAnalyzer } = require('./src/advancedAnalyzer');
const path = require('path');

/**
 * Batch Analysis Script for Large Crypto Dataset
 * Processes multiple cryptocurrency data files with various options
 */

const args = process.argv.slice(2);

// Set default data path
let dataPath = '/Users/santosh/development/krypto/data/d_binance_30min';

console.log('🚀 Crypto Batch Analysis Tool');
console.log('═'.repeat(50));

// Parse command line options
const options = {
  mode: 'sample',  // 'all', 'sample', 'specific'
  symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT', 'LTCUSDT'],
  maxFiles: 5,     // Max files per symbol for sample mode
  generateReport: true
};

// Parse options from command line
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--mode' && args[i + 1]) {
    options.mode = args[i + 1];
    i++;
  } else if (args[i] === '--symbols' && args[i + 1]) {
    options.symbols = args[i + 1].split(',');
    i++;
  } else if (args[i] === '--max-files' && args[i + 1]) {
    options.maxFiles = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--no-report') {
    options.generateReport = false;
  } else if (args[i] === '--path' && args[i + 1]) {
    dataPath = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--') && i === 0) {
    // First non-option argument is the data path
    dataPath = args[i];
  }
}

console.log(`📁 Data Directory: ${dataPath}`);
console.log('═'.repeat(50));

async function runBatchAnalysis() {
  try {
    const analyzer = new AdvancedCryptoAnalyzer();
    
    console.log(`\n🔧 Analysis Mode: ${options.mode.toUpperCase()}`);
    
    let filesLoaded = 0;
    
    switch (options.mode) {
      case 'all':
        console.log('⚠️  Loading ALL files (this may take a long time)...');
        filesLoaded = analyzer.loadDataDirectory(dataPath);
        break;
        
      case 'specific':
        console.log(`🎯 Loading specific symbols: ${options.symbols.join(', ')}`);
        filesLoaded = analyzer.loadSpecificSymbols(dataPath, options.symbols, options.maxFiles);
        break;
        
      case 'sample':
      default:
        console.log(`📊 Loading sample data (${options.maxFiles} files per symbol)`);
        console.log(`🎯 Target symbols: ${options.symbols.join(', ')}`);
        filesLoaded = analyzer.loadSpecificSymbols(dataPath, options.symbols, options.maxFiles);
        break;
    }
    
    if (filesLoaded === 0) {
      console.log('❌ No data files were loaded successfully');
      return;
    }
    
    console.log(`\n✅ Loaded ${filesLoaded} datasets successfully`);
    
    if (options.generateReport) {
      console.log('\n🔍 Starting analysis...');
      analyzer.analyzeAll();
    }
    
    console.log('\n🎉 Batch analysis completed!');
    
  } catch (error) {
    console.error('❌ Batch analysis failed:', error.message);
    process.exit(1);
  }
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node batchAnalysis.js [data-path] [options]

Options:
  --mode [all|sample|specific]    Analysis mode (default: sample)
  --symbols [symbol1,symbol2]     Comma-separated symbols (default: BTC,ETH,ADA,DOGE,LTC)
  --max-files [number]            Max files per symbol (default: 5)
  --no-report                     Skip generating reports
  --help, -h                      Show this help

Examples:
  # Sample analysis with default symbols
  node batchAnalysis.js

  # Analyze specific symbols with more files
  node batchAnalysis.js --mode specific --symbols BTCUSDT,ETHUSDT --max-files 10

  # Full analysis (WARNING: May take very long time)
  node batchAnalysis.js --mode all
`);
  process.exit(0);
}

// Run the analysis
runBatchAnalysis();

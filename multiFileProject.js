#!/usr/bin/env node

const { MultiFileCryptoAnalyzer } = require('./src/multiFileAnalyzer');
const path = require('path');

/**
 * Command Line Interface for Multi-File Crypto Analyzer
 * A brand new project for processing multiple data files with identical format
 */

function printUsage() {
  console.log('📈 Multi-File Crypto Analyzer CLI');
  console.log('==================================');
  console.log('Usage: node multiFileProject.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --data-dir <path>    Directory containing CSV data files (default: ./data/multi_files)');
  console.log('  --export-path <path> Path for consolidated data export (default: ./data/consolidated_analysis.csv)');
  console.log('  --help               Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node multiFileProject.js');
  console.log('  node multiFileProject.js --data-dir ./custom/data/path');
  console.log('  node multiFileProject.js --export-path ./results/analysis.csv');
  console.log('');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dataDir: './data/multi_files',
    exportPath: './data/consolidated_analysis.csv'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--data-dir':
        if (i + 1 < args.length) {
          options.dataDir = args[++i];
        } else {
          console.error('❌ Error: --data-dir requires a path argument');
          process.exit(1);
        }
        break;
      
      case '--export-path':
        if (i + 1 < args.length) {
          options.exportPath = args[++i];
        } else {
          console.error('❌ Error: --export-path requires a path argument');
          process.exit(1);
        }
        break;
      
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      
      default:
        console.error(`❌ Error: Unknown option '${args[i]}'`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  try {
    // Create analyzer instance
    const analyzer = new MultiFileCryptoAnalyzer(options.dataDir);
    
    // Run the complete analysis
    const results = await analyzer.runCompleteAnalysis();
    
    // Export with custom path if specified
    if (options.exportPath !== './data/consolidated_analysis.csv') {
      analyzer.exportConsolidatedData(options.exportPath);
    }

    console.log('\n💡 Next Steps:');
    console.log('  • Review the consolidated analysis above');
    console.log('  • Check the exported CSV file for detailed data');
    console.log('  • Use the analysis results for further processing');
    console.log('');
    console.log('🔗 Project Features:');
    console.log('  ✅ Processes multiple files with identical CSV format');
    console.log('  ✅ Consolidates data across all files by token');
    console.log('  ✅ Provides cross-file comparison analysis'); 
    console.log('  ✅ Calculates technical indicators (SMA, volatility)');
    console.log('  ✅ Exports consolidated results for further use');

  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  • Ensure the data directory exists and contains CSV files');
    console.error('  • Verify CSV files have the correct format: token_id,timestamp,open_price,high_price,low_price,close_price');
    console.error('  • Check file permissions and paths');
    console.error('  • Use --help for usage information');
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
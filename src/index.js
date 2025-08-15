const { generateSampleData, writeToCSV } = require('./dataGenerator');
const CryptoAnalyzer = require('./analyzer');
const path = require('path');

/**
 * Main application entry point
 */
function main() {
  console.log('🚀 Crypto Market Analyzer');
  console.log('==========================');
  console.log('A Node.js application for analyzing crypto token market data');
  console.log('');
  
  const csvPath = path.join(__dirname, '../data/sample_data.csv');
  
  try {
    // Check if we have sample data, if not generate it
    const fs = require('fs');
    if (!fs.existsSync(csvPath)) {
      console.log('📊 No sample data found. Generating new data...');
      const sampleData = generateSampleData();
      writeToCSV(sampleData);
      console.log('✅ Sample data generated successfully!');
    } else {
      console.log('📊 Using existing sample data...');
    }
    
    console.log('\\n🔍 Starting market analysis...');
    
    // Run the analysis
    const analyzer = new CryptoAnalyzer(csvPath);
    analyzer.runAnalysis();
    
    console.log('\\n🎉 Application completed successfully!');
    console.log('\\n💡 Available commands:');
    console.log('  npm run generate-data  - Generate new sample data');
    console.log('  npm run analyze        - Run analysis only');
    console.log('  npm start              - Run complete application');
    
  } catch (error) {
    console.error('💥 Application error:', error);
    process.exit(1);
  }
}

// Run the main application
if (require.main === module) {
  main();
}

module.exports = {
  main
};

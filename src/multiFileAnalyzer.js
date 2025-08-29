const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { calculateSMA, calculatePercentageChange, calculateVolatility } = require('./utils/mathUtils');

/**
 * Multi-File Crypto Data Analyzer
 * A brand new project that processes multiple data files with identical format
 */
class MultiFileCryptoAnalyzer {
  constructor(dataDirectory = './data/multi_files') {
    this.dataDirectory = path.resolve(dataDirectory);
    this.datasets = new Map(); // Store data from each file
    this.consolidatedData = new Map(); // Store consolidated data by token
    this.fileMetadata = new Map(); // Store metadata about each file
  }

  /**
   * Load all CSV files from the data directory
   */
  async loadAllDataFiles() {
    console.log('🔍 Multi-File Crypto Analyzer - Loading Data Files');
    console.log('==================================================');
    console.log(`📂 Source directory: ${this.dataDirectory}`);
    
    if (!fs.existsSync(this.dataDirectory)) {
      throw new Error(`Data directory does not exist: ${this.dataDirectory}`);
    }

    const files = fs.readdirSync(this.dataDirectory)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(this.dataDirectory, file));

    if (files.length === 0) {
      throw new Error(`No CSV files found in: ${this.dataDirectory}`);
    }

    console.log(`📊 Found ${files.length} data files to process:`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.basename(file)}`);
    });

    // Load each file
    const loadPromises = files.map(file => this.loadSingleFile(file));
    await Promise.all(loadPromises);

    // Consolidate data across all files
    this.consolidateData();

    console.log('\n✅ All data files loaded successfully!');
    this.printDataSummary();
  }

  /**
   * Load a single CSV file
   */
  loadSingleFile(filePath) {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(filePath, '.csv');
      const fileData = [];
      
      console.log(`📖 Loading: ${path.basename(filePath)}`);

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Parse and validate data
          const record = {
            token_id: row.token_id,
            timestamp: new Date(row.timestamp),
            open_price: parseFloat(row.open_price),
            high_price: parseFloat(row.high_price),
            low_price: parseFloat(row.low_price),
            close_price: parseFloat(row.close_price)
          };

          // Basic validation
          if (record.token_id && !isNaN(record.timestamp) && 
              !isNaN(record.open_price) && !isNaN(record.close_price)) {
            fileData.push(record);
          }
        })
        .on('end', () => {
          // Store the data and metadata
          this.datasets.set(fileName, fileData);
          this.fileMetadata.set(fileName, {
            path: filePath,
            recordCount: fileData.length,
            tokens: [...new Set(fileData.map(r => r.token_id))],
            dateRange: this.getDateRange(fileData)
          });

          console.log(`   ✅ Loaded ${fileData.length} records from ${path.basename(filePath)}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Get date range from data
   */
  getDateRange(data) {
    if (data.length === 0) return null;
    
    const dates = data.map(r => r.timestamp);
    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    };
  }

  /**
   * Consolidate data from all files by token
   */
  consolidateData() {
    console.log('\n🔄 Consolidating data across all files...');
    
    this.datasets.forEach((fileData, fileName) => {
      fileData.forEach(record => {
        const tokenId = record.token_id;
        
        if (!this.consolidatedData.has(tokenId)) {
          this.consolidatedData.set(tokenId, []);
        }
        
        // Add source file information to the record
        this.consolidatedData.get(tokenId).push({
          ...record,
          sourceFile: fileName
        });
      });
    });

    // Sort each token's data by timestamp
    this.consolidatedData.forEach((tokenData, tokenId) => {
      tokenData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });
  }

  /**
   * Print data summary
   */
  printDataSummary() {
    console.log('\n📊 DATA SUMMARY');
    console.log('===============');
    console.log(`Total files processed: ${this.datasets.size}`);
    console.log(`Total unique tokens: ${this.consolidatedData.size}`);
    
    let totalRecords = 0;
    this.datasets.forEach(data => totalRecords += data.length);
    console.log(`Total records: ${totalRecords}`);

    console.log('\n📁 File Details:');
    this.fileMetadata.forEach((metadata, fileName) => {
      console.log(`   ${fileName}:`);
      console.log(`     - Records: ${metadata.recordCount}`);
      console.log(`     - Tokens: ${metadata.tokens.join(', ')}`);
      if (metadata.dateRange) {
        console.log(`     - Date range: ${metadata.dateRange.start.toISOString().split('T')[0]} to ${metadata.dateRange.end.toISOString().split('T')[0]}`);
      }
    });

    console.log('\n💰 Token Summary:');
    this.consolidatedData.forEach((tokenData, tokenId) => {
      const sourceFiles = [...new Set(tokenData.map(r => r.sourceFile))];
      console.log(`   ${tokenId}: ${tokenData.length} records from ${sourceFiles.length} files (${sourceFiles.join(', ')})`);
    });
  }

  /**
   * Analyze consolidated data across all files
   */
  analyzeConsolidatedData() {
    console.log('\n🔍 CONSOLIDATED ANALYSIS ACROSS ALL FILES');
    console.log('==========================================');

    const analysisResults = new Map();

    this.consolidatedData.forEach((tokenData, tokenId) => {
      if (tokenData.length === 0) return;

      // Calculate basic statistics
      const prices = tokenData.map(r => r.close_price);
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const highestPrice = Math.max(...prices);
      const lowestPrice = Math.min(...prices);
      
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      const volatility = calculateVolatility(prices);
      
      // Calculate moving averages if we have enough data
      let sma10 = null;
      let sma20 = null;
      if (prices.length >= 10) {
        const sma10Array = calculateSMA(prices, 10);
        sma10 = sma10Array[sma10Array.length - 1];
      }
      if (prices.length >= 20) {
        const sma20Array = calculateSMA(prices, 20);
        sma20 = sma20Array[sma20Array.length - 1];
      }

      // Source file analysis
      const sourceFiles = [...new Set(tokenData.map(r => r.sourceFile))];
      const fileDistribution = {};
      sourceFiles.forEach(file => {
        fileDistribution[file] = tokenData.filter(r => r.sourceFile === file).length;
      });

      analysisResults.set(tokenId, {
        totalRecords: tokenData.length,
        firstPrice,
        lastPrice,
        highestPrice,
        lowestPrice,
        priceChange,
        volatility,
        sma10,
        sma20,
        sourceFiles: sourceFiles.length,
        fileDistribution,
        dateRange: this.getDateRange(tokenData)
      });
    });

    this.displayAnalysisResults(analysisResults);
    return analysisResults;
  }

  /**
   * Display analysis results
   */
  displayAnalysisResults(results) {
    console.log('\n📈 TOKEN PERFORMANCE ANALYSIS');
    console.log('==============================');
    console.log('Token | Price Change | Volatility | Records | Files | Price Range');
    console.log('------|-------------|------------|---------|-------|------------');

    // Sort by price change
    const sortedTokens = Array.from(results.entries())
      .sort((a, b) => b[1].priceChange - a[1].priceChange);

    sortedTokens.forEach(([tokenId, stats]) => {
      const priceChangeStr = stats.priceChange >= 0 ? 
        `+${stats.priceChange.toFixed(2)}%` : 
        `${stats.priceChange.toFixed(2)}%`;
      
      console.log(
        `${tokenId.padEnd(5)} | ${priceChangeStr.padEnd(11)} | ` +
        `${stats.volatility.toFixed(4).padEnd(10)} | ${stats.totalRecords.toString().padEnd(7)} | ` +
        `${stats.sourceFiles.toString().padEnd(5)} | $${stats.lowestPrice.toFixed(2)} - $${stats.highestPrice.toFixed(2)}`
      );
    });

    console.log('\n🎯 CROSS-FILE INSIGHTS');
    console.log('=======================');
    
    results.forEach((stats, tokenId) => {
      console.log(`\n📊 ${tokenId} Analysis:`);
      console.log(`   Current Price: $${stats.lastPrice.toFixed(4)}`);
      console.log(`   Price Change: ${stats.priceChange.toFixed(2)}%`);
      console.log(`   Volatility: ${stats.volatility.toFixed(4)}`);
      if (stats.sma10) console.log(`   SMA10: $${stats.sma10.toFixed(4)}`);
      if (stats.sma20) console.log(`   SMA20: $${stats.sma20.toFixed(4)}`);
      console.log(`   Data across ${stats.sourceFiles} files:`);
      Object.entries(stats.fileDistribution).forEach(([file, count]) => {
        console.log(`     - ${file}: ${count} records`);
      });
    });
  }

  /**
   * Generate cross-file comparison report
   */
  generateCrossFileReport() {
    console.log('\n📋 CROSS-FILE COMPARISON REPORT');
    console.log('================================');

    // Compare data consistency across files
    this.consolidatedData.forEach((tokenData, tokenId) => {
      const fileGroups = {};
      
      tokenData.forEach(record => {
        if (!fileGroups[record.sourceFile]) {
          fileGroups[record.sourceFile] = [];
        }
        fileGroups[record.sourceFile].push(record);
      });

      if (Object.keys(fileGroups).length > 1) {
        console.log(`\n🔄 ${tokenId} - Data across multiple files:`);
        Object.entries(fileGroups).forEach(([file, records]) => {
          const avgPrice = records.reduce((sum, r) => sum + r.close_price, 0) / records.length;
          const dateRange = this.getDateRange(records);
          console.log(`   ${file}: ${records.length} records, avg price: $${avgPrice.toFixed(4)}, ` +
                     `dates: ${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}`);
        });
      }
    });
  }

  /**
   * Export consolidated data to a new file
   */
  exportConsolidatedData(outputPath = './data/consolidated_analysis.csv') {
    console.log('\n💾 Exporting consolidated data...');
    
    const csvHeader = 'token_id,timestamp,open_price,high_price,low_price,close_price,source_file\n';
    let csvContent = csvHeader;

    this.consolidatedData.forEach((tokenData) => {
      tokenData.forEach(record => {
        csvContent += `${record.token_id},${record.timestamp.toISOString()},` +
                     `${record.open_price},${record.high_price},${record.low_price},` +
                     `${record.close_price},${record.sourceFile}\n`;
      });
    });

    fs.writeFileSync(outputPath, csvContent);
    console.log(`✅ Consolidated data exported to: ${outputPath}`);
    
    return outputPath;
  }

  /**
   * Run complete multi-file analysis
   */
  async runCompleteAnalysis() {
    try {
      console.log('🚀 Multi-File Crypto Analyzer');
      console.log('==============================');
      console.log('Analyzing multiple data files with identical format\n');

      await this.loadAllDataFiles();
      const analysisResults = this.analyzeConsolidatedData();
      this.generateCrossFileReport();
      
      const exportPath = this.exportConsolidatedData();
      
      console.log('\n🎉 Multi-file analysis completed successfully!');
      console.log(`📊 Processed ${this.datasets.size} files with ${this.consolidatedData.size} unique tokens`);
      console.log(`💾 Results exported to: ${exportPath}`);
      
      return {
        filesProcessed: this.datasets.size,
        tokensAnalyzed: this.consolidatedData.size,
        analysisResults,
        exportPath
      };

    } catch (error) {
      console.error('❌ Error during multi-file analysis:', error.message);
      throw error;
    }
  }
}

module.exports = { MultiFileCryptoAnalyzer };

// If run directly
if (require.main === module) {
  const analyzer = new MultiFileCryptoAnalyzer();
  analyzer.runCompleteAnalysis().catch(console.error);
}
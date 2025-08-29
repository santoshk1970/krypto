# 🚀 Multi-File Crypto Analyzer

A brand new project that processes multiple cryptocurrency data files with identical format. This project extends the existing crypto analysis infrastructure to handle multiple CSV files containing market data.

## ✨ Features

- **Multi-File Processing**: Automatically discovers and loads all CSV files from a directory
- **Data Consolidation**: Combines data from multiple files by cryptocurrency token
- **Cross-File Analysis**: Provides insights across different data files and time periods
- **Technical Analysis**: Calculates moving averages, volatility, and price performance
- **Export Functionality**: Exports consolidated data with source file tracking
- **Command Line Interface**: Easy-to-use CLI with flexible options

## 📁 File Format

All data files must follow the identical CSV format:
```csv
token_id,timestamp,open_price,high_price,low_price,close_price
BTC,2025-08-25T08:00:00.000Z,43000,44319.187637,42842.770185,44319.187637
ETH,2025-08-25T08:15:00.000Z,2600,2559.087802,2471.698293,2559.087802
```

## 🚀 Quick Start

### Using npm scripts (recommended):
```bash
# Run with default settings
npm run multi-file

# Show help
npm run multi-file-help
```

### Direct execution:
```bash
# Basic usage
node multiFileProject.js

# Custom data directory
node multiFileProject.js --data-dir ./path/to/your/data

# Custom export path
node multiFileProject.js --export-path ./results/analysis.csv

# Show help
node multiFileProject.js --help
```

## 📊 What It Does

1. **Discovers Data Files**: Scans the specified directory for CSV files
2. **Loads and Validates**: Reads each file and validates the data format
3. **Consolidates Data**: Combines data from all files by token symbol
4. **Performs Analysis**: 
   - Calculates price changes and volatility
   - Computes moving averages (SMA 10, SMA 20)
   - Identifies cross-file patterns
5. **Generates Reports**: Provides detailed analysis and insights
6. **Exports Results**: Creates a consolidated CSV with source file tracking

## 📈 Sample Output

```
🚀 Multi-File Crypto Analyzer
==============================

📊 Found 3 data files to process:
   1. btc_eth_data.csv
   2. alt_coins_data.csv  
   3. defi_tokens_data.csv

📊 DATA SUMMARY
===============
Total files processed: 3
Total unique tokens: 10
Total records: 2400

📈 TOKEN PERFORMANCE ANALYSIS
==============================
Token | Price Change | Volatility | Records | Files | Price Range
------|-------------|------------|---------|-------|------------
LINK  | +161.14%    | 0.0411     | 240     | 3     | $13.70 - $49.16
ALGO  | +154.81%    | 0.0472     | 240     | 3     | $0.17 - $0.57
BTC   | +71.64%     | 0.0257     | 240     | 3     | $39160.12 - $80909.46
```

## 🎯 Use Cases

- **Historical Analysis**: Process multiple data files from different time periods
- **Portfolio Tracking**: Analyze multiple cryptocurrency investments across files
- **Data Consolidation**: Merge separate data sources into a unified dataset
- **Cross-Reference Analysis**: Compare performance across different data files
- **Research & Development**: Analyze patterns across multiple datasets

## 🔧 Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--data-dir` | Directory containing CSV files | `./data/multi_files` |
| `--export-path` | Path for consolidated output | `./data/consolidated_analysis.csv` |
| `--help` | Show usage information | - |

## 📂 Project Structure

```
├── multiFileProject.js          # Main CLI entry point
├── src/
│   └── multiFileAnalyzer.js     # Core multi-file analysis logic
├── data/
│   ├── multi_files/             # Sample data files
│   │   ├── btc_eth_data.csv     # Bitcoin & Ethereum data
│   │   ├── alt_coins_data.csv   # Alternative coins data
│   │   └── defi_tokens_data.csv # DeFi tokens data
│   └── consolidated_analysis.csv # Generated output file
```

## 🛠️ Technical Details

### Dependencies
- `csv-parser`: For reading CSV files
- `lodash`: For data manipulation utilities  
- `moment`: For date/time handling
- Existing utils: `mathUtils.js` for calculations

### Data Processing Flow
1. **Discovery**: Scan directory for `.csv` files
2. **Loading**: Read and parse each file asynchronously
3. **Validation**: Ensure data format consistency
4. **Consolidation**: Group data by token across files
5. **Analysis**: Calculate metrics and generate insights
6. **Export**: Create consolidated output with source tracking

## 🔍 Example Analysis

The project provides several types of analysis:

- **Performance Metrics**: Price changes, volatility, trading ranges
- **Technical Indicators**: Moving averages (SMA 10, SMA 20)
- **Cross-File Insights**: Data distribution across multiple files
- **Comparative Analysis**: Token performance comparison
- **Source Tracking**: Which files contributed to each token's data

## 🚨 Error Handling

The project includes robust error handling for:
- Missing or invalid data directories
- Malformed CSV files
- Invalid data formats
- File permission issues
- Empty datasets

## 🤝 Integration

This project is designed to work alongside the existing crypto analysis tools:
- Uses the same data format as other analyzers
- Leverages existing utility functions
- Can be combined with other analysis workflows
- Outputs data compatible with existing tools

## 📝 License

MIT License - see the main project README for details.
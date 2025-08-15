# 📈 Advanced Crypto Market Analyzer

A comprehensive Node.js application for analyzing cryptocurrency market data with advanced technical analysis, sentiment analysis, and ML-based trend predictions. The system processes real Binance trading data and supports large-scale batch analysis across multiple cryptocurrencies and time periods.

## 🚀 Features

### 📊 **Real Market Data Analysis**
- **Binance Data Support**: Analyze actual trading data (OHLC + Volume + Trades + Taker ratios)
- **Batch Processing**: Analyze hundreds of files across 280+ cryptocurrency pairs
- **Multi-Timeframe**: Support for 30-minute interval data from 2019-2025
- **Recursive Directory Scanning**: Automatically process nested data structures

### 🔍 **Advanced Analysis Capabilities**
- **Technical Indicators**: SMA (5, 10, 20), volatility calculations, volume analysis
- **Price Action Analysis**: Support/resistance levels, price ranges, daily performance
- **Trading Activity**: Market sentiment based on taker buy ratios, trade frequency analysis
- **Significant Events Detection**: Volume spikes, major price movements, market anomalies

### 🤖 **Machine Learning Features**
- **Trend Prediction**: Linear regression-based price forecasting with confidence scores
- **Risk Assessment**: Multi-factor risk scoring (volatility + performance magnitude)
- **Sentiment Analysis**: Market sentiment calculation from trading patterns
- **Comparative Analysis**: Portfolio-level insights across multiple assets

### ⚡ **Batch Analysis System**
- **Flexible Processing**: Sample mode, specific symbols, or full dataset analysis
- **Smart Filtering**: Process only CSV files, ignore other formats
- **Progress Tracking**: Real-time feedback during large batch operations
- **Comparative Reports**: Cross-asset performance rankings and risk assessments

### 🗄️ **Database Analysis System**
- **SQLite Integration**: Store analysis results for fast querying
- **Scalable Processing**: Handle 184,839+ files efficiently (97% success rate)
- **Advanced Queries**: Find patterns, correlations, and market insights
- **Historical Analysis**: Query years of data in milliseconds
- **SQL Analytics**: Custom queries for advanced research

## 📁 Project Structure

```
krypto/
├── package.json              # Project configuration and dependencies
├── README.md                 # This documentation
├── LICENSE                   # MIT License
├── .gitignore               # Git exclusions (excludes massive dataset)
├── batchAnalysis.js          # Batch processing script for large datasets
├── databaseAnalysis.js       # Database analysis CLI (newest feature)
├── src/
│   ├── index.js             # Main application entry point (legacy synthetic data)
│   ├── realDataAnalyzer.js  # Real market data analyzer (primary tool)
│   ├── databaseAnalyzer.js  # Database operations and analytics
│   ├── advancedAnalyzer.js  # Multi-file batch analyzer with ML features
│   ├── dataGenerator.js     # Synthetic data generator (legacy/demo)
│   ├── analyzer.js          # Basic synthetic data analyzer (legacy)
│   └── utils/
│       ├── dateUtils.js     # Trading hours and timestamp utilities
│       └── mathUtils.js     # Mathematical functions (SMA, volatility, etc.)
└── data/
    ├── .gitkeep             # Preserves directory structure in git
    ├── crypto_analysis.db   # SQLite database (auto-created, git-ignored)
    ├── d_binance_30min/     # Real market data directory (280+ crypto pairs)
    │   ├── BTCUSDT/         # Bitcoin daily files (2019-2025)
    │   ├── ETHUSDT/         # Ethereum daily files  
    │   ├── ADAUSDT/         # Cardano daily files
    │   └── ...              # 280+ other cryptocurrency pairs
    └── sample_data.csv      # Generated synthetic dataset (legacy)
```

## 🛠️ Installation & Setup

1. **Clone or create the project directory**:
   ```bash
   mkdir krypto && cd krypto
   ```

2. **Initialize and install dependencies**:
   ```bash
   npm init -y
   npm install csv-parser csv-writer moment lodash nodemon jest
   ```

3. **Copy the source files** to the `src/` directory

4. **Add real market data** (your massive dataset is already in place):
   - Your data is located in `/Users/santosh/development/krypto/data/d_binance_30min/`
   - Contains 280+ cryptocurrency pairs with daily files spanning 2019-2025
   - Files follow Binance format: `open_time,open,high,low,close,volume,close_time,quote_asset_volume,number_of_trades,taker_buy_base_asset_volume,taker_buy_quote_asset_volume,symbol`

## 📚 Usage

### 🎯 **Primary Analysis Commands** (for real market data)

```bash
# Database-powered analysis (newest, most powerful)
npm run db-test          # Process 100 files into database for testing
npm run db-process       # Process larger datasets into database  
npm run db-query         # Query database for insights and analytics

# Quick batch analysis (sample of 5 files per symbol: BTC, ETH, ADA, DOGE, LTC)
npm run batch-sample

# Focus on Bitcoin and Ethereum (10 files each)
npm run batch-btc-eth

# General batch analysis with custom options
npm run batch-analysis

# Analyze single real market data file
npm run analyze-real

# Advanced multi-file analysis with ML predictions
npm run analyze-advanced
```

### 🔧 **Legacy/Demo Commands** (synthetic data)

```bash
# Generate synthetic data and run basic analysis (for demo purposes)
npm start

# Generate new synthetic sample data (10 tokens, 5 days)
npm run generate-data

# Analyze synthetic data with technical indicators
npm run analyze

# Development mode with auto-restart
npm run dev
```

### 📖 **Detailed Usage Examples**

#### **1. Batch Analysis (Recommended)**
```bash
# Sample analysis across multiple cryptocurrencies
npm run batch-sample

# Custom analysis with specific symbols and more files
node batchAnalysis.js --mode specific --symbols BTCUSDT,ETHUSDT,ADAUSDT --max-files 15

# Full analysis (WARNING: May take hours with your large dataset)
node batchAnalysis.js --mode all
```

**Output**: Comparative analysis across multiple cryptocurrencies with performance rankings, sentiment analysis, and risk assessments.

#### **2. Real Market Data Analysis (Single File)**
```bash
npm run analyze-real   # Analyzes latest CSV file in data directory
```

**Sample Output**:
```
📊 SYMBOL: BTCUSDT
💰 PRICE ACTION: +5.60% daily change
📈 VOLUME: 68,428.5 BTC total volume  
🎯 SENTIMENT: Bullish (52.9% taker buys)
📊 TECHNICAL: SMA(20) $7,322.25, Volatility 0.56%
⚡ SIGNALS: SELL signal (bearish MA alignment)
🔮 PREDICTION: $7,350 (67% confidence)
```

#### **3. Synthetic Data Analysis (Demo/Testing)**
```bash
npm run generate-data  # Creates sample_data.csv with 2400 records
npm run analyze        # Analyzes with moving averages and signals
```

**Output**: Technical analysis of 10 crypto tokens over 5 days with trading signals.

## 🔧 Configuration

### **Batch Analysis Options** (in `batchAnalysis.js`):
```bash
# Analysis modes
--mode sample      # Process limited files per symbol (default: 5)
--mode specific    # Target particular cryptocurrencies  
--mode all         # Process entire dataset (use with caution!)

# Symbol selection
--symbols BTCUSDT,ETHUSDT,ADAUSDT    # Comma-separated list

# File limits
--max-files 10     # Maximum files per symbol

# Examples
node batchAnalysis.js --mode specific --symbols BTCUSDT,ETHUSDT --max-files 20
```

### **Analysis Thresholds** (customizable):
- **Volume Spike**: 1.5x average volume
- **Significant Move**: ±2% price change
- **Support/Resistance**: ±2% of extremes
- **Risk Scoring**: 0-10 scale (volatility + performance)

### **Legacy Synthetic Data Parameters** (in `dataGenerator.js`):
```javascript
const TOKENS = [
  { id: 'BTC', name: 'Bitcoin', basePrice: 43000, volatility: 0.02 },
  { id: 'ETH', name: 'Ethereum', basePrice: 2600, volatility: 0.025 },
  // ... 8 more tokens
];

const TRADING_HOURS = { start: 8, end: 20 }; // 8 AM - 8 PM
const INTERVAL_MINUTES = 15;
const DAYS = 5;
```

## 📊 Data Formats

### **Real Market Data Format** (Binance - Primary):
```csv
open_time,open,high,low,close,volume,close_time,quote_asset_volume,number_of_trades,taker_buy_base_asset_volume,taker_buy_quote_asset_volume,symbol
2025-01-04 00:00:00+00:00,98174.17,98288.0,98016.69,98094.02,256.92558,2025-01-04 00:29:59.999000+00:00,25218319.024536602,29692.0,91.05222,8938769.2069732,BTCUSDT
```

**Your Dataset Structure**:
```
data/d_binance_30min/
├── BTCUSDT/         # 1,800+ daily files (2019-2025)
│   ├── 20191228.csv
│   ├── 20191229.csv
│   └── ...
├── ETHUSDT/         # 1,800+ daily files
├── ADAUSDT/         # Similar structure
└── [280+ other cryptocurrency pairs]
```

### **Legacy Synthetic Data Format** (`sample_data.csv`):
```csv
token_id,timestamp,open_price,high_price,low_price,close_price
BTC,2025-08-09T16:00:00.000Z,43000,43500,42800,43200
```

## 🧮 Technical Indicators

### **Price Analysis**:
- **SMA**: Simple Moving Averages (5, 10, 20 periods)
- **Volatility**: Standard deviation of price changes
- **Support/Resistance**: Dynamic levels based on price extremes
- **Price Range**: Daily high-low range percentage

### **Volume Analysis**:
- **Volume MA**: Moving averages of trading volume
- **Volume Spikes**: Unusual volume activity detection
- **Taker Buy Ratio**: Bullish/bearish sentiment indicator

### **Trading Signals**:
- **MA Crossover**: Bullish when SMA(5) > SMA(10) > SMA(20)
- **Volume Momentum**: High volume + price movement confirmation
- **Support Bounce**: Buy signals near support levels
- **Resistance Break**: Sell signals near resistance levels

## 🤖 Machine Learning Features

### **Trend Prediction**:
- **Algorithm**: Simple Linear Regression
- **Input**: Historical closing prices
- **Output**: Next period price prediction + confidence score
- **Metrics**: R-squared correlation for trend strength

### **Risk Assessment**:
```javascript
Risk Score = (Volatility/2) + (|Performance|/2)  // 0-10 scale
- 0-3: LOW risk (🟢)
- 4-7: MEDIUM risk (🟡)  
- 8-10: HIGH risk (🔴)
```

### **Sentiment Analysis**:
```javascript
Sentiment = Taker Buy Volume / Total Volume
- >50%: Bullish 📈
- <50%: Bearish 📉
Strength = |Sentiment - 0.5| * 2  // 0-100%
```

## 🚨 Trading Signal Examples

### **Strong Buy Signal**:
```
🟢 BUY Signal (Strong)
Reason: Bullish MA alignment (5>10>20)
Price Level: $43,250
```

### **Volume-Based Signal**:
```
🟢 BUY Signal (Medium) 
Reason: Strong bullish sentiment (58.2% taker buys)
Price Level: $0.5180
```

### **Support Level Signal**:
```
🟢 BUY Signal (Medium)
Reason: Price near support level
Price Level: $42,890
```

## 🎯 Sample Analysis Output

### **Batch Analysis Report**:
```
🏆 PERFORMANCE RANKING:
   🥇 ETHUSDT: +6.68% (Vol: 0.45%)
   🥈 BTCUSDT: +5.60% (Vol: 0.56%)
   🥉 ETHUSDT: +5.54% (Vol: 0.53%)

💰 VOLUME LEADERS:
   1. ETHUSDT: 413,055.189
   2. ETHUSDT: 408,020.274
   3. ETHUSDT: 320,347.22

🎯 MARKET SENTIMENT OVERVIEW:
   Bullish Assets: 13/20 (65.0%)
   Bearish Assets: 7/20 (35.0%)
   Avg Sentiment Strength: 3.9%

⚠️ RISK ASSESSMENT:
   🟢 ETHUSDT: LOW (3.6/10)
   🟢 BTCUSDT: LOW (3.1/10)
```

### **Individual File Analysis**:
```
🔍 ═══════════════════════════════════════════════════════
              REAL CRYPTO DATA ANALYSIS REPORT
═══════════════════════════════════════════════════════

📊 SYMBOL: BTCUSDT
📅 DATE RANGE: 2020-01-03 (48 intervals)
⏱️  INTERVAL: 30 minutes

💰 PRICE ACTION SUMMARY:
   Opening Price: $6,955.63
   Closing Price: $7,344.96
   Daily Change: +5.60%
   Price Range: 7.22%

📈 VOLUME ANALYSIS:
   Total Volume: 68,428.5 BTC
   Average Volume: 1,425.594 BTC

🎯 TRADING ACTIVITY:
   Market Sentiment: Bullish
   Taker Buy Ratio: 52.9%
   Total Trades: 519,854

📊 TECHNICAL INDICATORS:
   SMA(5): $7,306.85
   SMA(20): $7,322.25
   Volatility: 0.56%

🚨 SIGNIFICANT EVENTS:
   1. Volume Spike at 10:00:00 AM
      Volume: 4,191.233 (2.94x avg)

⚡ TRADING SIGNALS:
   🔴 SELL Signal (Strong)
      Reason: Bearish MA alignment (5<10<20)

🔮 TREND PREDICTION:
   Current: $7,344.96
   Predicted: $7,350.12 (📈 UP)
   Confidence: 67.3%
```

## 🏗️ Architecture

### **Modular Design**:
- **Data Layer**: Multiple format support (synthetic + real)
- **Analysis Layer**: Technical indicators + ML algorithms  
- **Reporting Layer**: Formatted output + comparative analysis
- **Utility Layer**: Reusable mathematical and date functions

### **Scalability Features**:
- **Batch Processing**: Handle multiple data files simultaneously (280+ crypto pairs)
- **Memory Efficient**: Stream processing for large datasets (hundreds of thousands of files)
- **Smart Filtering**: Process only relevant CSV files, skip other formats
- **Progress Tracking**: Real-time feedback during large-scale operations
- **Extensible**: Easy to add new indicators and signals
- **Configurable**: Adjustable parameters for different markets and timeframes

## 🔮 Future Enhancements

### **Planned Features**:
- **Real-time Data**: Live market data integration
- **Advanced ML**: LSTM neural networks for price prediction
- **Portfolio Management**: Multi-asset portfolio optimization
- **Web Interface**: React-based dashboard with charts
- **API Integration**: Binance, Coinbase, other exchanges
- **Backtesting**: Historical strategy performance testing

### **Technical Improvements**:
- **Database Integration**: PostgreSQL/MongoDB for data storage
- **Caching**: Redis for performance optimization
- **Alerts**: Real-time trading signal notifications
- **Export Features**: PDF reports, Excel export
- **Docker Support**: Containerized deployment

## 📄 License

MIT License - Feel free to use and modify for your projects.

## ⚠️ Disclaimer

This tool is for educational and analysis purposes only. Not financial advice. Always do your own research before making investment decisions.

---

**Happy Trading! 📈🚀**

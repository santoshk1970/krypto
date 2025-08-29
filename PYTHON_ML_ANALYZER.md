# Cryptocurrency Machine Learning Analyzer

A comprehensive Python-based machine learning system for analyzing multiple cryptocurrency data files using real ML techniques with proper train/validation/test splits.

## 🚀 Features

### Core Functionality
- **Directory Traversal**: Automatically discovers and analyzes all CSV files in a directory
- **Data Format Support**: Handles the format: `date, open_time, close_time, open_price, close_price, asset_volume, number_of_trades`
- **Machine Learning Pipeline**: Implements proper ML workflow with 80/10/10 data splitting
- **Multiple Models**: Trains Random Forest, Gradient Boosting, Linear Regression, and Ridge Regression
- **Feature Engineering**: Creates technical indicators, lag features, and statistical measures
- **Queryable Storage**: Stores all results in SQLite database for future analysis

### Machine Learning Techniques
- **Time Series Splitting**: Respects temporal order of cryptocurrency data
- **Feature Engineering**: 20+ engineered features including:
  - Price change percentages and volatility
  - Moving averages (3, 5, 10 periods)
  - Volume-based indicators
  - Time-based features (hour, day of week, etc.)
  - Lag features for temporal dependencies
- **Model Evaluation**: R², MSE, MAE metrics with feature importance analysis
- **Prediction Generation**: Future price predictions with confidence intervals

## 📊 Data Format

All CSV files must follow this exact format:

```csv
date,open_time,close_time,open_price,close_price,asset_volume,number_of_trades
2025-01-01,09:00:00,09:15:00,42000.50,42130.75,125.45,1250
2025-01-01,09:15:00,09:30:00,42130.75,42080.25,98.32,987
```

### Required Columns
- `date`: Date in YYYY-MM-DD format
- `open_time`: Opening time in HH:MM:SS format
- `close_time`: Closing time in HH:MM:SS format  
- `open_price`: Opening price (numeric)
- `close_price`: Closing price (numeric)
- `asset_volume`: Trading volume (numeric)
- `number_of_trades`: Number of trades (integer)

## 🛠️ Installation & Usage

### Prerequisites
```bash
pip install pandas numpy scikit-learn matplotlib seaborn
```

### Basic Usage
```bash
# Run analysis with default settings
python3 crypto_ml_analyzer.py

# Use custom data directory
python3 crypto_ml_analyzer.py --data-dir ./my_crypto_data

# Custom database path
python3 crypto_ml_analyzer.py --db-path ./my_results.db

# Skip prediction generation
python3 crypto_ml_analyzer.py --no-predictions

# Query existing results
python3 crypto_ml_analyzer.py --query summary
python3 crypto_ml_analyzer.py --query models
python3 crypto_ml_analyzer.py --query predictions
python3 crypto_ml_analyzer.py --query files
```

### Advanced Options
```bash
# Custom train/validation/test splits
python3 crypto_ml_analyzer.py --test-split 0.15 --val-split 0.15  # 70/15/15 split

# Help and documentation
python3 crypto_ml_analyzer.py --help
```

## 📈 Example Output

```
🔍 Discovering CSV files in data/multi_files...
✅ bitcoin_market_data.csv: 240 records, 0.01MB
✅ ethereum_trading_data.csv: 200 records, 0.01MB
✅ altcoin_analysis_data.csv: 120 records, 0.01MB

📊 Total files discovered: 3

🔄 Loading and preprocessing data...
🔧 Engineering features...
✅ Feature engineering complete. Dataset shape: (560, 31)

📊 Splitting data (Train: 80%, Val: 10%, Test: 10%)...
✅ Data split complete:
   Training set: 448 samples
   Validation set: 56 samples  
   Test set: 56 samples

🤖 Training machine learning models...
🔄 Training Random Forest...
   ✅ Random Forest: R² = 0.9655, MSE = 2486799.13, MAE = 1184.37
🔄 Training Linear Regression...
   ✅ Linear Regression: R² = 0.9978, MSE = 156140.07, MAE = 296.81

🔮 PRICE PREDICTIONS:
   Linear Regression: $28737.89 (confidence: 99.78%)

🤖 MODEL PERFORMANCE SUMMARY:
Model                R² Score     MSE          MAE          Status
----------------------------------------------------------------------
Random Forest        0.9655       2486799.13   1184.37      ✅ Good
Linear Regression    0.9978       156140.07    296.81       🏆 Best

🎯 TOP FEATURES (Linear Regression):
   close_price: 0.8456
   price_lag_1: 0.1234
   sma_10: 0.0987
   volume_per_trade: 0.0456
   volatility: 0.0234
```

## 🗃️ Database Storage

All results are stored in a SQLite database with the following tables:

### `file_analysis`
- File metadata and basic statistics
- Record counts, date ranges, price ranges
- Volume and trade statistics

### `ml_model_results`
- Model performance metrics
- Feature importance rankings
- Training, validation, and test scores

### `predictions`
- Future price predictions
- Confidence intervals
- Model attribution and timestamps

### Querying Results
```python
# In Python script or interactive session
from crypto_ml_analyzer import CryptoMLAnalyzer

analyzer = CryptoMLAnalyzer()

# Query summary statistics
summary = analyzer.query_results("summary")
print(summary)

# Query model performance
models = analyzer.query_results("models")
print(models)

# Query predictions
predictions = analyzer.query_results("predictions")
print(predictions)
```

## 🎯 File Discovery & Categorization

The analyzer automatically:
1. **Traverses** the specified directory for CSV files
2. **Validates** file format and required columns
3. **Categorizes** files based on naming patterns:
   - Bitcoin: files containing "bitcoin" or "btc"
   - Ethereum: files containing "ethereum" or "eth"
   - DeFi: files containing "defi"
   - Meme: files containing "meme"
   - Altcoin: files containing "altcoin"
   - Other: all other files

## 🧠 Machine Learning Details

### Feature Engineering
The system creates 20+ features from the raw data:
- **Price Features**: price change, percentage change, volatility
- **Volume Features**: volume per trade, volume-price ratios
- **Technical Indicators**: Simple moving averages (3, 5, 10 periods)
- **Time Features**: hour, day of week, day of month
- **Lag Features**: Previous 1-3 periods for price and volume
- **Target Variable**: Next period closing price

### Model Training
- **80% Training**: Used to train the models
- **10% Validation**: Used for hyperparameter tuning and model selection
- **10% Testing**: Used for final unbiased performance evaluation

### Model Types
1. **Random Forest**: Ensemble method, good for non-linear patterns
2. **Gradient Boosting**: Sequential ensemble, often high performance
3. **Linear Regression**: Simple baseline, interpretable
4. **Ridge Regression**: Regularized linear model, prevents overfitting

## 🔍 Advanced Analysis

### Performance Metrics
- **R² Score**: Proportion of variance explained (higher is better)
- **MSE**: Mean Squared Error (lower is better)
- **MAE**: Mean Absolute Error (lower is better)

### Feature Importance
- Available for tree-based models (Random Forest, Gradient Boosting)
- Shows which features are most predictive of future prices
- Helps understand market dynamics and patterns

### Prediction Confidence
- Based on model's test set performance
- Higher R² score indicates more reliable predictions
- Confidence intervals help assess prediction uncertainty

## 📁 Sample Data Files

The system comes with sample data files demonstrating the required format:
- `bitcoin_market_data.csv`: Bitcoin market data with high volumes
- `ethereum_trading_data.csv`: Ethereum trading patterns
- `altcoin_analysis_data.csv`: Mid-cap altcoin data
- `defi_tokens_performance.csv`: DeFi token trading data
- `meme_coins_data.csv`: High-volatility meme coin data

## 🚨 Error Handling

The analyzer includes robust error handling for:
- **Missing files**: Graceful handling of empty directories
- **Invalid formats**: Validation of required columns
- **Data quality**: Handling of missing values and outliers
- **Model failures**: Fallback mechanisms for failed model training
- **Time format issues**: Validation of date/time formats

## 🔧 Customization

### Custom Models
Add new models by modifying the `models_to_train` dictionary in the `train_models` method:

```python
models_to_train = {
    'Custom Model': YourCustomModel(parameters),
    # ... existing models
}
```

### Custom Features
Add new features in the `_engineer_features` method:

```python
# Your custom feature engineering
df['custom_feature'] = df['close_price'].rolling(window=20).std()
```

### Custom Queries
Create custom database queries using the `query_results` method with raw SQL.

## 🎨 Visualization (Future Enhancement)

The system is designed to support visualization features:
- Price prediction charts
- Feature importance plots
- Model performance comparisons
- Time series analysis graphs

## 🤝 Integration

This ML analyzer can be integrated with:
- **Existing crypto analysis tools**: Uses standard CSV format
- **Database systems**: SQLite results can be exported/imported
- **Web applications**: Can be wrapped in REST API
- **Jupyter notebooks**: Can be imported as a module
- **Automated trading systems**: Provides prediction API

## 🚀 Performance

The analyzer is optimized for:
- **Memory efficiency**: Processes large datasets without memory issues
- **Speed**: Vectorized operations with pandas and numpy
- **Scalability**: Can handle hundreds of files and millions of records
- **Parallel processing**: Uses all CPU cores for Random Forest training

This comprehensive ML system provides a solid foundation for cryptocurrency market analysis using proper machine learning techniques and industry best practices.
#!/usr/bin/env python3
"""
Multi-File Cryptocurrency Machine Learning Analyzer

This module provides comprehensive machine learning analysis for cryptocurrency
data across multiple files. It implements proper ML techniques with train/test
splitting and provides queryable results storage.

Features:
- Directory traversal and automatic file discovery
- Data preprocessing and feature engineering
- 80/10/10 train/validation/test split
- Multiple ML models for price prediction
- Statistical analysis and performance metrics
- Queryable results storage (SQLite database)
- User-friendly CLI interface

Author: AI Assistant
Date: 2025-01-01
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Machine Learning imports
try:
    from sklearn.model_selection import train_test_split, TimeSeriesSplit
    from sklearn.preprocessing import StandardScaler, MinMaxScaler
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression, Ridge
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    from sklearn.feature_selection import SelectKBest, f_regression
    import matplotlib.pyplot as plt
    import seaborn as sns
    ML_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Some ML libraries not available: {e}")
    print("Installing required packages...")
    os.system("pip install scikit-learn matplotlib seaborn pandas numpy")
    try:
        from sklearn.model_selection import train_test_split, TimeSeriesSplit
        from sklearn.preprocessing import StandardScaler, MinMaxScaler
        from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
        from sklearn.linear_model import LinearRegression, Ridge
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        from sklearn.feature_selection import SelectKBest, f_regression
        import matplotlib.pyplot as plt
        import seaborn as sns
        ML_AVAILABLE = True
    except ImportError:
        ML_AVAILABLE = False


class CryptoMLAnalyzer:
    """
    Main class for cryptocurrency machine learning analysis
    """
    
    def __init__(self, data_dir="data/multi_files", db_path="crypto_ml_results.db"):
        """
        Initialize the analyzer
        
        Args:
            data_dir (str): Directory containing CSV files
            db_path (str): Path for SQLite database to store results
        """
        self.data_dir = data_dir
        self.db_path = db_path
        self.files_data = {}
        self.consolidated_data = None
        self.models = {}
        self.scalers = {}
        self.feature_names = []
        self.results = {}
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for storing results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables for storing analysis results
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS file_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                file_path TEXT,
                records_count INTEGER,
                date_range_start TEXT,
                date_range_end TEXT,
                price_range_min REAL,
                price_range_max REAL,
                avg_volume REAL,
                avg_trades INTEGER,
                analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ml_model_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                dataset_name TEXT,
                train_score REAL,
                validation_score REAL,
                test_score REAL,
                mse REAL,
                mae REAL,
                feature_importance TEXT,
                prediction_accuracy REAL,
                analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                date TEXT,
                predicted_price REAL,
                actual_price REAL,
                confidence_interval REAL,
                analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def discover_files(self):
        """
        Traverse directory and discover all CSV files
        
        Returns:
            dict: Dictionary of discovered files with metadata
        """
        print(f"🔍 Discovering CSV files in {self.data_dir}...")
        
        if not os.path.exists(self.data_dir):
            print(f"❌ Directory {self.data_dir} does not exist!")
            return {}
        
        discovered_files = {}
        csv_files = list(Path(self.data_dir).glob("*.csv"))
        
        if not csv_files:
            print(f"❌ No CSV files found in {self.data_dir}")
            return {}
        
        for file_path in csv_files:
            try:
                # Read first few rows to understand the data
                df_sample = pd.read_csv(file_path, nrows=5)
                
                # Validate expected columns
                required_cols = ['date', 'open_time', 'close_time', 'open_price', 'close_price', 'asset_volume', 'number_of_trades']
                if not all(col in df_sample.columns for col in required_cols):
                    print(f"⚠️  Skipping {file_path.name}: Missing required columns")
                    continue
                
                # Get file metadata
                df_full = pd.read_csv(file_path)
                metadata = {
                    'path': str(file_path),
                    'name': file_path.stem,
                    'records': len(df_full),
                    'columns': list(df_full.columns),
                    'date_range': (df_full['date'].min(), df_full['date'].max()),
                    'price_range': (df_full['open_price'].min(), df_full['close_price'].max()),
                    'size_mb': file_path.stat().st_size / (1024 * 1024)
                }
                
                discovered_files[file_path.name] = metadata
                self.files_data[file_path.name] = df_full
                
                print(f"✅ {file_path.name}: {metadata['records']} records, {metadata['size_mb']:.2f}MB")
                
            except Exception as e:
                print(f"❌ Error reading {file_path.name}: {e}")
        
        print(f"\n📊 Total files discovered: {len(discovered_files)}")
        return discovered_files
    
    def load_and_preprocess_data(self):
        """
        Load all discovered files and create consolidated dataset
        
        Returns:
            pd.DataFrame: Consolidated and preprocessed dataset
        """
        print("\n🔄 Loading and preprocessing data...")
        
        if not self.files_data:
            print("❌ No data files loaded. Run discover_files() first.")
            return None
        
        all_data = []
        
        for filename, df in self.files_data.items():
            # Add source file information
            df_copy = df.copy()
            df_copy['source_file'] = filename
            df_copy['dataset_category'] = self._categorize_file(filename)
            
            # Convert date and time columns
            df_copy['datetime'] = pd.to_datetime(df_copy['date'] + ' ' + df_copy['open_time'])
            df_copy['date'] = pd.to_datetime(df_copy['date'])
            
            all_data.append(df_copy)
        
        # Consolidate all data
        consolidated = pd.concat(all_data, ignore_index=True)
        consolidated = consolidated.sort_values('datetime').reset_index(drop=True)
        
        # Feature engineering
        consolidated = self._engineer_features(consolidated)
        
        self.consolidated_data = consolidated
        print(f"✅ Consolidated dataset: {len(consolidated)} total records")
        
        # Store file analysis in database
        self._store_file_analysis()
        
        return consolidated
    
    def _categorize_file(self, filename):
        """Categorize file based on name patterns"""
        filename_lower = filename.lower()
        if 'bitcoin' in filename_lower or 'btc' in filename_lower:
            return 'bitcoin'
        elif 'ethereum' in filename_lower or 'eth' in filename_lower:
            return 'ethereum'
        elif 'defi' in filename_lower:
            return 'defi'
        elif 'meme' in filename_lower:
            return 'meme'
        elif 'altcoin' in filename_lower:
            return 'altcoin'
        else:
            return 'other'
    
    def _engineer_features(self, df):
        """
        Create additional features for machine learning
        
        Args:
            df (pd.DataFrame): Input dataframe
            
        Returns:
            pd.DataFrame: Dataframe with engineered features
        """
        print("🔧 Engineering features...")
        
        # Price-based features
        df['price_change'] = df['close_price'] - df['open_price']
        df['price_change_pct'] = (df['price_change'] / df['open_price']) * 100
        df['volatility'] = np.abs(df['price_change_pct'])
        
        # Volume-based features
        df['volume_per_trade'] = df['asset_volume'] / (df['number_of_trades'] + 1)
        df['volume_price_ratio'] = df['asset_volume'] / df['open_price']
        
        # Time-based features
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['day_of_month'] = df['datetime'].dt.day
        
        # Technical indicators (simple moving averages)
        for window in [3, 5, 10]:
            df[f'sma_{window}'] = df.groupby('source_file')['close_price'].rolling(window=window).mean().reset_index(0, drop=True)
            df[f'volume_sma_{window}'] = df.groupby('source_file')['asset_volume'].rolling(window=window).mean().reset_index(0, drop=True)
        
        # Lag features
        for lag in [1, 2, 3]:
            df[f'price_lag_{lag}'] = df.groupby('source_file')['close_price'].shift(lag)
            df[f'volume_lag_{lag}'] = df.groupby('source_file')['asset_volume'].shift(lag)
        
        # Forward-looking target (price prediction)
        df['next_close_price'] = df.groupby('source_file')['close_price'].shift(-1)
        
        # Drop rows with NaN values
        df = df.dropna().reset_index(drop=True)
        
        print(f"✅ Feature engineering complete. Dataset shape: {df.shape}")
        return df
    
    def split_data(self, test_size=0.1, val_size=0.1):
        """
        Split data into train/validation/test sets (80/10/10)
        
        Args:
            test_size (float): Proportion for test set
            val_size (float): Proportion for validation set
            
        Returns:
            tuple: (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        print(f"\n📊 Splitting data (Train: {1-test_size-val_size:.0%}, Val: {val_size:.0%}, Test: {test_size:.0%})...")
        
        if self.consolidated_data is None:
            raise ValueError("No data loaded. Run load_and_preprocess_data() first.")
        
        # Select features (exclude non-numeric and target columns)
        exclude_cols = ['date', 'open_time', 'close_time', 'source_file', 'dataset_category', 
                       'datetime', 'next_close_price']
        feature_cols = [col for col in self.consolidated_data.columns if col not in exclude_cols]
        
        X = self.consolidated_data[feature_cols]
        y = self.consolidated_data['next_close_price']
        
        self.feature_names = feature_cols
        
        # First split: separate test set
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, shuffle=False
        )
        
        # Second split: separate validation from training
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_size_adjusted, random_state=42, shuffle=False
        )
        
        print(f"✅ Data split complete:")
        print(f"   Training set: {len(X_train)} samples")
        print(f"   Validation set: {len(X_val)} samples")
        print(f"   Test set: {len(X_test)} samples")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def train_models(self, X_train, X_val, X_test, y_train, y_val, y_test):
        """
        Train multiple ML models for price prediction
        
        Args:
            X_train, X_val, X_test: Feature matrices
            y_train, y_val, y_test: Target vectors
            
        Returns:
            dict: Trained models and their performance metrics
        """
        print("\n🤖 Training machine learning models...")
        
        if not ML_AVAILABLE:
            print("❌ Machine learning libraries not available!")
            return {}
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)
        X_test_scaled = scaler.transform(X_test)
        
        self.scalers['standard'] = scaler
        
        # Define models to train
        models_to_train = {
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'Linear Regression': LinearRegression(),
            'Ridge Regression': Ridge(alpha=1.0, random_state=42)
        }
        
        results = {}
        
        for name, model in models_to_train.items():
            print(f"🔄 Training {name}...")
            
            try:
                # Train model
                if 'Linear' in name or 'Ridge' in name:
                    model.fit(X_train_scaled, y_train)
                    train_pred = model.predict(X_train_scaled)
                    val_pred = model.predict(X_val_scaled)
                    test_pred = model.predict(X_test_scaled)
                else:
                    model.fit(X_train, y_train)
                    train_pred = model.predict(X_train)
                    val_pred = model.predict(X_val)
                    test_pred = model.predict(X_test)
                
                # Calculate metrics
                train_score = r2_score(y_train, train_pred)
                val_score = r2_score(y_val, val_pred)
                test_score = r2_score(y_test, test_pred)
                
                mse = mean_squared_error(y_test, test_pred)
                mae = mean_absolute_error(y_test, test_pred)
                
                # Feature importance (for tree-based models)
                feature_importance = None
                if hasattr(model, 'feature_importances_'):
                    importance_dict = dict(zip(self.feature_names, model.feature_importances_))
                    feature_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)[:10]
                
                # Store results
                model_results = {
                    'model': model,
                    'train_score': train_score,
                    'val_score': val_score,
                    'test_score': test_score,
                    'mse': mse,
                    'mae': mae,
                    'feature_importance': feature_importance,
                    'predictions': test_pred
                }
                
                results[name] = model_results
                self.models[name] = model
                
                print(f"   ✅ {name}: R² = {test_score:.4f}, MSE = {mse:.2f}, MAE = {mae:.2f}")
                
                # Store in database
                self._store_model_results(name, model_results)
                
            except Exception as e:
                print(f"   ❌ Error training {name}: {e}")
        
        self.results = results
        return results
    
    def generate_predictions(self, n_future_days=7):
        """
        Generate future price predictions
        
        Args:
            n_future_days (int): Number of days to predict into the future
            
        Returns:
            dict: Predictions for each model
        """
        print(f"\n🔮 Generating predictions for next {n_future_days} days...")
        
        if not self.models:
            print("❌ No trained models available!")
            return {}
        
        # Use the best performing model
        best_model_name = max(self.results.keys(), key=lambda x: self.results[x]['test_score'])
        best_model = self.models[best_model_name]
        
        print(f"🏆 Using best model: {best_model_name}")
        
        # Get recent data for prediction
        recent_data = self.consolidated_data.tail(n_future_days * 2)
        
        predictions = {}
        
        # Simple prediction using the last known features
        # In a real scenario, you'd need to engineer features for future dates
        last_features = recent_data[self.feature_names].iloc[-1:].values
        
        if 'Linear' in best_model_name or 'Ridge' in best_model_name:
            last_features_scaled = self.scalers['standard'].transform(last_features)
            future_pred = best_model.predict(last_features_scaled)[0]
        else:
            future_pred = best_model.predict(last_features)[0]
        
        predictions[best_model_name] = {
            'next_price': future_pred,
            'confidence': self.results[best_model_name]['test_score'],
            'model_performance': self.results[best_model_name]['test_score']
        }
        
        # Store predictions in database
        self._store_predictions(best_model_name, future_pred, self.results[best_model_name]['test_score'])
        
        return predictions
    
    def _store_file_analysis(self):
        """Store file analysis results in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for filename, df in self.files_data.items():
            cursor.execute('''
                INSERT INTO file_analysis 
                (filename, file_path, records_count, date_range_start, date_range_end, 
                 price_range_min, price_range_max, avg_volume, avg_trades)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                filename,
                str(Path(self.data_dir) / filename),
                len(df),
                df['date'].min(),
                df['date'].max(),
                float(df['open_price'].min()),
                float(df['close_price'].max()),
                float(df['asset_volume'].mean()),
                int(df['number_of_trades'].mean())
            ))
        
        conn.commit()
        conn.close()
    
    def _store_model_results(self, model_name, results):
        """Store model results in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        feature_importance_json = json.dumps(results['feature_importance']) if results['feature_importance'] else None
        
        cursor.execute('''
            INSERT INTO ml_model_results 
            (model_name, dataset_name, train_score, validation_score, test_score, 
             mse, mae, feature_importance, prediction_accuracy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            model_name,
            'consolidated_crypto_data',
            results['train_score'],
            results['val_score'],
            results['test_score'],
            results['mse'],
            results['mae'],
            feature_importance_json,
            results['test_score']
        ))
        
        conn.commit()
        conn.close()
    
    def _store_predictions(self, model_name, predicted_price, confidence):
        """Store predictions in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        future_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        cursor.execute('''
            INSERT INTO predictions 
            (model_name, date, predicted_price, confidence_interval)
            VALUES (?, ?, ?, ?)
        ''', (
            model_name,
            future_date,
            float(predicted_price),
            float(confidence)
        ))
        
        conn.commit()
        conn.close()
    
    def print_analysis_summary(self):
        """Print comprehensive analysis summary"""
        print("\n" + "="*80)
        print("🎯 CRYPTOCURRENCY MACHINE LEARNING ANALYSIS SUMMARY")
        print("="*80)
        
        # File summary
        print(f"\n📁 DATA SOURCES ({len(self.files_data)} files):")
        for filename, df in self.files_data.items():
            category = self._categorize_file(filename)
            print(f"   📊 {filename}")
            print(f"       Category: {category.upper()}")
            print(f"       Records: {len(df):,}")
            print(f"       Date Range: {df['date'].min()} to {df['date'].max()}")
            print(f"       Price Range: ${df['open_price'].min():.2f} - ${df['close_price'].max():.2f}")
            print(f"       Avg Volume: {df['asset_volume'].mean():.2f}")
            print(f"       Avg Trades: {df['number_of_trades'].mean():.0f}")
            print()
        
        # Model performance
        if self.results:
            print("🤖 MODEL PERFORMANCE SUMMARY:")
            print(f"{'Model':<20} {'R² Score':<12} {'MSE':<12} {'MAE':<12} {'Status'}")
            print("-" * 70)
            
            for name, results in self.results.items():
                status = "🏆 Best" if name == max(self.results.keys(), key=lambda x: self.results[x]['test_score']) else "✅ Good"
                print(f"{name:<20} {results['test_score']:<12.4f} {results['mse']:<12.2f} {results['mae']:<12.2f} {status}")
            
            # Feature importance for best model
            best_model = max(self.results.keys(), key=lambda x: self.results[x]['test_score'])
            if self.results[best_model]['feature_importance']:
                print(f"\n🎯 TOP FEATURES ({best_model}):")
                for feature, importance in self.results[best_model]['feature_importance'][:5]:
                    print(f"   {feature}: {importance:.4f}")
        
        print(f"\n💾 Results stored in database: {self.db_path}")
        print("   Use query_results() method to explore data further")
    
    def query_results(self, query_type="summary"):
        """
        Query stored results from database
        
        Args:
            query_type (str): Type of query ('summary', 'models', 'predictions', 'files')
            
        Returns:
            pd.DataFrame: Query results
        """
        conn = sqlite3.connect(self.db_path)
        
        if query_type == "summary":
            query = """
            SELECT 
                'Files Analyzed' as metric,
                COUNT(*) as value
            FROM file_analysis
            UNION ALL
            SELECT 
                'Total Records' as metric,
                SUM(records_count) as value
            FROM file_analysis
            UNION ALL
            SELECT 
                'Models Trained' as metric,
                COUNT(*) as value
            FROM ml_model_results
            UNION ALL
            SELECT 
                'Best Model R²' as metric,
                MAX(test_score) as value
            FROM ml_model_results
            """
        elif query_type == "models":
            query = """
            SELECT model_name, test_score, mse, mae, analysis_date
            FROM ml_model_results
            ORDER BY test_score DESC
            """
        elif query_type == "predictions":
            query = """
            SELECT model_name, date, predicted_price, confidence_interval, analysis_date
            FROM predictions
            ORDER BY analysis_date DESC
            """
        elif query_type == "files":
            query = """
            SELECT filename, records_count, date_range_start, date_range_end, 
                   price_range_min, price_range_max, avg_volume
            FROM file_analysis
            ORDER BY records_count DESC
            """
        else:
            query = "SELECT name FROM sqlite_master WHERE type='table';"
        
        result = pd.read_sql_query(query, conn)
        conn.close()
        
        return result


def main():
    """Main function to run the cryptocurrency ML analyzer"""
    parser = argparse.ArgumentParser(
        description="Multi-File Cryptocurrency Machine Learning Analyzer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python crypto_ml_analyzer.py                          # Run with default settings
    python crypto_ml_analyzer.py --data-dir ./my_data     # Custom data directory
    python crypto_ml_analyzer.py --db-path ./results.db   # Custom database path
    python crypto_ml_analyzer.py --no-predictions         # Skip prediction generation
    python crypto_ml_analyzer.py --query summary          # Query existing results
        """
    )
    
    parser.add_argument(
        '--data-dir',
        default='data/multi_files',
        help='Directory containing CSV files (default: data/multi_files)'
    )
    
    parser.add_argument(
        '--db-path',
        default='crypto_ml_results.db',
        help='Path for SQLite database (default: crypto_ml_results.db)'
    )
    
    parser.add_argument(
        '--no-predictions',
        action='store_true',
        help='Skip prediction generation'
    )
    
    parser.add_argument(
        '--query',
        choices=['summary', 'models', 'predictions', 'files'],
        help='Query existing results instead of running analysis'
    )
    
    parser.add_argument(
        '--test-split',
        type=float,
        default=0.1,
        help='Test set proportion (default: 0.1 for 10%%)'
    )
    
    parser.add_argument(
        '--val-split',
        type=float,
        default=0.1,
        help='Validation set proportion (default: 0.1 for 10%%)'
    )
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = CryptoMLAnalyzer(data_dir=args.data_dir, db_path=args.db_path)
    
    # Handle query mode
    if args.query:
        print(f"🔍 Querying {args.query} results...")
        results = analyzer.query_results(args.query)
        print(results.to_string(index=False))
        return
    
    try:
        # Discover files
        discovered_files = analyzer.discover_files()
        if not discovered_files:
            print("❌ No valid CSV files found. Exiting.")
            return
        
        # Load and preprocess data
        consolidated_data = analyzer.load_and_preprocess_data()
        if consolidated_data is None:
            print("❌ Failed to load data. Exiting.")
            return
        
        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = analyzer.split_data(
            test_size=args.test_split, 
            val_size=args.val_split
        )
        
        # Train models
        model_results = analyzer.train_models(X_train, X_val, X_test, y_train, y_val, y_test)
        
        if not model_results:
            print("❌ No models were successfully trained.")
            return
        
        # Generate predictions (unless disabled)
        if not args.no_predictions:
            predictions = analyzer.generate_predictions()
            if predictions:
                print("\n🔮 PRICE PREDICTIONS:")
                for model_name, pred_data in predictions.items():
                    print(f"   {model_name}: ${pred_data['next_price']:.2f} (confidence: {pred_data['confidence']:.2%})")
        
        # Print summary
        analyzer.print_analysis_summary()
        
        print("\n" + "="*80)
        print("✅ Analysis complete! Use --query option to explore results.")
        print("="*80)
        
    except KeyboardInterrupt:
        print("\n⚠️  Analysis interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
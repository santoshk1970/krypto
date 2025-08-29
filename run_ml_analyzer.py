#!/usr/bin/env python3
"""
Simple CLI wrapper for the Cryptocurrency ML Analyzer

This provides an easy-to-use command line interface for the machine learning
cryptocurrency analysis system.
"""

import sys
import os

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from crypto_ml_analyzer import main
    
    if __name__ == "__main__":
        print("🚀 Starting Cryptocurrency Machine Learning Analyzer...")
        print("=" * 60)
        main()
        
except ImportError as e:
    print(f"❌ Error importing analyzer: {e}")
    print("Installing required dependencies...")
    os.system("pip install pandas numpy scikit-learn matplotlib seaborn")
    
    try:
        from crypto_ml_analyzer import main
        main()
    except Exception as e2:
        print(f"❌ Failed to run analyzer: {e2}")
        sys.exit(1)
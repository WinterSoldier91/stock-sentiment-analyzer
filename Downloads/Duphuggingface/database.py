import os
import sqlite3
from datetime import datetime, timedelta
import pytz
import pandas as pd
import streamlit as st

# Database connection - Using SQLite as fallback since Supabase is not accessible
def get_db_connection():
    """Get SQLite connection with graceful error handling"""
    try:
        # Use persistent path if available, otherwise local file
        db_path = '/data/sentiment_history.db' if os.path.exists('/data') else 'sentiment_history.db'
        return sqlite3.connect(db_path)
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected database error: {e}")
        return None

def init_database():
    """Initialize SQLite database tables"""
    conn = get_db_connection()
    if conn is None:
        print("Cannot initialize database - connection failed")
        return
    
    try:
        cursor = conn.cursor()
        
        # Create sentiment_history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sentiment_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                headline TEXT NOT NULL,
                sentiment_score REAL NOT NULL,
                negative REAL NOT NULL,
                neutral REAL NOT NULL,
                positive REAL NOT NULL,
                article_datetime TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                UNIQUE(ticker, headline, article_datetime)
            )
        ''')
        
        # Create cache_metadata table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache_metadata (
                ticker TEXT PRIMARY KEY,
                last_fetch_time TEXT NOT NULL,
                article_count INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_sentiment_history_ticker_datetime 
            ON sentiment_history(ticker, article_datetime DESC)
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ SQLite database initialized successfully")
        
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")
        if conn:
            conn.close()

@st.cache_data(ttl=900)  # Cache for 15 minutes
def get_historical_data(ticker, days=30):
    """Retrieve historical data from SQLite database"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - returning empty DataFrame")
        return pd.DataFrame()
    
    try:
        cursor = conn.cursor()
        
        ist = pytz.timezone('Asia/Kolkata')
        cutoff_date = (datetime.now(ist) - timedelta(days=days)).isoformat()
        
        cursor.execute('''
            SELECT article_datetime, sentiment_score, headline, negative, neutral, positive
            FROM sentiment_history
            WHERE ticker = ? AND article_datetime >= ?
            ORDER BY article_datetime DESC
        ''', (ticker, cutoff_date))
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not rows:
            return pd.DataFrame()
        
        df = pd.DataFrame(rows, columns=[
            'article_datetime', 'sentiment_score', 'headline', 'negative', 'neutral', 'positive'
        ])
        
        if len(df) > 0:
            df['article_datetime'] = pd.to_datetime(df['article_datetime'])
            df = df.set_index('article_datetime')
        
        return df
    except Exception as e:
        print(f"Error fetching historical data: {e}")
        if conn:
            conn.close()
        return pd.DataFrame()

def can_fetch_new_data(ticker):
    """Check if we can fetch new data based on rate limiting"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - allowing fresh data fetch")
        return True, "Database unavailable - fetching fresh data"
    
    try:
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT last_fetch_time FROM cache_metadata WHERE ticker = ?
        ''', (ticker,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result is None:
            return True, "No cached data - fetching fresh data"
        
        ist = pytz.timezone('Asia/Kolkata')
        last_fetch = datetime.fromisoformat(result[0])
        now = datetime.now(ist)
        
        # Remove timezone info for comparison
        if last_fetch.tzinfo:
            last_fetch = last_fetch.replace(tzinfo=None)
        if now.tzinfo:
            now = now.replace(tzinfo=None)
        
        time_diff = now - last_fetch
        minutes_since_fetch = time_diff.total_seconds() / 60
        
        if minutes_since_fetch < 15:  # CACHE_MINUTES
            remaining = 15 - int(minutes_since_fetch)
            return False, f"Using cached data (fetched {int(minutes_since_fetch)} min ago, next refresh in {remaining} min)"
        
        return True, "Cache expired - fetching fresh data"
    except Exception as e:
        print(f"Error checking cache metadata: {e}")
        if conn:
            conn.close()
        return True, "Cache check failed - fetching fresh data"

def update_cache_metadata(ticker, article_count):
    """Update cache metadata after fetching"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - skipping cache metadata update")
        return
    
    try:
        cursor = conn.cursor()
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist).isoformat()
        
        cursor.execute('''
            INSERT OR REPLACE INTO cache_metadata (ticker, last_fetch_time, article_count)
            VALUES (?, ?, ?)
        ''', (ticker, now, article_count))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error updating cache metadata: {e}")
        if conn:
            conn.close()

def store_sentiment_data(ticker, parsed_and_scored_news):
    """Store sentiment data in SQLite"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - skipping data storage")
        return
    
    try:
        cursor = conn.cursor()
        ist = pytz.timezone('Asia/Kolkata')
        fetched_at = datetime.now(ist).isoformat()
        
        for idx, row in parsed_and_scored_news.iterrows():
            # Check if article already exists
            cursor.execute('''
                SELECT id, article_datetime FROM sentiment_history
                WHERE ticker = ? AND headline = ?
            ''', (ticker, row['headline']))
            
            existing = cursor.fetchone()
            
            if existing is None:
                # Insert new article
                cursor.execute('''
                    INSERT INTO sentiment_history
                    (ticker, headline, sentiment_score, negative, neutral, positive, article_datetime, fetched_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    ticker,
                    row['headline'],
                    row['sentiment_score'],
                    row['neg'],
                    row['neu'],
                    row['pos'],
                    idx,
                    fetched_at
                ))
            else:
                # Update existing article
                cursor.execute('''
                    UPDATE sentiment_history
                    SET article_datetime = ?,
                        sentiment_score = ?,
                        negative = ?,
                        neutral = ?,
                        positive = ?,
                        fetched_at = ?
                    WHERE id = ?
                ''', (
                    idx,
                    row['sentiment_score'],
                    row['neg'],
                    row['neu'],
                    row['pos'],
                    fetched_at,
                    existing[0]
                ))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error storing sentiment data: {e}")
        if conn:
            conn.close()

def get_cache_metadata(ticker):
    """Get cache metadata for a ticker"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - returning None for cache metadata")
        return None
    
    try:
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT last_fetch_time, article_count FROM cache_metadata WHERE ticker = %s
        ''', (ticker,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        print(f"Error getting cache metadata: {e}")
        if conn:
            conn.close()
        return None

def clear_cache_for_ticker(ticker):
    """Clear cache for a specific ticker"""
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed - skipping cache clear")
        return
    
    try:
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cache_metadata WHERE ticker = %s', (ticker,))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error clearing cache: {e}")
        if conn:
            conn.close()

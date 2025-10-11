import streamlit as st
from streamlit_lightweight_charts import renderLightweightCharts
from urllib.request import urlopen, Request
from bs4 import BeautifulSoup
import pandas as pd
import sqlite3
import time
import random
from datetime import datetime, timedelta
import pytz

# NLTK VADER for sentiment analysis
import nltk
import ssl
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
nltk.download('vader_lexicon', quiet=True)
from nltk.sentiment.vader import SentimentIntensityAnalyzer

st.set_page_config(
    page_title="TradingView Test - Stock Sentiment Analyzer", 
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Database setup
DB_NAME = 'sentiment_history.db'
CACHE_MINUTES = 15  # Cache data for 15 minutes

def init_database():
    """Initialize SQLite database for historical data storage"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create sentiment history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sentiment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            headline TEXT NOT NULL,
            sentiment_score REAL NOT NULL,
            negative REAL,
            neutral REAL,
            positive REAL,
            article_datetime TEXT NOT NULL,
            fetched_at TEXT NOT NULL,
            source_date TEXT
        )
    ''')
    
    # Create cache metadata table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cache_metadata (
            ticker TEXT PRIMARY KEY,
            last_fetch_time TEXT NOT NULL,
            article_count INTEGER NOT NULL
        )
    ''')
    
    # Create index for faster queries
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_ticker_datetime 
        ON sentiment_history(ticker, article_datetime)
    ''')
    
    conn.commit()
    conn.close()

def get_historical_data(ticker, days=30):
    """Retrieve historical data from database"""
    conn = sqlite3.connect(DB_NAME)
    
    ist = pytz.timezone('Asia/Kolkata')
    cutoff_date = (datetime.now(ist) - timedelta(days=days)).isoformat()
    
    query = '''
        SELECT article_datetime, sentiment_score, headline, negative, neutral, positive
        FROM sentiment_history
        WHERE ticker = ? AND article_datetime >= ?
        ORDER BY article_datetime DESC
    '''
    
    df = pd.read_sql_query(query, conn, params=(ticker, cutoff_date))
    conn.close()
    
    if len(df) > 0:
        df['article_datetime'] = pd.to_datetime(df['article_datetime'])
        df = df.set_index('article_datetime')
    
    return df

def create_tradingview_chart_data(data, chart_type):
    """Prepare data for streamlit-lightweight-charts with manual IST offset"""
    
    # Ensure IST timezone awareness
    ist = pytz.timezone('Asia/Kolkata')
    utc = pytz.utc
    
    # Make the data index timezone-aware if it isn't already
    if data.index.tz is None:
        data.index = data.index.tz_localize(ist)
    elif str(data.index.tz) != 'Asia/Kolkata':
        data.index = data.index.tz_convert(ist)
    
    # Forward-fill gaps (keep in IST for now)
    if len(data) > 0:
        freq = 'h' if chart_type == 'hourly' else 'D'
        complete_range = pd.date_range(
            start=data.index.min(),
            end=data.index.max(),
            freq=freq,
            tz=ist  # Explicitly set timezone
        )
        filled_data = data.reindex(complete_range)
        filled_data['sentiment_score'] = filled_data['sentiment_score'].ffill()
        filled_data = filled_data.dropna()
    else:
        filled_data = data
    
    # Convert to TradingView format with manual IST offset
    chart_data = []
    IST_OFFSET_SECONDS = 19800  # 5 hours 30 minutes in seconds
    
    for timestamp, row in filled_data.iterrows():
        if chart_type == 'hourly':
            # Convert IST to UTC, then add IST offset to display in IST
            timestamp_utc = timestamp.astimezone(utc)
            # Add IST offset so chart displays IST time correctly
            time_value = int(timestamp_utc.timestamp()) + IST_OFFSET_SECONDS
        else:
            # Daily: Use date string (no timezone needed)
            time_value = timestamp.strftime('%Y-%m-%d')
        
        chart_data.append({
            "time": time_value,
            "value": float(row['sentiment_score'])
        })
    
    return chart_data

def plot_hourly_sentiment(data, ticker, title_suffix=""):
    """Create hourly chart using streamlit-lightweight-charts"""
    mean_scores = data.resample('h').mean(numeric_only=True)
    
    if len(mean_scores) == 0:
        st.warning("No hourly data available")
        return
    
    chart_data = create_tradingview_chart_data(mean_scores, 'hourly')
    
    # Use streamlit-lightweight-charts package
    chart_options = [{
        "chart": {
            "height": 400,
            "layout": {
                "background": {"color": "#0e1117"},
                "textColor": "#fafafa"
            },
            "grid": {
                "vertLines": {"color": "#262730"},
                "horzLines": {"color": "#262730"}
            },
            "crosshair": {
                "mode": 0  # Normal mode
            },
            "timeScale": {
                "timeVisible": True,
                "secondsVisible": False,
                "hoursVisible": True,
                "minutesVisible": True,
                "borderVisible": True
            }
        },
        "series": [{
            "type": "Histogram",
            "data": chart_data,
            "options": {
                "color": "#00d4ff",
                "priceFormat": {
                    "type": "price",
                    "precision": 3,
                    "minMove": 0.001
                }
            }
        }]
    }]
    
    renderLightweightCharts(chart_options, key=f"hourly_{ticker}")

def plot_daily_sentiment(data, ticker, title_suffix=""):
    """Create daily chart using streamlit-lightweight-charts"""
    mean_scores = data.resample('d').mean(numeric_only=True)
    
    if len(mean_scores) == 0:
        st.warning("No daily data available")
        return
    
    chart_data = create_tradingview_chart_data(mean_scores, 'daily')
    
    # Use streamlit-lightweight-charts package
    chart_options = [{
        "chart": {
            "height": 400,
            "layout": {
                "background": {"color": "#0e1117"},
                "textColor": "#fafafa"
            },
            "grid": {
                "vertLines": {"color": "#262730"},
                "horzLines": {"color": "#262730"}
            },
            "crosshair": {
                "mode": 0  # Normal mode
            },
            "timeScale": {
                "timeVisible": True,
                "secondsVisible": False,
                "hoursVisible": True,
                "minutesVisible": True,
                "borderVisible": True
            }
        },
        "series": [{
            "type": "Histogram",
            "data": chart_data,
            "options": {
                "color": "#00d4ff",
                "priceFormat": {
                    "type": "price",
                    "precision": 3,
                    "minMove": 0.001
                }
            }
        }]
    }]
    
    renderLightweightCharts(chart_options, key=f"daily_{ticker}")

# Initialize database
init_database()

st.header("🧪 TradingView Lightweight Charts Test")

st.info("🔬 **Testing Environment**: This is a local test version with TradingView Lightweight Charts. The main app uses Plotly and is safe.")

# Input section
col1, col2 = st.columns([3, 1])
with col1:
    ticker = st.text_input('Enter Stock Ticker', '').upper()
with col2:
    view_mode = st.selectbox('View', ['Historical (7 days)', 'Historical (30 days)', 'Historical (90 days)', 'Historical (6 months)', 'Historical (1 year)'], index=1)

if ticker:
    try:
        st.subheader(f"📈 TradingView Test for {ticker}")
        
        # Get historical data
        if '7' in view_mode:
            days = 7
        elif '30' in view_mode:
            days = 30
        elif '90' in view_mode:
            days = 90
        elif '6 months' in view_mode:
            days = 180  # 6 months = ~180 days
        elif '1 year' in view_mode:
            days = 365  # 1 year = 365 days
        else:
            days = 30  # default fallback
        
        historical_df = get_historical_data(ticker, days=days)
        
        if len(historical_df) > 0:
            st.success(f"✅ Found {len(historical_df)} articles in database")
            
            # Calculate comprehensive metrics
            hourly_scores = historical_df.resample('h').mean(numeric_only=True)
            daily_scores = historical_df.resample('d').mean(numeric_only=True)
            
            # Calculate current and previous sentiment values
            current_sentiment = float(hourly_scores.iloc[-1].iloc[0]) if len(hourly_scores) > 0 else 0.0
            previous_sentiment = float(hourly_scores.iloc[-2].iloc[0]) if len(hourly_scores) > 1 else current_sentiment
            delta_sentiment = current_sentiment - previous_sentiment
            
            # Data range
            min_date = historical_df.index.min()
            max_date = historical_df.index.max()
            data_range = f"{min_date.strftime('%b %d')} - {max_date.strftime('%b %d, %H:%M')}"
            
            # Display comprehensive metrics dashboard
            st.subheader("📊 Analytics Dashboard")
            
            # Row 1: Data Collection Metrics
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("📰 Total Articles", len(historical_df))
            with col2:
                st.metric("⏱️ Hourly Bars", len(hourly_scores.dropna()))
            with col3:
                st.metric("📅 Daily Bars", len(daily_scores.dropna()))
            with col4:
                st.metric("📈 Data Coverage", data_range)
            with col5:
                st.metric("🕐 Latest Update", max_date.strftime('%H:%M'))
            
            # Row 2: Sentiment Analysis Metrics
            col1, col2, col3, col4, col5, col6 = st.columns(6)
            with col1:
                st.metric("🎯 Current Sentiment", f"{current_sentiment:.3f}", 
                         delta=f"{delta_sentiment:.3f}" if len(hourly_scores) > 1 else None)
            with col2:
                st.metric("📊 Previous Sentiment", f"{previous_sentiment:.3f}")
            with col3:
                st.metric("📈 Average Sentiment", f"{historical_df['sentiment_score'].mean():.3f}")
            with col4:
                st.metric("⬆️ Highest Sentiment", f"{historical_df['sentiment_score'].max():.3f}")
            with col5:
                st.metric("⬇️ Lowest Sentiment", f"{historical_df['sentiment_score'].min():.3f}")
            with col6:
                st.metric("📊 Volatility", f"{historical_df['sentiment_score'].std():.3f}")
            
            # Charts
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**{ticker} Hourly Sentiment Scores ({view_mode.replace('Historical (', '').replace(')', '')})**")
                plot_hourly_sentiment(historical_df, ticker, f" ({view_mode.replace('Historical (', '').replace(')', '')})")
            with col2:
                st.write(f"**{ticker} Daily Sentiment Scores ({view_mode.replace('Historical (', '').replace(')', '')})**")
                plot_daily_sentiment(historical_df, ticker, f" ({view_mode.replace('Historical (', '').replace(')', '')})")
            
            # Show some data
            st.subheader("Sample Data")
            st.dataframe(historical_df.head(10))
        else:
            st.warning(f"No historical data available for {ticker}. Try running the main app first to collect data.")

    except Exception as e:
        st.error(f"Error: {str(e)}")

else:
    st.info("👆 Enter a stock ticker above to test TradingView charts")
    st.write("""
    ### Testing Features:
    - **TradingView Lightweight Charts**: Professional charting library
    - **Forward-fill gaps**: Continuous data for crosshair functionality
    - **Crosshair everywhere**: Shows sentiment values at any cursor position
    - **Dark theme**: Matches your app's styling
    
    ### How to test:
    1. Enter a stock ticker (e.g., "BTC")
    2. Charts will render using TradingView Lightweight Charts
    3. Move cursor anywhere on chart - crosshair should show values
    4. Compare with main app's Plotly charts
    """)

# Footer
st.markdown("---")
st.caption("🧪 Testing Environment | 💾 Uses same database as main app | 🔄 Safe to experiment")

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

# Inject premium CDN resources
premium_cdn = """
<!-- Premium Typography -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">

<!-- Premium Icons -->
<script src="https://unpkg.com/@phosphor-icons/web"></script>

<!-- Tailwind CSS for utility classes -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'bg-primary': '#0a0e1a',
          'bg-secondary': '#151b2e',
          'bg-tertiary': '#1e2538',
          'accent-primary': '#6366f1',
          'accent-secondary': '#8b5cf6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
          'text-primary': '#f8fafc',
          'text-secondary': '#94a3b8',
          'border': '#2d3548'
        },
        fontFamily: {
          'inter': ['Inter', 'sans-serif'],
          'mono': ['JetBrains Mono', 'monospace'],
          'manrope': ['Manrope', 'sans-serif']
        }
      }
    }
  }
</script>
"""
st.markdown(premium_cdn, unsafe_allow_html=True)

# Database setup
import os
# Use persistent storage on Hugging Face Spaces, local path otherwise
DB_NAME = '/data/sentiment_history.db' if os.path.exists('/data') else 'sentiment_history.db'
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

# FinViz news fetching functions
finviz_url = 'https://finviz.com/quote.ashx?t='

def can_fetch_new_data(ticker):
    """Check if we can fetch new data based on rate limiting"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT last_fetch_time FROM cache_metadata WHERE ticker = ?
    ''', (ticker,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result is None:
        return True, "No cached data - fetching fresh data"
    
    last_fetch = datetime.fromisoformat(result[0])
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    # Remove timezone info for comparison
    if last_fetch.tzinfo:
        last_fetch = last_fetch.replace(tzinfo=None)
    if now.tzinfo:
        now = now.replace(tzinfo=None)
    
    time_diff = now - last_fetch
    minutes_since_fetch = time_diff.total_seconds() / 60
    
    if minutes_since_fetch < CACHE_MINUTES:
        remaining = CACHE_MINUTES - int(minutes_since_fetch)
        return False, f"Using cached data (fetched {int(minutes_since_fetch)} min ago, next refresh in {remaining} min)"
    
    return True, "Fetching fresh data"

def update_cache_metadata(ticker, article_count):
    """Update cache metadata after fetching"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist).isoformat()
    
    cursor.execute('''
        INSERT OR REPLACE INTO cache_metadata (ticker, last_fetch_time, article_count)
        VALUES (?, ?, ?)
    ''', (ticker, now, article_count))
    
    conn.commit()
    conn.close()

def get_news(ticker):
    url = finviz_url + ticker
    req = Request(url=url,headers={'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}) 
    
    # Add delay to be respectful to the server
    time.sleep(random.uniform(1, 3))
    
    response = urlopen(req)    
    html = BeautifulSoup(response, 'html.parser')
    news_table = html.find(id='news-table')
    return news_table

def parse_news(news_table):
    parsed_news = []
    eastern = pytz.timezone('US/Eastern')
    today_string = datetime.now(eastern).strftime('%Y-%m-%d')
    ist = pytz.timezone('Asia/Kolkata')
    last_date = today_string  # Track last seen date for time-only entries
    
    for x in news_table.find_all('tr'):
        try:
            text = x.a.get_text() 
            date_scrape = x.td.text.split()
            if len(date_scrape) == 1:
                time = date_scrape[0]
                date = last_date  # Use last seen date
            else:
                date = date_scrape[0]
                time = date_scrape[1]
                last_date = date  # Update last seen date
            parsed_news.append([date, time, text]) 
        except:
            pass
    
    columns = ['date', 'time', 'headline']
    parsed_news_df = pd.DataFrame(parsed_news, columns=columns)        
    parsed_news_df['date'] = parsed_news_df['date'].replace("Today", today_string)
    parsed_news_df['datetime'] = pd.to_datetime(parsed_news_df['date'] + ' ' + parsed_news_df['time'], format='mixed')
    
    eastern = pytz.timezone('US/Eastern')
    ist = pytz.timezone('Asia/Kolkata')
    parsed_news_df['datetime'] = parsed_news_df['datetime'].dt.tz_localize(eastern).dt.tz_convert(ist)
    
    return parsed_news_df

def score_news(parsed_news_df):
    vader = SentimentIntensityAnalyzer()
    scores = parsed_news_df['headline'].apply(vader.polarity_scores).tolist()
    scores_df = pd.DataFrame(scores)
    parsed_and_scored_news = parsed_news_df.join(scores_df, rsuffix='_right')        
    parsed_and_scored_news = parsed_and_scored_news.set_index('datetime')    
    parsed_and_scored_news = parsed_and_scored_news.drop(columns=['date', 'time'])          
    parsed_and_scored_news = parsed_and_scored_news.rename(columns={"compound": "sentiment_score"})
    return parsed_and_scored_news

def store_sentiment_data(ticker, parsed_and_scored_news):
    """Store sentiment data in database"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    ist = pytz.timezone('Asia/Kolkata')
    fetched_at = datetime.now(ist).isoformat()
    
    for idx, row in parsed_and_scored_news.iterrows():
        # Check if this article already exists (by ticker and headline only)
        cursor.execute('''
            SELECT id, article_datetime FROM sentiment_history 
            WHERE ticker = ? AND headline = ?
        ''', (ticker, row['headline']))
        
        existing = cursor.fetchone()
        
        if existing is None:
            # New article - insert it
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
                idx.isoformat(),
                fetched_at
            ))
        else:
            # Article exists - update only if new datetime is different
            existing_id, existing_datetime = existing
            new_datetime = idx.isoformat()
            
            # Update if datetime changed (keeps most recent sentiment scores)
            if new_datetime != existing_datetime:
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
                    new_datetime,
                    row['sentiment_score'],
                    row['neg'],
                    row['neu'],
                    row['pos'],
                    fetched_at,
                    existing_id
                ))
    
    conn.commit()
    conn.close()

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

# Import future article fixer
from future_article_fixer import check_future_articles, fix_future_articles, ignore_future_article

# Professional Header with Navigation
professional_header = """
<div class="professional-header">
    <div class="header-container">
        <div class="header-left">
            <div class="logo-section">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                </svg>
                <div class="brand-text">
                    <h1 class="brand-title">TradingView Pro</h1>
                    <p class="brand-subtitle">Professional Chart Analysis Platform</p>
                </div>
            </div>
        </div>
        <div class="header-right">
            <div class="status-indicators">
                <div class="status-item">
                    <i class="ph ph-chart-line"></i>
                    <span>TradingView Charts</span>
                </div>
                <div class="status-item">
                    <i class="ph ph-database"></i>
                    <span>Historical Data</span>
                </div>
                <div class="status-item">
                    <i class="ph ph-clock"></i>
                    <span>IST</span>
                </div>
            </div>
        </div>
    </div>
</div>
"""
st.markdown(professional_header, unsafe_allow_html=True)

# Check for future-dated articles and show fix option
future_summary, future_count, future_articles_detail = check_future_articles()
if future_count > 0:
    st.warning(f"⚠️ **Future-Dated Articles Detected**")
    st.text(future_summary)
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔧 Fix Future-Dated Articles", type="primary"):
            with st.spinner("Fixing future-dated articles by fetching correct timestamps from FinViz..."):
                result = fix_future_articles()
                
            if result['fixed'] > 0:
                st.success(f"✅ **Fixed {result['fixed']} articles!**")
            if result['not_found'] > 0:
                st.warning(f"⚠️ **{result['not_found']} articles not found on FinViz**")
                st.info("These articles may have been removed from FinViz. You can ignore them individually below.")
            if result['errors'] > 0:
                st.error(f"❌ {result['errors']} tickers had errors during processing")
            
            st.info("🔄 **Please refresh the page to see updated data**")
            st.stop()
    
    # Show individual articles with ignore option
    if future_count > 0:
        st.subheader("📋 Individual Articles")
        for ticker, article_id, headline, article_dt in future_articles_detail:
            col_a, col_b = st.columns([4, 1])
            with col_a:
                st.text(f"{ticker}: {headline[:80]}...")
                st.caption(f"Timestamp: {article_dt}")
            with col_b:
                if st.button(f"🗑️ Ignore", key=f"ignore_{article_id}"):
                    ignore_future_article(article_id)
                    st.success(f"✅ **Article deleted** - Warning will no longer appear")
                    st.info("🔄 **Please refresh the page**")
                    st.stop()

st.info("🔬 **Testing Environment**: This is a local test version with TradingView Lightweight Charts. The main app uses Plotly and is safe.")

# Enhanced Input Section (Streamlit-only, no duplicates)
input_section = """
<div class="input-section">
    <div class="input-container">
        <div class="input-wrapper">
            <div class="input-icon">
                <i class="ph ph-magnifying-glass"></i>
            </div>
            <div class="input-content">
                <label class="input-label">Enter Stock Ticker</label>
            </div>
        </div>
        <div class="view-selector-wrapper">
            <label class="input-label">View Mode</label>
        </div>
    </div>
</div>
"""
st.markdown(input_section, unsafe_allow_html=True)

# Create columns for the actual Streamlit inputs (styled but functional)
col1, col2 = st.columns([3, 1])
with col1:
    # Popular ticker options
    popular_tickers = ['BTC', 'ETH', 'SOL', 'AMZN', 'GOOGL', 'TSLA', 'MSTR', 'AAPL']
    
    # Create a custom input with dropdown suggestions
    ticker_input_container = st.container()
    with ticker_input_container:
        col_input, col_dropdown = st.columns([2, 1])
        
        with col_input:
            ticker = st.text_input('Enter Stock Ticker', '', key='ticker_input', placeholder='e.g., BTC, AAPL, TSLA').upper()
        
        with col_dropdown:
            selected_ticker = st.selectbox(
                'Popular Tickers',
                ['Select...'] + popular_tickers,
                key='ticker_dropdown',
                help='Choose from popular tickers'
            )
            
            # If user selects from dropdown, update the text input
            if selected_ticker != 'Select...':
                ticker = selected_ticker

with col2:
    view_mode = st.selectbox('View', [
        'Historical (7 days)', 
        'Historical (30 days)', 
        'Historical (60 days)', 
        'Historical (90 days)', 
        'Historical (6 months)', 
        'Historical (1 year)'
    ], index=1, key='view_selector')

if ticker:
    try:
        st.subheader(f"📈 TradingView Test for {ticker}")
        
        # Check if we can fetch new data and fetch if needed
        can_fetch, message = can_fetch_new_data(ticker)
        
        # Show cache status
        if can_fetch:
            st.info(f"⚡ {message}")
        else:
            st.warning(f"🕐 {message}")
        
        # Fetch and store current data if allowed
        if can_fetch:
            with st.spinner('Fetching fresh data from FinViz...'):
                try:
                    news_table = get_news(ticker)
                    if news_table:
                        parsed_news_df = parse_news(news_table)
                        parsed_and_scored_news = score_news(parsed_news_df)
                        
                        # Store in database
                        store_sentiment_data(ticker, parsed_and_scored_news)
                        update_cache_metadata(ticker, len(parsed_and_scored_news))
                        st.success(f"✅ Fetched and stored {len(parsed_and_scored_news)} articles")
                    else:
                        st.warning("⚠️ No news found for this ticker")
                except Exception as e:
                    st.error(f"❌ Error fetching news: {str(e)}")
        
        # Get historical data (including newly fetched data)
        # Parse days from view_mode
        if '7' in view_mode:
            days = 7
        elif '30' in view_mode:
            days = 30
        elif '60' in view_mode:
            days = 60
        elif '90' in view_mode:
            days = 90
        elif '6 months' in view_mode:
            days = 180  # 6 months ≈ 180 days
        elif '1 year' in view_mode:
            days = 365  # 1 year = 365 days
        else:
            days = 30  # default fallback
        
        historical_df = get_historical_data(ticker, days=days)
        
        if len(historical_df) > 0:
            st.success(f"✅ Found {len(historical_df)} articles in database")
            
            # Enhanced Chart Containers
            chart_section = """
            <div class="charts-section">
                <div class="charts-header">
                    <h3 class="charts-title">
                        <i class="ph ph-chart-line"></i>
                        TradingView Professional Charts
                    </h3>
                    <div class="chart-controls">
                        <button class="chart-control-btn active" data-chart="hourly">
                            <i class="ph ph-clock"></i>
                            Hourly
                        </button>
                        <button class="chart-control-btn" data-chart="daily">
                            <i class="ph ph-calendar"></i>
                            Daily
                        </button>
                    </div>
                </div>
            </div>
            """
            st.markdown(chart_section, unsafe_allow_html=True)
            
            # Charts with professional wrappers
            col1, col2 = st.columns(2)
            with col1:
                chart_wrapper = """
                <div class="chart-container">
                    <div class="chart-header">
                        <h4 class="chart-title">
                            <i class="ph ph-clock"></i>
                            Hourly Sentiment Trend
                        </h4>
                        <div class="chart-actions">
                            <button class="chart-action-btn" title="Export Chart">
                                <i class="ph ph-download"></i>
                            </button>
                            <button class="chart-action-btn" title="Full Screen">
                                <i class="ph ph-arrows-out"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                """
                st.markdown(chart_wrapper, unsafe_allow_html=True)
                plot_hourly_sentiment(historical_df, ticker, f" ({days} Days)")
                st.markdown("</div></div>", unsafe_allow_html=True)
                
            with col2:
                chart_wrapper = """
                <div class="chart-container">
                    <div class="chart-header">
                        <h4 class="chart-title">
                            <i class="ph ph-calendar"></i>
                            Daily Sentiment Trend
                        </h4>
                        <div class="chart-actions">
                            <button class="chart-action-btn" title="Export Chart">
                                <i class="ph ph-download"></i>
                            </button>
                            <button class="chart-action-btn" title="Full Screen">
                                <i class="ph ph-arrows-out"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                """
                st.markdown(chart_wrapper, unsafe_allow_html=True)
                plot_daily_sentiment(historical_df, ticker, f" ({days} Days)")
                st.markdown("</div></div>", unsafe_allow_html=True)
            
            # Enhanced Data Table
            table_section = """
            <div class="data-table-section">
                <div class="table-header">
                    <h3 class="table-title">
                        <i class="ph ph-table"></i>
                        Sample Data
                    </h3>
                    <div class="table-actions">
                        <button class="table-action-btn" title="Export CSV">
                            <i class="ph ph-download"></i>
                            Export
                        </button>
                        <button class="table-action-btn" title="Refresh Data">
                            <i class="ph ph-arrow-clockwise"></i>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
            """
            st.markdown(table_section, unsafe_allow_html=True)
            
            # Display the table with custom styling
            st.dataframe(
                historical_df[['headline', 'sentiment_score']].head(10),
                column_config={
                    "headline": st.column_config.TextColumn(
                        "Headline",
                        width="large",
                    ),
                    "sentiment_score": st.column_config.NumberColumn(
                        "Sentiment Score",
                        format="%.3f",
                    ),
                },
                hide_index=True,
                use_container_width=True
            )
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

# Professional Footer
professional_footer = f"""
<div class="professional-footer">
    <div class="footer-container">
        <div class="footer-content">
            <div class="footer-section">
                <h4 class="footer-title">TradingView Features</h4>
                <div class="footer-item">
                    <i class="ph ph-chart-line"></i>
                    <span>Lightweight Charts</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-crosshair"></i>
                    <span>Crosshair Everywhere</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-timer"></i>
                    <span>Real-time Updates</span>
                </div>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Data Management</h4>
                <div class="footer-item">
                    <i class="ph ph-database"></i>
                    <span>SQLite Database</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-clock"></i>
                    <span>IST Timezone</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-shield-check"></i>
                    <span>Safe Testing</span>
                </div>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Technology</h4>
                <div class="footer-item">
                    <i class="ph ph-code"></i>
                    <span>Python & Streamlit</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-brain"></i>
                    <span>NLTK VADER</span>
                </div>
                <div class="footer-item">
                    <i class="ph ph-chart-bar"></i>
                    <span>TradingView Charts</span>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="footer-copyright">
                <p>&copy; 2024 TradingView Pro. Professional Chart Analysis Platform.</p>
            </div>
            <div class="footer-links">
                <a href="#" class="footer-link">
                    <i class="ph ph-github-logo"></i>
                </a>
                <a href="#" class="footer-link">
                    <i class="ph ph-linkedin-logo"></i>
                </a>
                <a href="#" class="footer-link">
                    <i class="ph ph-envelope"></i>
                </a>
            </div>
        </div>
    </div>
</div>
"""
st.markdown(professional_footer, unsafe_allow_html=True)

# Professional CSS (same as Plotly version)
professional_css = """
<style>
/* Professional Design System */
:root {
    --bg-primary: #0a0e1a;
    --bg-secondary: #151b2e;
    --bg-tertiary: #1e2538;
    --accent-primary: #6366f1;
    --accent-secondary: #8b5cf6;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border: #2d3548;
    --glass-bg: rgba(30, 37, 56, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
}

/* Global Styles */
* {
    box-sizing: border-box;
}

body, .stApp {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
}

/* Professional Header */
.professional-header {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--glass-border);
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo-icon {
    width: 40px;
    height: 40px;
    color: var(--accent-primary);
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
}

.brand-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.brand-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
    font-weight: 400;
}

.status-indicators {
    display: flex;
    gap: 2rem;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
}

.status-item i {
    color: var(--accent-primary);
    font-size: 1.1rem;
}

/* Enhanced Input Section */
.input-section {
    margin: 2rem 0;
    padding: 0 2rem;
}

.input-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    align-items: end;
}

.input-wrapper {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 1rem;
    top: 2.5rem;
    color: var(--text-secondary);
    z-index: 2;
}

.input-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Enhanced Streamlit Input Styling */
.stTextInput > div > div > input {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 12px !important;
    color: var(--text-primary) !important;
    font-size: 1rem !important;
    font-family: 'Inter', sans-serif !important;
    backdrop-filter: blur(10px) !important;
    transition: all 0.3s ease !important;
    padding: 1rem !important;
}

.stTextInput > div > div > input:focus {
    outline: none !important;
    border-color: var(--accent-primary) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
    background: rgba(30, 37, 56, 0.9) !important;
}

.stSelectbox > div > div > select {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 12px !important;
    color: var(--text-primary) !important;
    font-size: 1rem !important;
    font-family: 'Inter', sans-serif !important;
    backdrop-filter: blur(10px) !important;
    transition: all 0.3s ease !important;
    padding: 1rem !important;
}

.stSelectbox > div > div > select:focus {
    outline: none !important;
    border-color: var(--accent-primary) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

.stTextInput label,
.stSelectbox label {
    color: var(--text-secondary) !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
}

/* Popular Tickers Dropdown Styling */
.stSelectbox[data-testid="ticker_dropdown"] > div > div > select {
    background: var(--accent-primary) !important;
    border: 1px solid var(--accent-primary) !important;
    border-radius: 8px !important;
    color: white !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    padding: 0.75rem !important;
    transition: all 0.3s ease !important;
}

.stSelectbox[data-testid="ticker_dropdown"] > div > div > select:hover {
    background: var(--accent-secondary) !important;
    border-color: var(--accent-secondary) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
}

.stSelectbox[data-testid="ticker_dropdown"] label {
    color: var(--accent-primary) !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
}

/* Chart Containers */
.charts-section {
    margin: 2rem 0;
    padding: 0 2rem;
}

.charts-header {
    max-width: 1400px;
    margin: 0 auto 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.charts-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
}

.chart-controls {
    display: flex;
    gap: 0.5rem;
}

.chart-control-btn {
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.chart-control-btn:hover,
.chart-control-btn.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
}

.chart-container {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 2rem;
}

.chart-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--glass-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
}

.chart-actions {
    display: flex;
    gap: 0.5rem;
}

.chart-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.chart-action-btn:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
}

.chart-content {
    padding: 1rem;
}

/* Data Table Section */
.data-table-section {
    margin: 2rem 0;
    padding: 0 2rem;
}

.table-header {
    max-width: 1400px;
    margin: 0 auto 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
}

.table-actions {
    display: flex;
    gap: 0.5rem;
}

.table-action-btn {
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.table-action-btn:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
}

/* Professional Footer */
.professional-footer {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    margin-top: 4rem;
    padding: 3rem 0 1rem;
}

.footer-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.footer-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.footer-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.footer-item i {
    color: var(--accent-primary);
    font-size: 1rem;
}

.footer-bottom {
    border-top: 1px solid var(--border);
    padding-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-copyright {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.footer-links {
    display: flex;
    gap: 1rem;
}

.footer-link {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.3s ease;
}

.footer-link:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
    transform: translateY(-2px);
}

/* Enhanced Streamlit Components */
.stDataFrame {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(10px) !important;
}

.stAlert {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(10px) !important;
}

.stButton > button {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)) !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
}

.stButton > button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3) !important;
}

/* Hide Streamlit branding */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
.stDeployButton {display: none;}

/* Responsive Design */
@media (max-width: 768px) {
    .header-container {
        padding: 0 1rem;
        flex-direction: column;
        gap: 1rem;
    }
    
    .input-container {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .charts-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .footer-bottom {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
}
</style>
"""
st.markdown(professional_css, unsafe_allow_html=True)

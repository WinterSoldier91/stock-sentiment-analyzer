import sqlite3
from urllib.request import urlopen, Request
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import pytz
import time
import random
import ssl

# SSL context fix
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

DB_NAME = 'sentiment_history.db'
finviz_url = 'https://finviz.com/quote.ashx?t='

def get_news(ticker):
    """Fetch news from FinViz"""
    url = finviz_url + ticker
    req = Request(url=url, headers={'User-Agent': 'Mozilla/5.0'})
    time.sleep(random.uniform(2, 4))
    response = urlopen(req)
    html = BeautifulSoup(response, 'html.parser')
    return html.find(id='news-table')

def parse_news(news_table):
    """Parse news with FIXED logic (Eastern timezone)"""
    parsed_news = []
    eastern = pytz.timezone('US/Eastern')
    today_string = datetime.now(eastern).strftime('%Y-%m-%d')
    last_date = today_string
    
    for x in news_table.find_all('tr'):
        try:
            text = x.a.get_text()
            date_scrape = x.td.text.split()
            if len(date_scrape) == 1:
                time = date_scrape[0]
                date = last_date
            else:
                date = date_scrape[0]
                time = date_scrape[1]
                last_date = date
            parsed_news.append([date, time, text])
        except:
            pass
    
    df = pd.DataFrame(parsed_news, columns=['date', 'time', 'headline'])
    df['date'] = df['date'].replace("Today", today_string)
    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'], format='mixed')
    
    # Convert to IST
    eastern = pytz.timezone('US/Eastern')
    ist = pytz.timezone('Asia/Kolkata')
    df['datetime'] = df['datetime'].apply(
        lambda x: eastern.localize(x).astimezone(ist)
    )
    
    return df

def check_future_articles():
    """Check for future-dated articles and return summary"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Get current IST time for comparison
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)
    now_ist_str = now_ist.isoformat()
    
    # Get all future-dated articles (compare timezone-aware timestamps)
    cursor.execute('''
        SELECT ticker, COUNT(*) as count
        FROM sentiment_history
        WHERE article_datetime > ?
        GROUP BY ticker
        ORDER BY count DESC
    ''', (now_ist_str,))
    
    future_articles = cursor.fetchall()
    
    # Also get the actual articles for detailed info
    cursor.execute('''
        SELECT ticker, id, headline, article_datetime
        FROM sentiment_history
        WHERE article_datetime > ?
        ORDER BY ticker
    ''', (now_ist_str,))
    
    future_articles_detail = cursor.fetchall()
    conn.close()
    
    if not future_articles:
        return None, 0, []
    
    # Create summary
    total_count = sum(count for _, count in future_articles)
    summary = f"Found {total_count} future-dated articles across {len(future_articles)} tickers:\n"
    for ticker, count in future_articles:
        summary += f"  • {ticker}: {count} articles\n"
    
    return summary, total_count, future_articles_detail

def fix_future_articles():
    """Fix all future-dated articles by fetching correct timestamps from FinViz"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create backup
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sentiment_history_backup_auto_fix AS 
        SELECT * FROM sentiment_history
    ''')
    conn.commit()
    
    # Get current IST time for comparison
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)
    now_ist_str = now_ist.isoformat()
    
    # Get all future-dated articles grouped by ticker
    cursor.execute('''
        SELECT ticker, id, headline, article_datetime
        FROM sentiment_history
        WHERE article_datetime > ?
        ORDER BY ticker
    ''', (now_ist_str,))
    
    future_articles = cursor.fetchall()
    
    # Group by ticker
    by_ticker = {}
    for ticker, id, headline, dt in future_articles:
        if ticker not in by_ticker:
            by_ticker[ticker] = []
        by_ticker[ticker].append((id, headline, dt))
    
    fixed_count = 0
    not_found_count = 0
    error_count = 0
    
    # Process each ticker
    for ticker, articles in by_ticker.items():
        try:
            # Fetch from FinViz
            news_table = get_news(ticker)
            finviz_df = parse_news(news_table)
            
            # Match each article
            for article_id, headline, old_dt in articles:
                # Try exact match first
                match = finviz_df[finviz_df['headline'] == headline]
                
                if len(match) == 0:
                    # Try fuzzy match (first 50 chars)
                    headline_short = headline[:50]
                    match = finviz_df[finviz_df['headline'].str.startswith(headline_short)]
                
                if len(match) > 0:
                    correct_dt = match.iloc[0]['datetime'].isoformat()
                    
                    # Update database
                    cursor.execute('''
                        UPDATE sentiment_history
                        SET article_datetime = ?
                        WHERE id = ?
                    ''', (correct_dt, article_id))
                    
                    fixed_count += 1
                else:
                    not_found_count += 1
            
            conn.commit()
            
        except Exception as e:
            error_count += 1
    
    conn.close()
    
    return {
        'fixed': fixed_count,
        'not_found': not_found_count,
        'errors': error_count,
        'total': len(future_articles)
    }

def ignore_future_article(article_id):
    """Delete an article from database (ignore it permanently)"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Delete the article from sentiment_history table
    cursor.execute('DELETE FROM sentiment_history WHERE id = ?', (article_id,))
    
    conn.commit()
    conn.close()
    
    return True

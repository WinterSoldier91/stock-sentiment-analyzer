---
title: Stock Sentiment Analyzer
emoji: 📊
colorFrom: blue
colorTo: purple
sdk: streamlit
sdk_version: 1.50.0
app_file: app.py
pinned: false
---

# 📊 Stock Sentiment Analyzer

A professional stock sentiment analysis tool with TradingView-style charts and real-time news fetching.

## ✨ Features

- **📈 TradingView Charts** - Professional lightweight charts with crosshair
- **📰 Real-time News** - Fetches latest news from FinViz
- **🧠 Sentiment Analysis** - VADER sentiment scoring
- **📊 Historical Data** - Persistent storage with multiple time windows
- **🔧 Future Article Fixer** - Automatic timestamp correction
- **⏰ IST Timezone** - Proper timezone handling
- **💾 Persistent Storage** - Data never lost (Hugging Face Spaces)

## 🚀 Usage

1. Enter any stock ticker (e.g., BTC, AAPL, TSLA)
2. Select time window (7d, 30d, 60d, 90d, 6mo, 1yr)
3. View sentiment trends and historical data
4. Data accumulates over time for better insights

## 🛠️ Technical Stack

- **Frontend:** Streamlit + TradingView Lightweight Charts
- **Backend:** Python + SQLite
- **Data Source:** FinViz news scraping
- **Sentiment:** NLTK VADER
- **Deployment:** Hugging Face Spaces

## 📊 Time Windows

- 7 days
- 30 days  
- 60 days
- 90 days
- 6 months
- 1 year

Built with ❤️ using Streamlit and TradingView Lightweight Charts

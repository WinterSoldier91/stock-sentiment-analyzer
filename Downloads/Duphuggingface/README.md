# 📊 Stock News Sentiment Analyzer

A real-time stock news sentiment analysis application built with Streamlit. This app scrapes news headlines from FinViz, analyzes sentiment using VADER, and displays hourly and daily sentiment trends.

## 🌟 Features

- **Real-time News Scraping**: Fetches latest news from FinViz
- **Sentiment Analysis**: Uses NLTK's VADER for sentiment scoring
- **Interactive Charts**: Hourly and daily sentiment visualizations
- **IST Timestamps**: All data displayed in Indian Standard Time
- **Multiple Stocks**: Supports any stock ticker available on FinViz

## 🚀 Live Demo

🔗 **[View Live App](#)** _(Add your Streamlit Cloud URL here after deployment)_

## 📦 Installation

### Local Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Duphuggingface
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the app:
```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

## 🖥️ Usage

1. Enter a stock ticker symbol (e.g., `AAPL`, `GOOGL`, `TSLA`, `BTC`)
2. Press Enter
3. View the sentiment analysis:
   - Hourly sentiment chart
   - Daily sentiment chart
   - Detailed news table with sentiment scores

## 🕐 Timezone

All timestamps are automatically converted from US Eastern Time (FinViz source) to **Indian Standard Time (IST)**.

## 🛠️ Technologies Used

- **Streamlit**: Web application framework
- **Pandas**: Data manipulation
- **Plotly**: Interactive charts
- **BeautifulSoup4**: Web scraping
- **NLTK VADER**: Sentiment analysis
- **Pytz**: Timezone conversion

## 📊 How It Works

1. **Data Fetching**: Scrapes news headlines from FinViz for the specified stock ticker
2. **Parsing**: Extracts date, time, and headline text
3. **Sentiment Analysis**: VADER analyzes each headline and assigns scores:
   - Positive
   - Negative
   - Neutral
   - Compound (overall sentiment)
4. **Aggregation**: Groups sentiment scores by hour and day
5. **Visualization**: Displays interactive bar charts with IST timestamps

## 📝 License

MIT License

## 👨‍💻 Author

Bohmian's Stock News Sentiment Analyzer

---

**Note**: This app uses web scraping from FinViz. Ensure compliance with their terms of service for your use case.

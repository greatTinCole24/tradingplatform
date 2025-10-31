# 📊 QuantHub - Streamlit Edition

**AI-Powered Financial Dashboard Generator**

A simple Streamlit app that generates beautiful financial charts from natural language queries using OpenAI's GPT-4.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.32-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 💬 **Natural Language Queries** - Ask questions in plain English
- 🤖 **AI-Powered Analysis** - GPT-4 extracts symbols and time periods
- 📈 **Interactive Charts** - Beautiful Plotly visualizations
- 📊 **Data Export** - Download data as CSV
- 🎨 **Clean UI** - Simple, intuitive interface
- ⚡ **Instant Deploy** - One-click deployment to Streamlit Cloud

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd tradingplatform

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create secrets file
mkdir .streamlit
echo 'OPENAI_API_KEY = "sk-your-key-here"' > .streamlit/secrets.toml

# 4. Run the app
streamlit run app.py
```

Your app will open at `http://localhost:8501` 🎉

## 🌐 Deploy to Streamlit Cloud (Recommended)

### Step-by-Step Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Go to Streamlit Cloud**
   - Visit [share.streamlit.io](https://share.streamlit.io)
   - Click "New app"
   - Select your GitHub repository
   - Choose `app.py` as the main file
   - Click "Deploy"

3. **Add Your OpenAI API Key**
   - In the Streamlit Cloud dashboard, click "⚙️ Settings"
   - Go to "Secrets"
   - Add:
     ```toml
     OPENAI_API_KEY = "sk-your-key-here"
     ```
   - Click "Save"

4. **Done!** Your app is now live! 🚀

### Video Tutorial
[Watch how to deploy to Streamlit Cloud](https://docs.streamlit.io/streamlit-community-cloud/get-started)

## 🎯 Usage

### Example Queries

Once your app is running, try these queries:

**Stock Comparisons:**
- "Show me AAPL price vs SPY for the last 6 months"
- "Compare Microsoft and Google stock prices this year"
- "Display TSLA vs NVDA over the last quarter"

**Crypto Analysis:**
- "Bitcoin vs Ethereum prices for the last year"
- "Show me BTC performance over 6 months"

**Single Asset Tracking:**
- "Display Apple stock price for the last 90 days"
- "Show Tesla performance this year"

### How It Works

1. **You ask a question** in natural language
2. **GPT-4 analyzes** your query and extracts:
   - Ticker symbols (AAPL, SPY, Bitcoin, etc.)
   - Time period (6 months, 1 year, etc.)
   - Visualization type (line chart, bar chart, etc.)
3. **Generates realistic mock data** for demonstration
4. **Creates an interactive Plotly chart** automatically
5. **Displays both** the chart and raw data table

## 📁 Project Structure

```
tradingplatform/
├── app.py                      # Main Streamlit application
├── requirements.txt            # Python dependencies
├── .streamlit/
│   ├── config.toml            # Streamlit configuration
│   └── secrets.toml           # API keys (local only, not in git)
├── .gitignore                 # Git ignore file
└── README.md                  # This file
```

## 🔧 Configuration

### Streamlit Secrets

For local development, create `.streamlit/secrets.toml`:

```toml
OPENAI_API_KEY = "sk-..."
```

For Streamlit Cloud, add secrets in the dashboard under "⚙️ Settings → Secrets"

### Customizing the Theme

Edit `.streamlit/config.toml` to customize colors:

```toml
[theme]
primaryColor="#3b82f6"      # Primary accent color
backgroundColor="#ffffff"    # Background color
secondaryBackgroundColor="#f0f2f6"  # Secondary background
textColor="#262730"         # Text color
```

## 🎨 Customization

### Adding Real API Integrations

Replace the `generate_mock_data()` function in `app.py` with real API calls:

```python
import yfinance as yf

def get_real_data(symbols, days):
    """Fetch real stock data using yfinance"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    data = yf.download(
        symbols, 
        start=start_date, 
        end=end_date
    )['Close']
    
    return data.reset_index()
```

Don't forget to add `yfinance` to `requirements.txt`!

### Adding More Chart Types

Extend the `create_plotly_chart()` function:

```python
elif chart_type == 'candlestick':
    fig = go.Figure(data=[go.Candlestick(
        x=data['date'],
        open=data['open'],
        high=data['high'],
        low=data['low'],
        close=data['close']
    )])
```

## 🐛 Troubleshooting

### "OpenAI API key not found"

**Solution:** Make sure you've added `OPENAI_API_KEY` to:
- `.streamlit/secrets.toml` (local)
- Streamlit Cloud secrets (production)

### "Module not found"

**Solution:** Install requirements:
```bash
pip install -r requirements.txt
```

### Charts not displaying

**Solution:** 
- Check browser console for errors
- Try a different example query
- Verify your OpenAI API has credits

### Deployment fails on Streamlit Cloud

**Solution:**
1. Verify `requirements.txt` is in the root directory
2. Check that `app.py` is the correct filename
3. Look at deployment logs in Streamlit Cloud dashboard

## 💡 Features Explained

### Mock Data Generation
- Simulates realistic price movements
- Includes volatility, trends, and seasonality
- Supports stocks and cryptocurrencies

### AI Query Understanding
- Extracts ticker symbols from natural language
- Interprets time periods ("6 months" → 180 days)
- Chooses appropriate visualization types

### Interactive Charts
- Zoom and pan
- Hover for exact values
- Toggle series on/off
- Download as PNG

## 🚀 Going Further

### Ideas to Extend This App

1. **Real Data Sources**
   - Add Yahoo Finance integration
   - Connect to Alpha Vantage API
   - Use Polygon.io for real-time data

2. **More Visualizations**
   - Candlestick charts
   - Volume analysis
   - Technical indicators (RSI, MACD)
   - Correlation matrices

3. **Advanced Features**
   - Save favorite queries
   - Share dashboards via URL
   - Export to PDF
   - Email alerts

4. **Portfolio Tracking**
   - Add portfolio management
   - Calculate returns
   - Risk analysis
   - Diversification metrics

## 📚 Resources

- [Streamlit Documentation](https://docs.streamlit.io)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Plotly Documentation](https://plotly.com/python/)
- [Streamlit Community](https://discuss.streamlit.io)

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## ⭐ Star This Project

If you find this useful, please star the repository!

---

**Built with ❤️ using Streamlit, OpenAI, and Plotly**

*Demo uses simulated financial data - not for actual trading decisions!*

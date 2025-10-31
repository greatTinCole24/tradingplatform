# ⚡ Quick Start Guide - QuantHub Streamlit

Get QuantHub running in **under 2 minutes**!

## 🏃 Fastest Way: Streamlit Cloud

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: QuantHub Streamlit"
git remote add origin https://github.com/yourusername/quanthub.git
git push -u origin main
```

### 2. Deploy to Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click **"New app"**
3. Select your GitHub repo
4. Main file: `app.py`
5. Click **"Deploy"**

### 3. Add OpenAI API Key

1. In your app dashboard, click **⚙️ Settings**
2. Go to **Secrets**
3. Paste:
   ```toml
   OPENAI_API_KEY = "sk-your-key-here"
   ```
4. Click **Save**

**Done! Your app is live!** 🎉

---

## 💻 Local Development

### Setup (30 seconds)

```bash
# Install
pip install -r requirements.txt

# Configure
mkdir .streamlit
echo 'OPENAI_API_KEY = "sk-your-key"' > .streamlit/secrets.toml

# Run
streamlit run app.py
```

Open **http://localhost:8501** 🚀

---

## 🎯 Try These Queries

1. `Show me AAPL price vs SPY for the last 6 months`
2. `Compare Bitcoin and Ethereum prices this year`
3. `Display Tesla stock performance over the last quarter`

---

## 🆘 Troubleshooting

**"OpenAI API key not found"**
- Add key to `.streamlit/secrets.toml` locally
- Add key in Streamlit Cloud dashboard → Settings → Secrets

**"Module not found"**
- Run: `pip install -r requirements.txt`

**Deployment fails**
- Check `requirements.txt` exists
- Verify `app.py` filename is correct
- View logs in Streamlit Cloud dashboard

---

## 🎓 Learn More

- [Full README](./README.md) - Complete documentation
- [Streamlit Docs](https://docs.streamlit.io) - Official guides
- [OpenAI API](https://platform.openai.com/docs) - API reference

---

**That's it!** You now have a fully functional AI-powered dashboard generator! 🎊


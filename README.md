## QuantHub (Streamlit Demo SaaS)

QuantHub is a polished, investor-ready Streamlit demo showcasing an options order-flow + market intelligence platform. It runs entirely in mock mode by default, with optional Snowflake integration if credentials are present.

### Features
- Executive KPI dashboard
- Options Flow analytics
- Gamma Exposure (GEX)
- Unusual Activity Scanner
- Alerts demo with toasts
- Pricing / Upgrade simulation
- Ask QuantHub chatbot (deterministic viz engine + optional LLM routing)
- Mock “Live Mode” refresh

### Run Locally
```bash
pip install -r requirements.txt
streamlit run app.py
```

### Optional: LLM Mode
Add `OPENAI_API_KEY` in `.streamlit/secrets.toml` to enable LLM routing in Ask QuantHub.

```toml
OPENAI_API_KEY = "sk-..."
```

### Optional: Snowflake
If you want to enable Snowflake mode, add credentials in `.streamlit/secrets.toml`:
```toml
SNOWFLAKE_USER = "..."
SNOWFLAKE_PASSWORD = "..."
SNOWFLAKE_ACCOUNT = "..."
SNOWFLAKE_WAREHOUSE = "..."
SNOWFLAKE_DATABASE = "..."
SNOWFLAKE_SCHEMA = "..."
```

### Project Structure
```
app.py
pages/
  01_Home.py
  02_Flow.py
  03_GEX.py
  04_Scanner.py
  05_Alerts.py
  06_Pricing.py
  07_Ask_QuantHub.py

quanthub/
  data_mock.py
  analytics.py
  viz_engine.py
  chatbot.py
  ui.py
  snowflake_io.py
  data_access.py
```

### Notes
- Mock mode is deterministic by seed (set in sidebar).
- Live mode re-renders at interval without changing seed.
- Optional features degrade gracefully if dependencies are missing.

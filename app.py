"""
QuantHub - AI-Powered Financial Dashboard Generator
A simple Streamlit app that generates charts from natural language queries
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import numpy as np
import json
from openai import OpenAI

# Page config
st.set_page_config(
    page_title="QuantHub - AI Financial Dashboards",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        font-size: 1.2rem;
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    .stButton>button {
        width: 100%;
        height: 3rem;
        font-size: 1.1rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize OpenAI client
@st.cache_resource
def get_openai_client():
    api_key = st.secrets.get("OPENAI_API_KEY", None)
    if not api_key:
        st.error("⚠️ OpenAI API key not found. Please add it to Streamlit secrets.")
        st.stop()
    return OpenAI(api_key=api_key)

# Data generation function
def generate_mock_data(symbols, days=180):
    """Generate realistic mock financial data"""
    
    base_prices = {
        'AAPL': 175, 'SPY': 450, 'MSFT': 380, 'GOOGL': 140,
        'TSLA': 250, 'NVDA': 480, 'AMZN': 150, 'META': 350,
        'Bitcoin': 43000, 'Ethereum': 2300, 'BTC': 43000, 'ETH': 2300
    }
    
    dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') 
             for i in range(days, -1, -1)]
    
    data = {'date': dates}
    
    for symbol in symbols:
        base_price = base_prices.get(symbol, 100)
        prices = []
        
        for i in range(len(dates)):
            volatility = 0.02
            trend = (i / len(dates)) * 0.1 * base_price
            random_walk = np.random.randn() * volatility * base_price
            seasonal = np.sin(i / 30 * np.pi) * (base_price * 0.03)
            
            price = base_price + trend + random_walk + seasonal
            prices.append(round(price, 2))
        
        data[symbol] = prices
    
    return pd.DataFrame(data)

# LLM tools definition
tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_financial_data",
            "description": "Generate mock financial data for demonstration",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of ticker symbols (e.g., ['AAPL', 'SPY'])"
                    },
                    "days": {
                        "type": "number",
                        "description": "Number of days of historical data"
                    }
                },
                "required": ["symbols", "days"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_chart",
            "description": "Create a chart visualization",
            "parameters": {
                "type": "object",
                "properties": {
                    "chart_type": {
                        "type": "string",
                        "enum": ["line", "bar", "area"],
                        "description": "Type of chart"
                    },
                    "title": {
                        "type": "string",
                        "description": "Chart title"
                    },
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Symbols to plot"
                    }
                },
                "required": ["chart_type", "title", "symbols"]
            }
        }
    }
]

def process_query(query, client):
    """Process natural language query using OpenAI"""
    
    system_prompt = """You are a financial data visualization assistant. 
    
Your job:
1. Extract ticker symbols from the query (e.g., AAPL, SPY, Bitcoin, Ethereum)
2. Determine the time period (e.g., "6 months" = 180 days, "1 year" = 365 days, "quarter" = 90 days)
3. Use generate_financial_data to create the data
4. Use create_chart to specify how to visualize it

Default to line charts for time series. Use 180 days if time period isn't specified."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]
    
    chart_config = None
    data = None
    
    # Call OpenAI with function calling
    for iteration in range(5):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        messages.append(message)
        
        if not message.tool_calls:
            break
        
        # Execute tool calls
        for tool_call in message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            if function_name == "generate_financial_data":
                data = generate_mock_data(
                    function_args['symbols'],
                    function_args['days']
                )
                result = {"success": True, "rows": len(data)}
                
            elif function_name == "create_chart":
                chart_config = function_args
                result = {"success": True, "config": chart_config}
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
    
    return data, chart_config

def create_plotly_chart(data, config):
    """Create a Plotly chart from data and config"""
    
    chart_type = config.get('chart_type', 'line')
    title = config.get('title', 'Financial Data')
    symbols = config.get('symbols', [])
    
    fig = go.Figure()
    
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    
    for idx, symbol in enumerate(symbols):
        if symbol in data.columns:
            if chart_type == 'line':
                fig.add_trace(go.Scatter(
                    x=data['date'],
                    y=data[symbol],
                    mode='lines',
                    name=symbol,
                    line=dict(color=colors[idx % len(colors)], width=2)
                ))
            elif chart_type == 'bar':
                fig.add_trace(go.Bar(
                    x=data['date'],
                    y=data[symbol],
                    name=symbol,
                    marker_color=colors[idx % len(colors)]
                ))
            elif chart_type == 'area':
                fig.add_trace(go.Scatter(
                    x=data['date'],
                    y=data[symbol],
                    mode='lines',
                    name=symbol,
                    fill='tonexty',
                    line=dict(color=colors[idx % len(colors)])
                ))
    
    fig.update_layout(
        title=title,
        xaxis_title="Date",
        yaxis_title="Price",
        hovermode='x unified',
        height=500,
        template='plotly_white'
    )
    
    return fig

# Main UI
def main():
    # Header
    st.markdown('<div class="main-header">📊 QuantHub</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">AI-Powered Financial Dashboard Generator</div>', unsafe_allow_html=True)
    
    # Description
    with st.expander("ℹ️ How it works", expanded=False):
        st.markdown("""
        1. **Ask a question** in natural language about financial data
        2. **AI extracts** the symbols and time period from your query
        3. **Generates** realistic mock data for demonstration
        4. **Creates** a beautiful interactive chart automatically
        
        **Example queries:**
        - "Show me AAPL price vs SPY for the last 6 months"
        - "Compare Bitcoin and Ethereum prices this year"
        - "Display Tesla stock performance over the last quarter"
        """)
    
    # Query input
    st.markdown("### Ask a Question")
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        query = st.text_area(
            "What would you like to visualize?",
            placeholder="e.g., Show me AAPL stock price vs SPY for the last 6 months",
            height=100,
            label_visibility="collapsed"
        )
    
    # Example buttons
    st.markdown("**Try these examples:**")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📈 AAPL vs SPY (6 months)"):
            query = "Show me AAPL price vs SPY for the last 6 months"
            st.session_state.query = query
    
    with col2:
        if st.button("💰 Bitcoin vs Ethereum (1 year)"):
            query = "Compare Bitcoin and Ethereum prices this year"
            st.session_state.query = query
    
    with col3:
        if st.button("🚗 Tesla Performance (Quarter)"):
            query = "Display Tesla stock performance over the last quarter"
            st.session_state.query = query
    
    # Use session state query if set
    if 'query' in st.session_state:
        query = st.session_state.query
    
    # Generate button
    if st.button("✨ Generate Dashboard", type="primary", use_container_width=True):
        if not query:
            st.warning("⚠️ Please enter a question first!")
            return
        
        with st.spinner("🤖 AI is analyzing your query and generating visualization..."):
            try:
                client = get_openai_client()
                data, chart_config = process_query(query, client)
                
                if data is not None and chart_config is not None:
                    st.success("✅ Dashboard generated successfully!")
                    
                    # Display chart
                    st.markdown("---")
                    fig = create_plotly_chart(data, chart_config)
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Display data table
                    with st.expander("📊 View Raw Data", expanded=False):
                        st.dataframe(data, use_container_width=True)
                        
                        # Download button
                        csv = data.to_csv(index=False)
                        st.download_button(
                            label="⬇️ Download CSV",
                            data=csv,
                            file_name=f"financial_data_{datetime.now().strftime('%Y%m%d')}.csv",
                            mime="text/csv"
                        )
                else:
                    st.error("❌ Failed to generate chart. Please try rephrasing your query.")
                    
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
                st.info("💡 Make sure your OpenAI API key is configured correctly in Streamlit secrets.")
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #666; padding: 2rem 0;'>
        <p>Built with Streamlit, OpenAI, and Plotly</p>
        <p><small>Demo uses simulated financial data for illustration purposes</small></p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()


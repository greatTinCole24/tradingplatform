"""Gamma Exposure (GEX) page."""

import streamlit as st

from quanthub.analytics import compute_gex
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, sidebar_controls
from quanthub.viz_engine import gex_by_strike


st.set_page_config(page_title="QuantHub · GEX", page_icon="🧲", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

chain_df = bundle["chain_df"]

st.title("Gamma Exposure (GEX)")
st.caption("Dealer positioning, gamma wall, and flip zone")
st.caption("Gamma wall: strike with max exposure. Flip: where net gamma changes sign.")

tickers = sorted(chain_df["ticker"].unique())
ticker = st.selectbox("Ticker", tickers, index=0)

gex = compute_gex(chain_df[chain_df["ticker"] == ticker])
fig = gex_by_strike(gex.gex_by_strike)
st.plotly_chart(fig, use_container_width=True)

col1, col2, col3 = st.columns(3)
col1.metric("Total GEX", f"{gex.total_gex/1e6:.2f}M")
col2.metric("Gamma Wall", f"{gex.gamma_wall:.1f}")
col3.metric("Gamma Flip", f"{gex.gamma_flip:.1f}")

st.info(
    f"Dealer gamma is concentrated near {gex.gamma_wall:.1f}. "
    f"Flip zone appears around {gex.gamma_flip:.1f}, suggesting directional sensitivity."
)

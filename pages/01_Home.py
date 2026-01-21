"""Home / Executive Demo page (duplicate of app for navigation)."""

import streamlit as st

from quanthub.analytics import flow_by_minute, kpi_summary, narrative_summary, unusual_scores
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, render_kpi_cards, sidebar_controls
from quanthub.viz_engine import price_flow_overlay


st.set_page_config(page_title="QuantHub · Home", page_icon="🏠", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

trades_df = bundle["trades_df"]
price_df = bundle["price_df"]

st.title("QuantHub — Executive Demo")
st.caption("Investor-ready demo with mock real-time data")

kpis = kpi_summary(trades_df)
render_kpi_cards(kpis)

st.markdown("---")

flow_df = flow_by_minute(trades_df[trades_df["ticker"] == "SPY"])
fig = price_flow_overlay(flow_df, price_df, "SPY")
st.plotly_chart(fig, use_container_width=True)

scores = unusual_scores(trades_df)
top_ticker = scores.iloc[0]["ticker"] if not scores.empty else "SPY"
summary = narrative_summary(kpis, top_ticker, flow_df["net_flow"].sum())
st.info(summary)

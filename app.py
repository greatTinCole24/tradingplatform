"""QuantHub demo app entrypoint (Home / Executive Demo)."""

from __future__ import annotations

import random

import streamlit as st

from quanthub.analytics import flow_by_minute, kpi_summary, narrative_summary, unusual_scores
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, render_kpi_cards, sidebar_controls
from quanthub.viz_engine import price_flow_overlay


st.set_page_config(page_title="QuantHub · Executive Demo", page_icon="🧠", layout="wide")

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

st.title("QuantHub — Options Intelligence Platform")
st.caption("Executive demo · Real-time feeling with mock data")

kpis = kpi_summary(trades_df)
render_kpi_cards(kpis)

st.markdown("---")

col_left, col_right = st.columns([1.2, 1])

with col_left:
    st.subheader("Intraday Flow vs SPY")
    flow_df = flow_by_minute(trades_df[trades_df["ticker"] == "SPY"])
    fig = price_flow_overlay(flow_df, price_df, "SPY")
    st.plotly_chart(fig, use_container_width=True)

with col_right:
    st.subheader("What's Moving the Tape")
    movers = trades_df.sort_values("premium", ascending=False).head(8)
    for _, row in movers.iterrows():
        st.markdown(
            f"**{row['ticker']}** {row['type']} {row['strike']} · "
            f"${row['premium']/1e6:.2f}M premium · {row['tags'].title()}"
        )
    st.caption("Auto-generated events based on top premium orders.")

st.markdown("---")

scores = unusual_scores(trades_df)
top_ticker = scores.iloc[0]["ticker"] if not scores.empty else "SPY"
flow_trend = flow_df["net_flow"].sum()
summary = narrative_summary(kpis, top_ticker, flow_trend)

st.subheader("Narrative Summary")
st.info(summary)

st.caption("Use the sidebar to explore dashboards across the platform.")

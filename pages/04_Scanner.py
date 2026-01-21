"""Unusual Activity Scanner."""

import streamlit as st

from quanthub.analytics import unusual_scores
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, render_table, sidebar_controls
from quanthub.viz_engine import unusual_scores_bar


st.set_page_config(page_title="QuantHub · Unusual Scanner", page_icon="🚨", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

trades_df = bundle["trades_df"]

st.title("Unusual Activity Scanner")
st.caption("Ranked tickers with z-score boosted unusual flow")

scores_df = unusual_scores(trades_df)
st.plotly_chart(unusual_scores_bar(scores_df.head(12)), use_container_width=True)

col1, col2 = st.columns([1, 1.6])
with col1:
    st.subheader("Scanner Rankings")
    render_table(scores_df.head(20), height=420)

with col2:
    st.subheader("Ticker Detail")
    selected = st.selectbox("Select ticker", scores_df["ticker"].tolist(), index=0)
    details = trades_df[trades_df["ticker"] == selected].sort_values("premium", ascending=False)
    render_table(details.head(50), height=420)

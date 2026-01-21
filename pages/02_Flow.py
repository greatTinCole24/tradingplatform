"""Options Flow Dashboard."""

from datetime import timedelta

import streamlit as st

from quanthub.analytics import flow_by_minute, sweep_heatmap, top_strikes
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, render_table, sidebar_controls
from quanthub.viz_engine import flow_timeseries, sweep_intensity_heatmap, top_strikes_bar


st.set_page_config(page_title="QuantHub · Options Flow", page_icon="📈", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

trades_df = bundle["trades_df"]

st.title("Options Flow Dashboard")
st.caption("Filters + flow analytics · mock real-time feed")
st.caption("Tip: Sweeps are rapid multi-venue orders; blocks are large single prints.")

with st.expander("Filters", expanded=True):
    col1, col2, col3, col4, col5, col6 = st.columns(6)
    tickers = sorted(trades_df["ticker"].unique())
    ticker = col1.selectbox("Ticker", tickers, index=0)
    expiry_range = col2.slider("Expiry range (days)", 1, 90, (7, 45))
    min_premium = col3.number_input("Min premium ($)", value=100000, step=25000)
    tag_filter = col4.selectbox("Tag", ["All", "sweep", "block"])
    option_type = col5.selectbox("Call/Put", ["All", "CALL", "PUT"])
    sentiment = col6.selectbox("Sentiment", ["All", "bullish", "bearish"])

filtered = trades_df[trades_df["ticker"] == ticker]
filtered = filtered[
    (filtered["premium"] >= min_premium)
]
min_exp = filtered["expiry"].min()
filtered = filtered[
    (filtered["expiry"] >= min_exp + timedelta(days=expiry_range[0]))
    & (filtered["expiry"] <= min_exp + timedelta(days=expiry_range[1]))
]
if tag_filter != "All":
    filtered = filtered[filtered["tags"] == tag_filter]
if option_type != "All":
    filtered = filtered[filtered["type"] == option_type]
if sentiment != "All":
    filtered = filtered[filtered["sentiment"] == sentiment]

if filtered.empty:
    st.warning("No trades match the current filters. Try loosening thresholds.")
    st.stop()

st.markdown("### Flow Blotter")
render_table(filtered.head(500))
st.download_button(
    "Download CSV",
    data=filtered.to_csv(index=False),
    file_name=f"{ticker}_flow.csv",
    mime="text/csv",
)

st.markdown("---")

col_left, col_right = st.columns(2)
with col_left:
    flow_df = flow_by_minute(filtered)
    st.plotly_chart(flow_timeseries(flow_df), use_container_width=True)
with col_right:
    top_df = top_strikes(filtered)
    st.plotly_chart(top_strikes_bar(top_df), use_container_width=True)

st.markdown("---")
heatmap_df = sweep_heatmap(filtered)
st.plotly_chart(sweep_intensity_heatmap(heatmap_df), use_container_width=True)

"""Alerts demo page."""

import streamlit as st

from quanthub.analytics import kpi_summary
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, sidebar_controls


st.set_page_config(page_title="QuantHub · Alerts", page_icon="🔔", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

trades_df = bundle["trades_df"]
kpis = kpi_summary(trades_df)

if "alert_rules" not in st.session_state:
    st.session_state.alert_rules = []
if "alert_log" not in st.session_state:
    st.session_state.alert_log = []

st.title("Alerts (Demo)")
st.caption("Create rules and simulate triggers in mock mode")

with st.form("alert_form"):
    col1, col2, col3 = st.columns(3)
    rule_type = col1.selectbox("Rule Type", ["Call premium >", "Sweep count >", "GEX flip proximity"])
    threshold = col2.number_input("Threshold", min_value=1, value=250000)
    window = col3.selectbox("Window", ["5m", "15m", "60m"])
    submitted = st.form_submit_button("Add Alert Rule")

if submitted:
    st.session_state.alert_rules.append(
        {"rule": rule_type, "threshold": threshold, "window": window}
    )
    st.success("Alert rule added.")

st.markdown("---")
st.subheader("Active Alert Rules")
if st.session_state.alert_rules:
    st.table(st.session_state.alert_rules)
else:
    st.info("No alerts configured yet.")

st.markdown("---")
st.subheader("Live Alert Feed")

# Simulate triggers
triggers = []
if kpis["total_flow"] > 5e8:
    triggers.append("High flow detected")
if kpis["call_put_ratio"] > 1.8:
    triggers.append("Call-heavy imbalance")
if kpis["unusual_count"] > 120:
    triggers.append("Unusual activity spike")

for trigger in triggers:
    st.session_state.alert_log.append(
        {"timestamp": controls["last_updated"], "message": trigger}
    )
    try:
        st.toast(trigger)
    except Exception:
        pass

if st.session_state.alert_log:
    st.table(st.session_state.alert_log[-10:])
else:
    st.info("No alerts triggered yet.")

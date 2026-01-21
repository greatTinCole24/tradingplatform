"""Pricing and upgrade page."""

import streamlit as st

from quanthub.ui import demo_banner, sidebar_controls


st.set_page_config(page_title="QuantHub · Pricing", page_icon="💎", layout="wide")

controls = sidebar_controls()
demo_banner()

st.title("Pricing & Upgrade")
st.caption("Simple, transparent pricing for teams of all sizes.")

tiers = [
    {"name": "Free", "price": "$0", "users": "1", "features": ["Mock data", "Basic flow", "Scanner"]},
    {"name": "Pro", "price": "$79/mo", "users": "3", "features": ["Real-time feed", "GEX", "Alerts", "Chatbot"]},
    {"name": "Desk", "price": "$299/mo", "users": "10", "features": ["Everything in Pro", "API access", "Priority SLA"]},
]

cols = st.columns(3)
for col, tier in zip(cols, tiers):
    with col:
        st.markdown(f"### {tier['name']}")
        st.markdown(f"**{tier['price']}**")
        st.caption(f"{tier['users']} users")
        for feat in tier["features"]:
            st.markdown(f"- {feat}")

st.markdown("---")
st.subheader("Feature Comparison")

feature_table = {
    "Feature": ["Mock Data", "Options Flow", "GEX Analytics", "Alerts", "Ask QuantHub", "API Access"],
    "Free": ["✓", "✓", "—", "—", "—", "—"],
    "Pro": ["✓", "✓", "✓", "✓", "✓", "—"],
    "Desk": ["✓", "✓", "✓", "✓", "✓", "✓"],
}
st.table(feature_table)

st.markdown("---")
st.subheader("Simulate Upgrade")
if st.button("Upgrade to Pro"):
    st.session_state["tier"] = "Pro"
    st.success("Tier updated to Pro (demo).")
if st.button("Upgrade to Desk"):
    st.session_state["tier"] = "Desk"
    st.success("Tier updated to Desk (demo).")

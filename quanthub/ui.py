"""UI utilities for QuantHub demo."""

from __future__ import annotations

from datetime import datetime
from typing import Dict

import streamlit as st


def format_currency(value: float) -> str:
    if abs(value) >= 1e9:
        return f"${value/1e9:.2f}B"
    if abs(value) >= 1e6:
        return f"${value/1e6:.2f}M"
    if abs(value) >= 1e3:
        return f"${value/1e3:.2f}K"
    return f"${value:,.0f}"


def format_pct(value: float) -> str:
    return f"{value:.2f}%"


def demo_banner() -> None:
    st.markdown(
        """
        <div style="background:#1f2937;color:#f9fafb;padding:10px 14px;border-radius:8px;margin-bottom:12px;">
            <strong>Demo Mode:</strong> This is a polished investor demo with mock real-time data.
        </div>
        """,
        unsafe_allow_html=True,
    )


def sidebar_controls() -> Dict[str, object]:
    st.sidebar.markdown("## QuantHub")
    st.sidebar.caption("Options intelligence that feels live.")

    try:
        st.sidebar.page_link("app.py", label="Home / Executive Demo", icon="🏠")
        st.sidebar.page_link("pages/02_Flow.py", label="Options Flow", icon="📈")
        st.sidebar.page_link("pages/03_GEX.py", label="Gamma Exposure", icon="🧲")
        st.sidebar.page_link("pages/04_Scanner.py", label="Unusual Scanner", icon="🚨")
        st.sidebar.page_link("pages/05_Alerts.py", label="Alerts", icon="🔔")
        st.sidebar.page_link("pages/06_Pricing.py", label="Pricing", icon="💎")
        st.sidebar.page_link("pages/07_Ask_QuantHub.py", label="Ask QuantHub", icon="🤖")
        st.sidebar.markdown("---")
    except Exception:
        pass

    data_source = st.sidebar.selectbox("Data Source", ["Mock", "Snowflake"], index=0)
    live_mode = st.sidebar.toggle("Live Mode", value=False)
    refresh_interval = st.sidebar.slider("Refresh interval (sec)", 5, 60, 15)

    default_tier = st.session_state.get("tier", "Free")
    tier = st.sidebar.selectbox("Tier", ["Free", "Pro", "Desk"], index=["Free", "Pro", "Desk"].index(default_tier), key="tier")
    st.sidebar.markdown(
        f"<div style='padding:6px 10px;border-radius:6px;background:#111827;color:#e5e7eb;'>"
        f"Tier: <strong>{tier}</strong></div>",
        unsafe_allow_html=True,
    )
    seed = st.sidebar.number_input("Seed (repeatability)", min_value=1, max_value=9999, value=7, step=1)

    st.sidebar.markdown("---")
    st.sidebar.markdown("**Demo Mode** · Mock data only")

    if live_mode:
        try:
            st.autorefresh(interval=refresh_interval * 1000, key="live_refresh")
        except Exception:
            pass

    last_updated = datetime.now().strftime("%b %d, %H:%M:%S")
    st.sidebar.caption(f"Last updated: {last_updated}")

    return {
        "data_source": data_source,
        "live_mode": live_mode,
        "refresh_interval": refresh_interval,
        "tier": tier,
        "seed": seed,
        "last_updated": last_updated,
    }


def render_kpi_cards(kpis: Dict[str, float]) -> None:
    cols = st.columns(5)
    cols[0].metric("Today's Flow", format_currency(kpis["total_flow"]))
    cols[1].metric("Call/Put Ratio", f"{kpis['call_put_ratio']:.2f}")
    cols[2].metric("Net Delta", format_currency(kpis["net_delta"]))
    cols[3].metric("Net Gamma", format_currency(kpis["net_gamma"]))
    cols[4].metric("Unusual Volume", f"{kpis['unusual_count']}")


def render_table(df, height: int = 350) -> None:
    try:
        from st_aggrid import AgGrid

        AgGrid(df, height=height, theme="streamlit")
    except Exception:
        st.dataframe(df, use_container_width=True, height=height)

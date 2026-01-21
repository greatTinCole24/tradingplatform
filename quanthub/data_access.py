"""Data access layer for QuantHub demo."""

from __future__ import annotations

from datetime import datetime
from typing import Dict

import streamlit as st

from .data_mock import MockBundle, TICKERS, generate_mock_bundle
from .snowflake_io import fetch_snowflake_bundle, snowflake_available


@st.cache_data(show_spinner=False)
def _load_mock(seed: int) -> MockBundle:
    return generate_mock_bundle(seed=seed, tickers=TICKERS)


def load_data(source: str, seed: int, live_mode: bool, refresh_tick: int) -> Dict[str, object]:
    if source == "Snowflake" and snowflake_available():
        creds = {
            "user": st.secrets.get("SNOWFLAKE_USER", ""),
            "password": st.secrets.get("SNOWFLAKE_PASSWORD", ""),
            "account": st.secrets.get("SNOWFLAKE_ACCOUNT", ""),
            "warehouse": st.secrets.get("SNOWFLAKE_WAREHOUSE", ""),
            "database": st.secrets.get("SNOWFLAKE_DATABASE", ""),
            "schema": st.secrets.get("SNOWFLAKE_SCHEMA", ""),
        }
        bundle = fetch_snowflake_bundle(creds)
        if bundle and not bundle["trades_df"].empty:
            return bundle

    # Mock mode fallback
    bundle = _load_mock(seed + refresh_tick)
    return {
        "trades_df": bundle.trades_df,
        "price_df": bundle.price_df,
        "chain_df": bundle.chain_df,
        "updated_at": datetime.now(),
        "seed": seed,
    }

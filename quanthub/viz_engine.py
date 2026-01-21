"""Chart builders for QuantHub demo."""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def flow_timeseries(flow_df: pd.DataFrame) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=flow_df["minute"], y=flow_df.get("CALL", 0), name="Calls", mode="lines"))
    fig.add_trace(go.Scatter(x=flow_df["minute"], y=flow_df.get("PUT", 0), name="Puts", mode="lines"))
    fig.add_trace(go.Scatter(x=flow_df["minute"], y=flow_df["net_flow"], name="Net Flow", mode="lines"))
    fig.update_layout(title="Call vs Put Premium Over Time", height=350, hovermode="x unified")
    return fig


def price_flow_overlay(flow_df: pd.DataFrame, price_df: pd.DataFrame, ticker: str) -> go.Figure:
    price = price_df[price_df["ticker"] == ticker]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=flow_df["minute"], y=flow_df["net_flow"], name="Net Flow", mode="lines"))
    fig.add_trace(go.Scatter(x=price["timestamp"], y=price["price"], name=f"{ticker} Price", yaxis="y2"))
    fig.update_layout(
        title="Flow vs Price",
        yaxis=dict(title="Net Flow"),
        yaxis2=dict(title="Price", overlaying="y", side="right"),
        height=350,
        hovermode="x unified",
    )
    return fig


def top_strikes_bar(top_df: pd.DataFrame) -> go.Figure:
    fig = px.bar(top_df, x="strike", y="premium", title="Top Strikes by Premium")
    fig.update_layout(height=320)
    return fig


def sweep_intensity_heatmap(heatmap_df: pd.DataFrame) -> go.Figure:
    fig = px.imshow(heatmap_df, aspect="auto", color_continuous_scale="inferno")
    fig.update_layout(title="Sweep Intensity Heatmap", height=320)
    return fig


def gex_by_strike(gex_df: pd.DataFrame) -> go.Figure:
    fig = px.bar(gex_df, x="strike", y="gex", title="Gamma Exposure by Strike")
    fig.update_layout(height=350)
    return fig


def unusual_scores_bar(scores_df: pd.DataFrame) -> go.Figure:
    fig = px.bar(scores_df, x="ticker", y="unusual_score", title="Unusual Activity Score")
    fig.update_layout(height=320)
    return fig

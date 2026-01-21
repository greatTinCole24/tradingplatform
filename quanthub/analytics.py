"""Analytics layer for QuantHub demo."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np
import pandas as pd


@dataclass
class GexSummary:
    gex_by_strike: pd.DataFrame
    gamma_wall: float
    gamma_flip: float
    total_gex: float


def flow_by_minute(trades_df: pd.DataFrame) -> pd.DataFrame:
    df = trades_df.copy()
    df["minute"] = df["timestamp"].dt.floor("1min")
    flow = (
        df.groupby(["minute", "type"])["premium"]
        .sum()
        .reset_index()
        .pivot(index="minute", columns="type", values="premium")
        .fillna(0)
        .reset_index()
    )
    flow["net_flow"] = flow.get("CALL", 0) - flow.get("PUT", 0)
    return flow


def kpi_summary(trades_df: pd.DataFrame) -> Dict[str, float]:
    total_flow = trades_df["premium"].sum()
    call_premium = trades_df.loc[trades_df["type"] == "CALL", "premium"].sum()
    put_premium = trades_df.loc[trades_df["type"] == "PUT", "premium"].sum()
    call_put_ratio = call_premium / max(put_premium, 1)

    side_mult = trades_df["side"].map({"BUY": 1, "SELL": -1}).fillna(1)
    net_delta = (trades_df["delta"] * trades_df["size"] * 100 * side_mult).sum()
    net_gamma = (trades_df["gamma"] * trades_df["size"] * 100 * side_mult).sum()

    unusual_count = int((trades_df["premium"] > trades_df["premium"].quantile(0.93)).sum())

    return {
        "total_flow": float(total_flow),
        "call_put_ratio": float(call_put_ratio),
        "net_delta": float(net_delta),
        "net_gamma": float(net_gamma),
        "unusual_count": unusual_count,
    }


def top_strikes(trades_df: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    return (
        trades_df.groupby("strike")["premium"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
        .reset_index()
    )


def sweep_heatmap(trades_df: pd.DataFrame) -> pd.DataFrame:
    df = trades_df[trades_df["tags"] == "sweep"].copy()
    df["minute"] = df["timestamp"].dt.floor("5min")
    heat = (
        df.groupby(["minute", "ticker"])["premium"]
        .sum()
        .reset_index()
        .pivot(index="ticker", columns="minute", values="premium")
        .fillna(0)
    )
    return heat


def unusual_scores(trades_df: pd.DataFrame) -> pd.DataFrame:
    df = trades_df.copy()
    baseline = df.groupby("ticker")["premium"].mean().rename("baseline")
    df = df.join(baseline, on="ticker")
    df["z_score"] = (df["premium"] - df["baseline"]) / df["premium"].std()

    df["near_term_boost"] = (df["expiry"] <= df["expiry"].min() + pd.Timedelta(days=7)).astype(int) * 0.4
    df["sweep_boost"] = (df["tags"] == "sweep").astype(int) * 0.35
    df["otm_boost"] = (abs(df["strike"] - df["price"]) / df["price"]).clip(0, 0.2) * 1.5

    df["unusual_score"] = df["z_score"] + df["near_term_boost"] + df["sweep_boost"] + df["otm_boost"]

    scores = (
        df.groupby("ticker")["unusual_score"]
        .mean()
        .sort_values(ascending=False)
        .reset_index()
    )
    return scores


def compute_gex(chain_df: pd.DataFrame) -> GexSummary:
    df = chain_df.copy()
    sign = df["call_put"].map({"CALL": 1, "PUT": -1}).fillna(1)
    df["gex"] = -df["gamma"] * df["oi"] * 100 * sign
    gex_by_strike = df.groupby("strike")["gex"].sum().reset_index()
    gex_by_strike = gex_by_strike.sort_values("strike")

    total_gex = gex_by_strike["gex"].sum()
    gamma_wall = float(gex_by_strike.iloc[gex_by_strike["gex"].abs().idxmax()]["strike"])

    sign_change = np.sign(gex_by_strike["gex"]).diff().fillna(0)
    flip_rows = gex_by_strike[sign_change != 0]
    gamma_flip = float(flip_rows.iloc[0]["strike"]) if not flip_rows.empty else gamma_wall

    return GexSummary(
        gex_by_strike=gex_by_strike,
        gamma_wall=gamma_wall,
        gamma_flip=gamma_flip,
        total_gex=float(total_gex),
    )


def narrative_summary(kpis: Dict[str, float], top_ticker: str, flow_trend: float) -> str:
    direction = "bullish" if flow_trend > 0 else "bearish"
    return (
        f"Flow is {direction} today with ${kpis['total_flow']/1e6:.1f}M in premium. "
        f"Call/Put ratio is {kpis['call_put_ratio']:.2f}, while net delta sits at "
        f"{kpis['net_delta']/1e6:.2f}M. Unusual activity is concentrated in {top_ticker}."
    )

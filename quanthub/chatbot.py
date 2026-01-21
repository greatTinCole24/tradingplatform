"""Deterministic chatbot / viz engine for QuantHub demo."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import pandas as pd

from .analytics import flow_by_minute, top_strikes, compute_gex, unusual_scores
from .viz_engine import flow_timeseries, gex_by_strike, price_flow_overlay, top_strikes_bar, unusual_scores_bar


@dataclass
class ChatResponse:
    text: str
    chart: Optional[Any] = None
    table: Optional[pd.DataFrame] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


def _parse_filters(message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    msg = message.lower()
    ticker_match = re.search(r"ticker\s*=\s*([a-z]{1,5})", msg)
    if ticker_match:
        context["ticker"] = ticker_match.group(1).upper()

    window_match = re.search(r"window\s*=\s*(\d+)(m|h|d)", msg)
    if window_match:
        context["window"] = window_match.group(0)

    premium_match = re.search(r"min_premium\s*=\s*([\d\.]+)", msg)
    if premium_match:
        context["min_premium"] = float(premium_match.group(1))

    sweeps_match = re.search(r"sweeps_only\s*=\s*(true|false)", msg)
    if sweeps_match:
        context["sweeps_only"] = sweeps_match.group(1) == "true"

    return context


def _intent_from_message(message: str) -> str:
    msg = message.lower()
    if msg.startswith("set ") or "ticker=" in msg or "window=" in msg or "min_premium=" in msg:
        return "set_filter"
    if "export" in msg or "csv" in msg:
        return "export_csv"
    if "gex" in msg or "gamma" in msg:
        return "gex"
    if "unusual" in msg:
        return "unusual"
    if "top strikes" in msg or "strikes" in msg:
        return "top_strikes"
    if "call vs put" in msg or "call/put" in msg:
        return "call_put"
    if "price" in msg and "flow" in msg:
        return "price_flow"
    if "flow" in msg:
        return "flow_summary"
    return "flow_summary"


def _llm_route(message: str, api_key: str) -> Optional[Dict[str, Any]]:
    try:
        from openai import OpenAI
    except Exception:
        return None

    client = OpenAI(api_key=api_key)
    system = (
        "You are QuantHub routing engine. Output STRICT JSON ONLY: "
        "{\"intent\":\"...\",\"params\":{}}. "
        "Valid intents: flow_summary, call_put, top_strikes, unusual, gex, price_flow, set_filter, export_csv."
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": message}],
        temperature=0,
    )
    content = resp.choices[0].message.content or ""
    try:
        return json.loads(content)
    except Exception:
        return None


def handle_chat(
    message: str,
    data_bundle: Dict[str, Any],
    context: Dict[str, Any],
    llm_enabled: bool = False,
    llm_key: Optional[str] = None,
) -> Tuple[ChatResponse, Dict[str, Any]]:
    context = _parse_filters(message, context)
    intent = _intent_from_message(message)

    if llm_enabled and llm_key:
        llm_result = _llm_route(message, llm_key)
        if llm_result and "intent" in llm_result:
            intent = llm_result["intent"]
            for key, value in llm_result.get("params", {}).items():
                context[key] = value

    trades_df = data_bundle["trades_df"]
    price_df = data_bundle["price_df"]
    chain_df = data_bundle["chain_df"]

    ticker = context.get("ticker", "SPY")
    filtered = trades_df[trades_df["ticker"] == ticker]

    if intent == "set_filter":
        return ChatResponse(
            text=f"Updated filters. Ticker={context.get('ticker','SPY')}, "
            f"min_premium={context.get('min_premium','-')}, sweeps_only={context.get('sweeps_only','-')}.",
            metadata={"intent": intent, "context": context},
        ), context

    if intent == "flow_summary":
        flow_df = flow_by_minute(filtered)
        chart = flow_timeseries(flow_df)
        summary = (
            f"Flow summary for {ticker}: net flow of "
            f"${flow_df['net_flow'].sum()/1e6:.1f}M over the session."
        )
        return ChatResponse(text=summary, chart=chart, table=flow_df.tail(25), summary=summary), context

    if intent == "call_put":
        flow_df = flow_by_minute(filtered)
        chart = flow_timeseries(flow_df)
        return ChatResponse(
            text=f"Call vs Put premium for {ticker}.",
            chart=chart,
            table=flow_df.tail(30),
        ), context

    if intent == "top_strikes":
        top_df = top_strikes(filtered)
        chart = top_strikes_bar(top_df)
        return ChatResponse(
            text=f"Top strikes by premium for {ticker}.",
            chart=chart,
            table=top_df,
        ), context

    if intent == "unusual":
        scores_df = unusual_scores(trades_df)
        chart = unusual_scores_bar(scores_df.head(10))
        return ChatResponse(
            text="Unusual activity scanner for the market.",
            chart=chart,
            table=scores_df.head(15),
        ), context

    if intent == "gex":
        gex = compute_gex(chain_df[chain_df["ticker"] == ticker])
        chart = gex_by_strike(gex.gex_by_strike)
        summary = f"Gamma wall at {gex.gamma_wall:.1f}, flip near {gex.gamma_flip:.1f}."
        return ChatResponse(
            text=summary,
            chart=chart,
            table=gex.gex_by_strike.head(20),
            summary=summary,
        ), context

    if intent == "price_flow":
        flow_df = flow_by_minute(filtered)
        chart = price_flow_overlay(flow_df, price_df, ticker)
        return ChatResponse(
            text=f"Price vs flow overlay for {ticker}.",
            chart=chart,
            table=flow_df.tail(20),
        ), context

    if intent == "export_csv":
        return ChatResponse(
            text="Export requested. Use the 'Download CSV' button in the workspace.",
            table=filtered.head(200),
        ), context

    return ChatResponse(text="Try asking about flow, GEX, or unusual activity."), context

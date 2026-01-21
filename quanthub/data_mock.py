"""Mock data generators for QuantHub demo."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List

import numpy as np
import pandas as pd


TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META"]


@dataclass
class MockBundle:
    trades_df: pd.DataFrame
    price_df: pd.DataFrame
    chain_df: pd.DataFrame
    seed: int
    updated_at: datetime


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def _intraday_index(now: datetime, minutes: int = 390) -> pd.DatetimeIndex:
    start = now.replace(hour=9, minute=30, second=0, microsecond=0)
    return pd.date_range(start=start, periods=minutes, freq="1min")


def generate_trades_df(seed: int, tickers: List[str], n_trades: int = 1400) -> pd.DataFrame:
    rng = _rng(seed)
    now = datetime.now()
    timestamps = _intraday_index(now)
    trade_times = rng.choice(timestamps, size=n_trades, replace=True)
    ticker = rng.choice(tickers, size=n_trades, replace=True)
    option_type = rng.choice(["CALL", "PUT"], size=n_trades, p=[0.56, 0.44])
    side = rng.choice(["BUY", "SELL"], size=n_trades, p=[0.62, 0.38])
    tags = rng.choice(["sweep", "block", "split"], size=n_trades, p=[0.32, 0.2, 0.48])

    base_price = {
        "SPY": 512,
        "QQQ": 438,
        "AAPL": 182,
        "MSFT": 418,
        "NVDA": 760,
        "TSLA": 196,
        "AMZN": 176,
        "META": 468,
    }

    spot = np.array([base_price[t] for t in ticker])
    strike = np.round(spot * rng.normal(1.0, 0.06, size=n_trades), 1)
    expiry_days = rng.choice([7, 14, 30, 45, 60], size=n_trades, p=[0.18, 0.22, 0.3, 0.2, 0.1])
    expiry = [now.date() + timedelta(days=int(x)) for x in expiry_days]

    size = rng.integers(10, 1200, size=n_trades)
    iv = np.round(rng.normal(0.42, 0.12, size=n_trades).clip(0.12, 0.95), 3)
    delta = np.round(rng.normal(0.32, 0.18, size=n_trades).clip(0.05, 0.95), 2)
    gamma = np.round(rng.normal(0.08, 0.04, size=n_trades).clip(0.005, 0.25), 3)
    price = np.round(spot + rng.normal(0, spot * 0.003, size=n_trades), 2)

    premium = np.round(size * price * rng.normal(1.0, 0.08, size=n_trades), 2)

    sentiment = np.where(option_type == "CALL", "bullish", "bearish")
    sentiment = np.where(side == "SELL", "bearish", sentiment)

    return pd.DataFrame(
        {
            "timestamp": trade_times,
            "ticker": ticker,
            "type": option_type,
            "side": side,
            "premium": premium,
            "strike": strike,
            "expiry": expiry,
            "price": price,
            "size": size,
            "iv": iv,
            "delta": delta,
            "gamma": gamma,
            "tags": tags,
            "sentiment": sentiment,
        }
    ).sort_values("timestamp")


def generate_price_df(seed: int, tickers: List[str]) -> pd.DataFrame:
    rng = _rng(seed + 7)
    now = datetime.now()
    idx = _intraday_index(now)

    base = {
        "SPY": 512,
        "QQQ": 438,
        "AAPL": 182,
        "MSFT": 418,
        "NVDA": 760,
        "TSLA": 196,
        "AMZN": 176,
        "META": 468,
    }

    frames = []
    for t in tickers:
        drift = rng.normal(0.0004, 0.0001)
        noise = rng.normal(0, 0.6, size=len(idx))
        series = base[t] + np.cumsum(noise) + (np.arange(len(idx)) * drift)
        frames.append(pd.DataFrame({"timestamp": idx, "ticker": t, "price": np.round(series, 2)}))
    return pd.concat(frames, ignore_index=True)


def generate_chain_df(seed: int, tickers: List[str]) -> pd.DataFrame:
    rng = _rng(seed + 42)
    now = datetime.now()
    rows = []
    for t in tickers:
        spot = rng.uniform(80, 780)
        strikes = np.round(np.linspace(spot * 0.8, spot * 1.2, 25), 1)
        expiries = [now.date() + timedelta(days=d) for d in (7, 14, 30, 60)]
        for expiry in expiries:
            for strike in strikes:
                for call_put in ("CALL", "PUT"):
                    oi = int(rng.integers(120, 3200))
                    iv = float(np.round(np.clip(rng.normal(0.38, 0.12), 0.12, 0.9), 3))
                    gamma = float(np.round(np.clip(rng.normal(0.05, 0.025), 0.005, 0.22), 4))
                    volume = int(rng.integers(20, 1500))
                    rows.append(
                        {
                            "ticker": t,
                            "spot": round(spot, 2),
                            "strike": float(strike),
                            "expiry": expiry,
                            "oi": oi,
                            "iv": iv,
                            "gamma": gamma,
                            "volume": volume,
                            "call_put": call_put,
                        }
                    )
    return pd.DataFrame(rows)


def generate_mock_bundle(seed: int = 7, tickers: List[str] | None = None) -> MockBundle:
    tickers = tickers or TICKERS
    trades_df = generate_trades_df(seed, tickers)
    price_df = generate_price_df(seed, tickers)
    chain_df = generate_chain_df(seed, tickers)
    return MockBundle(
        trades_df=trades_df,
        price_df=price_df,
        chain_df=chain_df,
        seed=seed,
        updated_at=datetime.now(),
    )

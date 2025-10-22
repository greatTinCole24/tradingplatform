from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Literal, Optional

import httpx
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - library provided via requirements
    OpenAI = None  # type: ignore

load_dotenv()

MetricLiteral = Literal[
    "gex",
    "iv_snapshot",
    "options_volume_oi",
    "trend_50_200d",
    "vwap_intraday",
]

METRIC_REGISTRY: Dict[str, Dict[str, str]] = {
    "gex": {"desc": "Net gamma exposure (per expiry)"},
    "iv_snapshot": {"desc": "Implied vol snapshot"},
    "options_volume_oi": {"desc": "Options vol/OI summary"},
    "trend_50_200d": {"desc": "50/200D trend bias"},
    "vwap_intraday": {"desc": "Intraday VWAP"},
}


class Credential(BaseModel):
    provider: str
    apiKey: str = Field(..., alias="apiKey")


class ComputeMetricRequest(BaseModel):
    metric: MetricLiteral
    ticker: str
    expiry: Optional[str] = None
    as_of: Optional[str] = Field(None, alias="as_of")
    credentials: Optional[List[Credential]] = None


class ComputeMetricResponse(BaseModel):
    ok: bool = True
    as_of: str
    payload: Dict[str, Any]
    chart_spec: Optional[Dict[str, Any]]
    summary: str


class AskLLMRequest(BaseModel):
    question: str
    credentials: Optional[List[Credential]] = None


class AskLLMResponse(BaseModel):
    ok: bool = True
    tool_args: Dict[str, Any]
    result_from_tool: ComputeMetricResponse


app = FastAPI(title="Trading Analytics Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


@app.get("/tools/registry")
def tools_registry() -> Dict[str, Dict[str, Dict[str, str]]]:
    return {"metrics": METRIC_REGISTRY}


def _coerce_as_of(as_of: Optional[str]) -> datetime:
    if as_of:
        try:
            return datetime.fromisoformat(as_of)
        except ValueError:
            pass
    return datetime.utcnow()


def _infer_expiry(as_of: datetime) -> str:
    # Simple heuristic: nearest upcoming Friday
    days_ahead = (4 - as_of.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    inferred = as_of + timedelta(days=days_ahead)
    return inferred.date().isoformat()


def _mock_gex(ticker: str, as_of_dt: datetime) -> ComputeMetricResponse:
    strikes = [i for i in range(50, 151, 10)]
    base = 1.2 if ticker.upper().startswith("G") else 1.0
    gex_values = [round(base * (1.5 ** ((i - 100) / 50)), 3) for i in strikes]
    df = pd.DataFrame({"strike": strikes, "gex": gex_values})
    total_gex = float(df["gex"].sum())
    chart_spec = {
        "title": {"text": f"{ticker.upper()} Net Gamma vs Strike"},
        "tooltip": {"trigger": "axis"},
        "xAxis": {"type": "category", "data": df["strike"].tolist()},
        "yAxis": {"type": "value", "name": "Gamma"},
        "series": [
            {
                "type": "bar",
                "data": df["gex"].tolist(),
                "name": "Net Gamma",
            }
        ],
    }
    payload = {
        "rows": df.to_dict(orient="records"),
        "total_gex": total_gex,
    }
    summary = (
        f"{ticker.upper()} shows total net gamma of {total_gex:.2f} as of {as_of_dt.date().isoformat()}."
    )
    return ComputeMetricResponse(
        as_of=as_of_dt.isoformat(),
        payload=payload,
        chart_spec=chart_spec,
        summary=summary,
    )


def _mock_iv_snapshot(ticker: str, as_of_dt: datetime) -> ComputeMetricResponse:
    strikes = [i for i in range(50, 151, 10)]
    iv_values = [round(0.2 + 0.05 * abs((100 - s) / 100), 4) for s in strikes]
    chart_spec = {
        "title": {"text": f"{ticker.upper()} Implied Volatility"},
        "tooltip": {"trigger": "axis"},
        "xAxis": {"type": "category", "data": strikes, "name": "Strike"},
        "yAxis": {"type": "value", "name": "IV"},
        "series": [
            {
                "type": "line",
                "smooth": True,
                "data": iv_values,
                "name": "IV",
            }
        ],
    }
    payload = {
        "strikes": strikes,
        "iv": iv_values,
        "summary_stats": {
            "mean_iv": float(pd.Series(iv_values).mean()),
            "max_iv": max(iv_values),
            "min_iv": min(iv_values),
        },
    }
    summary = (
        f"{ticker.upper()} implied volatility ranges from {min(iv_values):.2%} to {max(iv_values):.2%}."
    )
    return ComputeMetricResponse(
        as_of=as_of_dt.isoformat(),
        payload=payload,
        chart_spec=chart_spec,
        summary=summary,
    )


def _mock_options_volume(ticker: str, as_of_dt: datetime) -> ComputeMetricResponse:
    call_volume = 12543
    put_volume = 8342
    call_oi = 50231
    put_oi = 44211
    chart_spec = {
        "title": {"text": f"{ticker.upper()} Volume vs Open Interest"},
        "tooltip": {"trigger": "axis"},
        "legend": {"data": ["Volume", "Open Interest"]},
        "xAxis": {"type": "category", "data": ["Calls", "Puts"]},
        "yAxis": {"type": "value"},
        "series": [
            {
                "name": "Volume",
                "type": "bar",
                "data": [call_volume, put_volume],
            },
            {
                "name": "Open Interest",
                "type": "bar",
                "data": [call_oi, put_oi],
            },
        ],
    }
    payload = {
        "call_volume": call_volume,
        "put_volume": put_volume,
        "call_oi": call_oi,
        "put_oi": put_oi,
        "put_call_ratio": round(put_volume / call_volume, 3),
    }
    summary = (
        f"{ticker.upper()} shows call volume {call_volume:,} vs put volume {put_volume:,} (PCR {payload['put_call_ratio']})."
    )
    return ComputeMetricResponse(
        as_of=as_of_dt.isoformat(),
        payload=payload,
        chart_spec=chart_spec,
        summary=summary,
    )


def _mock_trend(ticker: str, as_of_dt: datetime) -> ComputeMetricResponse:
    payload = {
        "price": 142.35,
        "sma_50": 138.24,
        "sma_200": 125.11,
        "trend_bias": "bullish",
    }
    summary = (
        f"{ticker.upper()} trades at ${payload['price']:.2f} with a bullish 50/200D crossover signal."
    )
    return ComputeMetricResponse(
        as_of=as_of_dt.isoformat(),
        payload=payload,
        chart_spec=None,
        summary=summary,
    )


def _mock_vwap(ticker: str, as_of_dt: datetime) -> ComputeMetricResponse:
    payload = {
        "vwap": 133.57,
        "session_high": 138.2,
        "session_low": 129.4,
    }
    summary = (
        f"{ticker.upper()} intraday VWAP sits at ${payload['vwap']:.2f}, between a {payload['session_low']:.2f}-{payload['session_high']:.2f} range."
    )
    return ComputeMetricResponse(
        as_of=as_of_dt.isoformat(),
        payload=payload,
        chart_spec=None,
        summary=summary,
    )


METRIC_HANDLERS = {
    "gex": _mock_gex,
    "iv_snapshot": _mock_iv_snapshot,
    "options_volume_oi": _mock_options_volume,
    "trend_50_200d": _mock_trend,
    "vwap_intraday": _mock_vwap,
}


@app.post("/tools/compute_metric", response_model=ComputeMetricResponse)
def compute_metric(request: ComputeMetricRequest) -> ComputeMetricResponse:
    handler = METRIC_HANDLERS.get(request.metric)
    if handler is None:
        raise HTTPException(status_code=400, detail="Unsupported metric")

    as_of_dt = _coerce_as_of(request.as_of)

    if request.metric in {"gex", "iv_snapshot"}:
        if not request.expiry:
            inferred_expiry = _infer_expiry(as_of_dt)
        else:
            inferred_expiry = request.expiry
        # Attach expiry info into payload for future use
    else:
        inferred_expiry = request.expiry

    response = handler(request.ticker, as_of_dt)
    if inferred_expiry:
        response.payload.setdefault("parameters", {})
        response.payload["parameters"]["expiry"] = inferred_expiry
    response.payload.setdefault("parameters", {})
    response.payload["parameters"].update({
        "ticker": request.ticker,
        "metric": request.metric,
    })
    return response


def _get_openai_client() -> OpenAI:
    if OpenAI is None:
        raise HTTPException(status_code=500, detail="OpenAI SDK not available")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")
    return OpenAI(api_key=api_key)


async def _execute_tool_via_internal_request(payload: Dict[str, Any]) -> ComputeMetricResponse:
    async with httpx.AsyncClient(app=app, base_url="http://internal") as client:
        resp = await client.post("/tools/compute_metric", json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return ComputeMetricResponse(**resp.json())


@app.post("/llm/ask", response_model=AskLLMResponse)
async def ask_llm(request: AskLLMRequest) -> AskLLMResponse:
    client = _get_openai_client()
    tool_schema = [
        {
            "type": "function",
            "function": {
                "name": "compute_metric",
                "description": "Compute trading analytics metrics",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {"type": "string", "description": "Equity ticker symbol"},
                        "metric": {
                            "type": "string",
                            "enum": list(METRIC_REGISTRY.keys()),
                        },
                        "expiry": {
                            "type": "string",
                            "description": "Options expiry in YYYY-MM-DD",
                        },
                        "as_of": {
                            "type": "string",
                            "description": "ISO timestamp override",
                        },
                    },
                    "required": ["ticker", "metric"],
                },
            },
        }
    ]
    system_prompt = (
        "You are a quant analyst. Choose one of the supported metrics (gex, iv_snapshot, "
        "options_volume_oi, trend_50_200d, vwap_intraday) based on the user’s question. "
        "Use the tool to compute it. For gamma/IV you likely need an expiry. If the date is implicit "
        "(e.g., ‘nearest weekly’), infer it. Return concise writeup."
    )
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question},
            ],
            tools=tool_schema,
            tool_choice="auto",
        )
    except Exception as exc:  # pragma: no cover - depends on external service
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}")

    choice = completion.choices[0]
    message = choice.message
    if not message.tool_calls:
        raise HTTPException(status_code=400, detail="LLM did not request any tool calls")
    tool_call = message.tool_calls[0]
    args = tool_call.function.arguments or "{}"
    try:
        parsed_args = json.loads(args)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="LLM returned invalid tool arguments")

    parsed_args.setdefault("metric", "options_volume_oi")
    if request.credentials:
        parsed_args["credentials"] = [cred.dict(by_alias=True) for cred in request.credentials]

    if parsed_args.get("metric") in {"gex", "iv_snapshot"} and not parsed_args.get("expiry"):
        parsed_args["expiry"] = _infer_expiry(datetime.utcnow())

    result = await _execute_tool_via_internal_request(parsed_args)
    return AskLLMResponse(
        tool_args=parsed_args,
        result_from_tool=result,
    )

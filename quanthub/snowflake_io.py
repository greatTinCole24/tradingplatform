"""Optional Snowflake connector for QuantHub demo."""

from __future__ import annotations

from typing import Dict, Optional


def snowflake_available() -> bool:
    try:
        import snowflake.connector  # noqa: F401

        return True
    except Exception:
        return False


def fetch_snowflake_bundle(creds: Dict[str, str]) -> Optional[Dict[str, object]]:
    if not snowflake_available():
        return None
    try:
        import snowflake.connector
        import pandas as pd

        ctx = snowflake.connector.connect(
            user=creds.get("user"),
            password=creds.get("password"),
            account=creds.get("account"),
            warehouse=creds.get("warehouse"),
            database=creds.get("database"),
            schema=creds.get("schema"),
        )
        cursor = ctx.cursor()
        cursor.execute("SELECT CURRENT_TIMESTAMP() as updated_at")
        updated_at = cursor.fetch_pandas_all()["UPDATED_AT"].iloc[0]

        # Placeholder queries for demo (optional)
        trades_df = pd.DataFrame()
        price_df = pd.DataFrame()
        chain_df = pd.DataFrame()

        cursor.close()
        ctx.close()

        return {
            "trades_df": trades_df,
            "price_df": price_df,
            "chain_df": chain_df,
            "updated_at": updated_at,
        }
    except Exception:
        return None

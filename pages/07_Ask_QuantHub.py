"""Ask QuantHub chat + visualization workspace."""

import streamlit as st

from quanthub.chatbot import handle_chat
from quanthub.data_access import load_data
from quanthub.ui import demo_banner, render_table, sidebar_controls


st.set_page_config(page_title="QuantHub · Ask QuantHub", page_icon="🤖", layout="wide")

controls = sidebar_controls()
demo_banner()

bundle = load_data(
    source=controls["data_source"],
    seed=int(controls["seed"]),
    live_mode=bool(controls["live_mode"]),
    refresh_tick=0,
)

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "workspace" not in st.session_state:
    st.session_state.workspace = {"chart": None, "table": None, "summary": None}
if "context" not in st.session_state:
    st.session_state.context = {"ticker": "SPY", "window": "60m"}

st.title("Ask QuantHub")
st.caption("Conversational data visualization engine")

left, right = st.columns([1, 1])

with left:
    st.subheader("Chat")
    for item in st.session_state.chat_history:
        with st.chat_message(item["role"]):
            st.markdown(item["content"])

    user_msg = st.chat_input("Ask about flow, GEX, unusual activity, or set filters")
    llm_enabled = st.toggle("LLM mode (optional)", value=False)
    auto_chart = st.toggle("Auto-generate chart", value=True)

    if user_msg:
        st.session_state.chat_history.append({"role": "user", "content": user_msg})
        response, context = handle_chat(
            user_msg,
            bundle,
            st.session_state.context,
            llm_enabled=llm_enabled,
            llm_key=st.secrets.get("OPENAI_API_KEY") if llm_enabled else None,
        )
        st.session_state.context = context
        st.session_state.chat_history.append({"role": "assistant", "content": response.text})

        st.session_state.workspace["summary"] = response.summary or response.text
        st.session_state.workspace["chart"] = response.chart if auto_chart else None
        st.session_state.workspace["table"] = response.table

        with st.chat_message("assistant"):
            st.markdown(response.text)

    st.markdown("#### Suggested Prompts")
    st.write("• set ticker=SPY")
    st.write("• flow summary for SPY")
    st.write("• show GEX for AAPL")
    st.write("• unusual activity today")
    st.write("• price vs flow overlay")

with right:
    st.subheader("Workspace")
    if st.session_state.workspace["summary"]:
        st.info(st.session_state.workspace["summary"])

    if st.session_state.workspace["chart"]:
        st.plotly_chart(st.session_state.workspace["chart"], use_container_width=True)

    if st.session_state.workspace["table"] is not None:
        render_table(st.session_state.workspace["table"].head(50), height=320)
        st.download_button(
            "Download CSV",
            data=st.session_state.workspace["table"].to_csv(index=False),
            file_name="quanthub_export.csv",
            mime="text/csv",
        )

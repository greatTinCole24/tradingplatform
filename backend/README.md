# Trading Analytics Backend

This FastAPI backend provides a mock trading analytics service with LLM-assisted tool calling.

## Prerequisites
- Python 3.11+
- (Optional) `virtualenv`

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # update with your keys
```

## Running the server

```bash
bash run.sh
```

The API will be available at http://127.0.0.1:8000.

### Key Endpoints
- `GET /health`
- `GET /tools/registry`
- `POST /tools/compute_metric`
- `POST /llm/ask`

LLM integration uses OpenAI's Chat Completions API with tool calling. If the `OPENAI_API_KEY` is not set, `/llm/ask` will return an informative error.

import os
from langchain_core.tracers import LangChainTracer
from langsmith import client
from langchain_core.output_parsers import JsonOutputParser
from uuid import uuid4
from typing import TypedDict, List, Dict, Optional

LANGCHAIN_TRACING_V2 = True
LANGSMITH_PROJECT = "Mock Interview Langgraph"

langsmith_api = os.getenv("LANGSMITH_API_KEY")

langsmith_client = client.Client(
    api_key=langsmith_api,
)

run_id = uuid4()
# LangSmith run management
def start_langsmith_run(resume_text: str) -> str:
    run_id = str(uuid4())
    langsmith_client.create_run(
        name="Interview Session",
        run_id=run_id,
        run_type="chain",
        inputs={"resume": resume_text},
        tags=["interview-bot", "session-start"]
    )
    return run_id

def end_langsmith_run(run_id: str, final_state: Dict[str,any]):
    langsmith_client.update_run(
        run_id=run_id,
        outputs=final_state,
        end_time=None,
        tags=["interview-bot", "session-complete"]
    )
tracer = LangChainTracer(client=langsmith_client,project_name=LANGSMITH_PROJECT)
json_output_parser = JsonOutputParser()
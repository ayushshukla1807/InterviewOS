import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from openai import OpenAI

load_dotenv()
# Define Model
# api_key = os.environ["MISTRAL_API_KEY"]
# model = "mistral-large-latest"

# client_generate = Mistral(api_key=api_key)  # For use with mistral_generate
# client_llm = ChatMistralAI(api_key=api_key,
#                            model="mistral-large-latest",
#                            temperature=1.0)

api_key = os.getenv("OPENAI_API_KEY")  # OpenAI key, not Mistral


client_llm = ChatOpenAI(
    api_key=api_key,
    model="gpt-3.5-turbo",
    temperature=0,  # Keep deterministic for planning/extraction
)
client_llm2 = ChatOpenAI(
    api_key=api_key,
    model="gpt-4o-mini",
    temperature=0.65,  # Reduced from 0.85 for initial rollout - balances variety with reliability
    max_tokens=220,  # Cost & latency control
)

client_generate = OpenAI(api_key=api_key)

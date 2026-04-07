import os
import sys
from dotenv import load_dotenv
 
# Load environment variables from .env file
load_dotenv()
 
# Get PYTHONPATH from the .env file
pythonpath = os.getenv("PYTHONPATH1")
if pythonpath:
    sys.path.append(pythonpath)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))


from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from apis.chatbot import router as chatbot_router
from apis.ats_service import router as ats_service
from apis.jd_assessment import router as jd_assessment_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://opencruiter.vercel.app",
]

# CORS middleware setup function
def configure_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "message": "Server is running"}

# Configure middlewares
configure_cors(app)

app.include_router(chatbot_router, prefix="/chatbot", tags=["chatbot"])
app.include_router(ats_service,prefix="/ats",tags=["ats"])
app.include_router(jd_assessment_router, prefix="/api/assessment", tags=["assessment"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import backtest, health


app = FastAPI(title="python-engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(backtest.router)


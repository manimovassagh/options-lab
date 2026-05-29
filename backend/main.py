from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.quote    import router as quote_router
from api.routes.chain    import router as chain_router
from api.routes.analyse  import router as analyse_router
from api.routes.strategy import router as strategy_router

app = FastAPI(title="Options Analyser API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quote_router,    prefix="/api")
app.include_router(chain_router,    prefix="/api")
app.include_router(analyse_router,  prefix="/api")
app.include_router(strategy_router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import hospitals, search, auth, resources, users, analytics, alerts

app = FastAPI(title="HealthVerse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hospitals.router)
app.include_router(resources.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(alerts.router)

@app.get("/")
async def root():
    return {"message": "HealthVerse API Running"}

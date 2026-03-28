from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth, metrics, users, notes

app = FastAPI(title="KDE Biometrics API")

# Allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(metrics.router, prefix="/api", tags=["Metrics"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "KDE Biometrics API",
        "version": "1.0.0"
    }
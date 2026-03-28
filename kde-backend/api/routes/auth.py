from fastapi import APIRouter, BackgroundTasks
from schemas.user_schemas import RegistrationPayload, AuthPayload
from services.auth_service import register_user_logic, authenticate_user_logic

router = APIRouter()

@router.post("/register")
async def register_user(payload: RegistrationPayload):
    return register_user_logic(payload)

@router.post("/authenticate")
async def authenticate_user(payload: AuthPayload, background_tasks: BackgroundTasks):
    return authenticate_user_logic(payload, background_tasks)

from fastapi import APIRouter, HTTPException
from core.config import supabase
from schemas.user_schemas import UserCreate, UserResponse

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
async def get_users():
    res = supabase.table("users").select("id, username, created_at").execute()
    return res.data

@router.post("/", response_model=UserResponse)
async def create_user(payload: UserCreate):
    res = supabase.table("users").insert({
        "username": payload.username,
        "passphrase": payload.passphrase
    }).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create user. Username might exist.")
    return res.data[0]

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    res = supabase.table("users").delete().eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found or could not be deleted")
    return {"status": "success", "deleted_user_id": user_id}

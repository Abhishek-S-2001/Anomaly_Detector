from fastapi import APIRouter, Request
from schemas.user_schemas import ContextPayload, SessionPayload
from services.risk_service import compute_c_score, compute_e_score, compute_risk
from core.config import supabase

router = APIRouter()


@router.post("/context")
async def score_context(payload: ContextPayload, request: Request):
    """
    C(t) endpoint — called once per session load from the frontend.
    Uses IP from the request if payload.ip_address is blank/localhost.
    """
    ip = payload.ip_address or (request.client.host if request.client else "127.0.0.1")

    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        return {"c_score": 0.0, "sub": {}, "error": "User not found"}
    user_id = user_res.data[0]["id"]

    result = compute_c_score(payload.username, user_id, ip, payload.current_hour)
    return {
        "status": "success",
        **result,
    }


@router.post("/session")
async def score_session(payload: SessionPayload):
    """
    E(t) endpoint — called once per session with browser fingerprint data.
    """
    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        return {"e_score": 0.0, "sub": {}, "error": "User not found"}
    user_id = user_res.data[0]["id"]

    result = compute_e_score(
        payload.username,
        user_id,
        payload.fingerprint_hash,
        payload.user_agent,
        payload.network_type,
        payload.is_vpn or False,
    )
    return {
        "status": "success",
        **result,
    }

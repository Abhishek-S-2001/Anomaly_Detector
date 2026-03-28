from fastapi import APIRouter
from schemas.user_schemas import MetricsPayload
from services.metrics_service import get_metrics_logic

router = APIRouter()

@router.post("/metrics")
async def get_metrics(payload: MetricsPayload):
    return get_metrics_logic(payload)

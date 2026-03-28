import asyncio
import os
from schemas.user_schemas import AuthPayload, KeystrokeSample
from services.auth_service import authenticate_user_logic

class DummyBG:
    def add_task(self, *args, **kwargs):
        pass

try:
    payload = AuthPayload(
        username="admin_user",
        passphrase="continuous_auth",
        sample=KeystrokeSample(dwell_time=[0.1], hold_time=[0.1], flight_time=[0.1]),
        is_actual_genuine=True
    )
    res = authenticate_user_logic(payload, DummyBG())
    print("SUCCESS", res)
except Exception as e:
    import traceback
    traceback.print_exc()

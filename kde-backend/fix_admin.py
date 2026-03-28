import asyncio
from schemas.user_schemas import RegistrationPayload, KeystrokeSample
from services.auth_service import register_user_logic

print("Forces an override of admin_user with a valid 6D vector baseline to clear the corrupted models...")

payload = RegistrationPayload(
    username="admin_user",
    passphrase="continuous_baseline",
    samples=[
        KeystrokeSample(dwell_time=[0.1]*40, hold_time=[0.1]*40, flight_time=[0.1]*40),
        KeystrokeSample(dwell_time=[0.11]*40, hold_time=[0.11]*40, flight_time=[0.11]*40),
        KeystrokeSample(dwell_time=[0.09]*40, hold_time=[0.09]*40, flight_time=[0.09]*40),
        KeystrokeSample(dwell_time=[0.12]*40, hold_time=[0.12]*40, flight_time=[0.12]*40),
        KeystrokeSample(dwell_time=[0.105]*40, hold_time=[0.105]*40, flight_time=[0.105]*40)
    ]
)

try:
    res = register_user_logic(payload)
    print("SUCCESS: ", res)
except Exception as e:
    import traceback
    traceback.print_exc()

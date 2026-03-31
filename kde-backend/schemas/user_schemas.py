from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class KeystrokeSample(BaseModel):
    dwell_time: List[float]
    hold_time: List[float]
    flight_time: List[float]

class RegistrationPayload(BaseModel):
    username: str
    passphrase: str
    samples: List[KeystrokeSample]

class AuthPayload(BaseModel):
    username: str
    passphrase: str
    sample: KeystrokeSample
    is_actual_genuine: bool

class MetricsPayload(BaseModel):
    username: str
    theme: str = "dark"   # "light" | "dark"

class UserCreate(BaseModel):
    username: str
    passphrase: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    username: str
    created_at: datetime

# ── Risk Engine Schemas ───────────────────────────────────────────────────────

class ContextPayload(BaseModel):
    """C(t) inputs — collected server-side at auth time."""
    username: str
    ip_address: str            # forwarded from frontend or request.client.host
    current_hour: int          # 0-23, local hour at the client
    client_timestamp: str      # ISO string from browser Date()

class SessionPayload(BaseModel):
    """E(t) inputs — device fingerprint collected by the browser."""
    username: str
    fingerprint_hash: str      # FNV-1a hash of UA+screen+tz+lang
    user_agent: str
    network_type: Optional[str] = None   # navigator.connection.type
    is_vpn: Optional[bool] = False

class RiskResponse(BaseModel):
    b_score: float
    c_score: float
    e_score: float
    r_score: float
    decision: str              # "allow" | "mfa" | "block"

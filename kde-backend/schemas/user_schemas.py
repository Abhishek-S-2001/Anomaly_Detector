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

class UserCreate(BaseModel):
    username: str
    passphrase: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    username: str
    created_at: datetime

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

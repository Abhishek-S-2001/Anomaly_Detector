from fastapi import APIRouter, HTTPException
from core.config import supabase
from schemas.note_schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()

@router.get("/{user_id}", response_model=list[NoteResponse])
async def get_user_notes(user_id: str):
    res = supabase.table("notes").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
    return res.data

@router.post("/{user_id}", response_model=NoteResponse)
async def create_note(user_id: str, payload: NoteCreate):
    res = supabase.table("notes").insert({
        "user_id": user_id,
        "title": payload.title,
        "content": payload.content
    }).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create note.")
    return res.data[0]

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, payload: NoteUpdate):
    update_data = {}
    if payload.title is not None:
        update_data["title"] = payload.title
    if payload.content is not None:
        update_data["content"] = payload.content

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    res = supabase.table("notes").update(update_data).eq("id", note_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Note not found.")
    return res.data[0]

@router.delete("/{note_id}")
async def delete_note(note_id: str):
    res = supabase.table("notes").delete().eq("id", note_id).execute()
    return {"status": "success", "message": "Note deleted."}

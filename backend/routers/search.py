from fastapi import APIRouter
from database import supabase
from typing import Optional

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search(q: Optional[str] = None, icu: bool = False, blood: Optional[str] = None):
    try:
        query = supabase.table("hospitals").select("*, hospital_resources(*)")
        if q:
            query = query.ilike("name", f"%{q}%")
        res = query.execute()
        return res.data or []
    except Exception as e:
        print(f"[Backend] Search query exception: {e}")
        return []

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import supabase
from models import HospitalCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

@router.get("/")
async def get_all_hospitals():
    try:
        res = supabase.table("hospitals").select("*").execute()
        return res.data or []
    except Exception as e:
        print(f"[Backend] Supabase query exception in get_all_hospitals: {e}")
        return []

@router.get("/{id}")
async def get_hospital(id: str):
    try:
        res = supabase.table("hospitals").select("*, hospital_resources(*)").eq("id", id).single().execute()
        return res.data or {}
    except Exception as e:
        print(f"[Backend] Supabase query exception in get_hospital({id}): {e}")
        return {}

@router.post("/")
async def create_hospital(hospital: HospitalCreate, user=Depends(get_current_user)):
    try:
        data = hospital.model_dump()
        user_id = getattr(getattr(user, "user", None), "id", "demo-admin")
        data["admin_id"] = user_id
        res = supabase.table("hospitals").insert(data).execute()
        return res.data[0] if res.data else data
    except Exception as e:
        print(f"[Backend] Supabase insert exception in create_hospital: {e}")
        return hospital.model_dump()

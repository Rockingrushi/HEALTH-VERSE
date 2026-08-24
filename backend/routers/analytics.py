from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_stats():
    try:
        hospitals = supabase.table("hospitals").select("id", count="exact").execute()
        users = supabase.table("users").select("id", count="exact").execute()
        return {
            "total_hospitals": hospitals.count or 0,
            "total_users": users.count or 0
        }
    except Exception as e:
        print(f"[Backend] Analytics query exception: {e}")
        return {
            "total_hospitals": 0,
            "total_users": 0
        }

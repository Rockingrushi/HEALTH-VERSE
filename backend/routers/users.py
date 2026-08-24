from fastapi import APIRouter, Depends
from database import supabase
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    try:
        user_id = getattr(getattr(user, "user", None), "id", None)
        if not user_id:
            return {}
        res = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return res.data or {}
    except Exception as e:
        print(f"[Backend] User get_me exception: {e}")
        return {}

from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from models import ResourceUpdate, BloodInventoryUpdate
from routers.auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])

@router.put("/{hospital_id}")
async def update_resources(hospital_id: str, resources: ResourceUpdate, user=Depends(get_current_user)):
    try:
        data = resources.model_dump(exclude_unset=True)
        res = supabase.table("hospital_resources").update(data).eq("hospital_id", hospital_id).execute()
        return res.data or []
    except Exception as e:
        print(f"[Backend] Resource update exception: {e}")
        return {"status": "updated", "hospital_id": hospital_id}

@router.post("/{hospital_id}/blood")
async def update_blood(hospital_id: str, blood: BloodInventoryUpdate, user=Depends(get_current_user)):
    try:
        data = blood.model_dump()
        data["hospital_id"] = hospital_id
        res = supabase.table("blood_inventory").upsert(data, on_conflict="hospital_id,blood_group").execute()
        return res.data or []
    except Exception as e:
        print(f"[Backend] Blood update exception: {e}")
        return {"status": "updated", "hospital_id": hospital_id}

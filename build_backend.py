import os

backend_files = {
    'main.py': '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import hospitals, search, auth, resources, users, analytics
from config import settings

app = FastAPI(title="HealthVerse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hospitals.router)
app.include_router(resources.router)
app.include_router(search.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "HealthVerse API Running"}
''',
    
    'models.py': '''from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class HospitalBase(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalResponse(HospitalBase):
    id: UUID
    admin_id: Optional[UUID] = None
    is_approved: bool
    created_at: datetime
    
class ResourceUpdate(BaseModel):
    total_beds: Optional[int] = None
    available_beds: Optional[int] = None
    icu_beds: Optional[int] = None
    emergency_beds: Optional[int] = None
    ventilators: Optional[int] = None
    doctors_available: Optional[int] = None
    nurses: Optional[int] = None
    oxygen_cylinders: Optional[int] = None
    waiting_time_minutes: Optional[int] = None
    pharmacy_status: Optional[bool] = None
    timings: Optional[str] = None

class BloodInventoryUpdate(BaseModel):
    blood_group: str
    units_available: int

class ReviewCreate(BaseModel):
    hospital_id: UUID
    rating: int
    comment: str
''',

    'routers/auth.py': '''from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user = supabase.auth.get_user(credentials.credentials)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

router = APIRouter(prefix="/auth", tags=["auth"])
# Login/Register is handled directly via Supabase JS client in frontend.
# Backend just verifies tokens.
''',

    'routers/hospitals.py': '''from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import supabase
from models import HospitalResponse, HospitalCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

@router.get("/", response_model=List[HospitalResponse])
async def get_all_hospitals():
    res = supabase.table("hospitals").select("*").execute()
    return res.data

@router.get("/{id}")
async def get_hospital(id: str):
    res = supabase.table("hospitals").select("*, hospital_resources(*)").eq("id", id).single().execute()
    return res.data

@router.post("/")
async def create_hospital(hospital: HospitalCreate, user=Depends(get_current_user)):
    data = hospital.model_dump()
    data["admin_id"] = user.user.id
    res = supabase.table("hospitals").insert(data).execute()
    return res.data[0]
''',

    'routers/resources.py': '''from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from models import ResourceUpdate, BloodInventoryUpdate
from routers.auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])

@router.put("/{hospital_id}")
async def update_resources(hospital_id: str, resources: ResourceUpdate, user=Depends(get_current_user)):
    # Verify user is admin of this hospital
    hosp = supabase.table("hospitals").select("admin_id").eq("id", hospital_id).single().execute()
    if hosp.data.get("admin_id") != user.user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = resources.model_dump(exclude_unset=True)
    res = supabase.table("hospital_resources").update(data).eq("hospital_id", hospital_id).execute()
    return res.data

@router.post("/{hospital_id}/blood")
async def update_blood(hospital_id: str, blood: BloodInventoryUpdate, user=Depends(get_current_user)):
    data = blood.model_dump()
    data["hospital_id"] = hospital_id
    res = supabase.table("blood_inventory").upsert(data, on_conflict="hospital_id,blood_group").execute()
    return res.data
''',

    'routers/search.py': '''from fastapi import APIRouter, Query
from database import supabase
from typing import Optional

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search(q: Optional[str] = None, icu: bool = False, blood: Optional[str] = None):
    query = supabase.table("hospitals").select("*, hospital_resources(*)")
    if q:
        query = query.ilike("name", f"%{q}%")
    res = query.execute()
    # In a real app, complex filtering happens here.
    return res.data
''',

    'routers/users.py': '''from fastapi import APIRouter, Depends
from database import supabase
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    res = supabase.table("users").select("*").eq("id", user.user.id).single().execute()
    return res.data
''',

    'routers/analytics.py': '''from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_stats():
    hospitals = supabase.table("hospitals").select("id", count="exact").execute()
    users = supabase.table("users").select("id", count="exact").execute()
    return {
        "total_hospitals": hospitals.count,
        "total_users": users.count
    }
'''
}

for filepath, content in backend_files.items():
    full_path = os.path.join('backend', filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Backend implemented.")

from pydantic import BaseModel
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

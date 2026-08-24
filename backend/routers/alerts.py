from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from email_service import send_resend_email

router = APIRouter(prefix="/alerts", tags=["alerts"])

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    html_content: str

@router.post("/send-email")
async def send_email_endpoint(payload: SendEmailRequest):
    result = await send_resend_email(payload.to_email, payload.subject, payload.html_content)
    return result

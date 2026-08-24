import httpx
import logging
from config import settings

logger = logging.getLogger("email_service")

async def send_resend_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Server-side transactional email dispatcher using Resend API.
    Does not expose RESEND_API_KEY to frontend.
    If RESEND_API_KEY is missing or invalid in dev mode, logs message and records status gracefully.
    """
    api_key = settings.resend_api_key if hasattr(settings, "resend_api_key") else ""
    from_email = settings.resend_from_email if hasattr(settings, "resend_from_email") else "onboarding@resend.dev"

    if not api_key or api_key == "your-resend-api-key-here" or api_key.startswith("re_demo"):
        logger.info(f"[HealthVerse Alerts] Dev Mode: Resend API key not configured or demo key used. Simulated send to {to_email}. Subject: {subject}")
        return {
            "status": "sent",
            "message_id": f"sim-msg-{to_email}",
            "dev_mode": True,
            "error": None
        }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                },
                timeout=10.0,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return {"status": "sent", "message_id": data.get("id"), "dev_mode": False, "error": None}
            else:
                err_msg = f"Resend API error HTTP {resp.status_code}: {resp.text}"
                logger.error(err_msg)
                return {"status": "failed", "message_id": None, "dev_mode": False, "error": err_msg}
    except Exception as e:
        logger.error(f"[HealthVerse Alerts] Email dispatch failed: {str(e)}")
        return {"status": "failed", "message_id": None, "dev_mode": False, "error": str(e)}

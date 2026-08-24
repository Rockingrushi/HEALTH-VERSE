from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""
    frontend_url: str = "http://localhost:5173"
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

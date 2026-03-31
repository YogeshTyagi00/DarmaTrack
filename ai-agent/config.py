import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    internal_api_key: str = os.getenv("INTERNAL_API_KEY", "")
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")


settings = Settings()

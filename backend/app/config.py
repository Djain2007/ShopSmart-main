import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Load .env from backend directory or project root
base_dir = Path(__file__).resolve().parent.parent
env_paths = [base_dir / ".env", base_dir.parent / ".env"]
for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break


class Settings:
    def __init__(self):
        self.scalemax_base_url: str = os.getenv("SCALEMAX_BASE_URL", "https://api.scalemax.pro/token/v1").rstrip("/")
        self.scalemax_api_key: str = os.getenv("SCALEMAX_API_KEY", "").strip()
        self.scalemax_model: str = os.getenv("SCALEMAX_MODEL", "").strip()
        
        self.host: str = os.getenv("HOST", "127.0.0.1")
        self.port: int = int(os.getenv("PORT", "8000"))
        
        # Granular configurable timeouts
        self.scalemax_connect_timeout: float = float(os.getenv("SCALEMAX_CONNECT_TIMEOUT", "5.0"))
        self.scalemax_read_timeout: float = float(os.getenv("SCALEMAX_READ_TIMEOUT", "30.0"))
        self.scalemax_ranking_timeout: float = float(os.getenv("SCALEMAX_RANKING_TIMEOUT", "8.0"))
        self.retailer_timeout: float = float(os.getenv("RETAILER_TIMEOUT", "5.0"))
        self.search_total_deadline: float = float(os.getenv("SEARCH_TOTAL_DEADLINE", "15.0"))
        
        origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
        self.cors_origins: List[str] = [o.strip() for o in origins_env.split(",") if o.strip()]
        
        # SQLite DB path
        db_path_env = os.getenv("SQLITE_DB_PATH", "shopsmart.db")
        if not os.path.isabs(db_path_env):
            self.sqlite_db_path: str = str(base_dir / db_path_env)
        else:
            self.sqlite_db_path: str = db_path_env

    def update_ai_config(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """Update runtime ScaleMax AI configuration dynamically."""
        if base_url is not None:
            self.scalemax_base_url = base_url.strip().rstrip("/")
        if api_key is not None:
            self.scalemax_api_key = api_key.strip()
        if model is not None:
            self.scalemax_model = model.strip()

    @property
    def is_ai_configured(self) -> bool:
        return bool(self.scalemax_base_url and self.scalemax_api_key and self.scalemax_model)

    def get_public_status(self) -> dict:
        """Returns safe status info with masked credentials."""
        masked_key = (
            (self.scalemax_api_key[:4] + "..." + self.scalemax_api_key[-4:])
            if len(self.scalemax_api_key) >= 8
            else ("***" if self.scalemax_api_key else "")
        )
        return {
            "ai_configured": self.is_ai_configured,
            "ai_base_url": self.scalemax_base_url,
            "ai_model": self.scalemax_model,
            "api_key_set": bool(self.scalemax_api_key),
            "api_key_masked": masked_key,
        }


settings = Settings()

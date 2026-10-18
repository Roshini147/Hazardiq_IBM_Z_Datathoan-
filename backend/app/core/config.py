from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    database_url: str = "sqlite:///./hazardiq.db"
    cors_origins: str = "http://localhost:5173"
    gemini_api_key: str = ""
    map_tile_url: str = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    app_name: str = "HAZARDIQ"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
settings = Settings()

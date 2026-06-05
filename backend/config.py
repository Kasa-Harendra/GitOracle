import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent

# Ollama Configurations
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LARGE_MODEL = os.getenv("LARGE_MODEL", "gpt-oss:20b")
SMALL_MODEL = os.getenv("SMALL_MODEL", "llama3.2:3b")

# Database & Cache Configurations
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27020?directConnection=true")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ai_github_workspace")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380/0")

# Security Configurations
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-developer-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# GitHub OAuth Configurations
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "Ov23licS4ccTtJGKBY16")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "134edf9abe3004f2e279ee3965200ba2d108cc9a")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


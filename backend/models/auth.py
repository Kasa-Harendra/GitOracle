from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    github_token: Optional[str] = None

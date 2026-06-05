from pydantic import BaseModel, Field

class Readme(BaseModel):
    user_id: str = Field(..., description="ID of the user")
    readme_id: str = Field(..., description="Unique readme identifier")
    repo_id: str = Field(..., description="Repository identifier (owner_name)")
    content: str = Field(..., description="Markdown content of the readme")

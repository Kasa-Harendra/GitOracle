from pydantic import BaseModel
from typing import Optional, List

class IndexRequest(BaseModel):
    concurrency: Optional[int] = 4
    file_extensions: Optional[List[str]] = None
    ignored_paths: Optional[List[str]] = None

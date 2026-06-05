import base64
import requests
from abc import ABC
from datetime import datetime
from typing import Any, Callable, Dict, Iterator, List, Literal, Optional, Union

from langchain_core.documents import Document
from langchain_core.utils import get_from_dict_or_env
from pydantic import BaseModel, field_validator, model_validator

from langchain_community.document_loaders.base import BaseLoader


class BaseGitHubLoader(BaseLoader, BaseModel, ABC):
    """Load `GitHub` repository Issues."""

    repo: str
    """Name of repository"""
    access_token: str
    """Personal access token - see https://github.com/settings/tokens?type=beta"""
    github_api_url: str = "https://api.github.com"
    """URL of GitHub API"""

    @model_validator(mode="before")
    @classmethod
    def validate_environment(cls, values: Dict) -> Any:
        """Validate that access token exists in environment."""
        values["access_token"] = get_from_dict_or_env(
            values, "access_token", "GITHUB_PERSONAL_ACCESS_TOKEN"
        )
        return values

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.access_token}",
        }


class GithubFileLoader(BaseGitHubLoader, ABC):
    """Load GitHub File"""

    branch: str = "main"
    owner: str
    file_filter: Optional[Callable[[str], bool]] = None

    def get_file_paths(self) -> List[Dict]:
        base_url = (
            f"{self.github_api_url}/repos/{self.owner}/{self.repo}/git/trees/"
            f"{self.branch}?recursive=1"
        )
        response = requests.get(base_url, headers=self.headers)
        response.raise_for_status()
        all_files = response.json()["tree"]
        return [
            f
            for f in all_files
            if not (self.file_filter and not self.file_filter(f["path"]))
        ]

    def get_file_content_by_path(self, path: str) -> str:
        queryparams = f"?ref={self.branch}" if self.branch else ""
        base_url = (
            f"{self.github_api_url}/repos/{self.owner}/{self.repo}/contents/{path}{queryparams}"
        )
        response = requests.get(base_url, headers=self.headers)
        response.raise_for_status()

        if isinstance(response.json(), dict):
            content_encoded = response.json().get("content", "")
            # Remove any newlines or spaces before decoding
            cleaned_encoded = "".join(content_encoded.split())
            return base64.b64decode(cleaned_encoded).decode("utf-8")

        return ""

    def lazy_load(self) -> Iterator[Document]:
        files = self.get_file_paths()
        for file in files:
            content = self.get_file_content_by_path(file["path"])
            if content == "":
                continue

            metadata = {
                "path": file["path"],
                "sha": file["sha"],
                "source": f"{self.github_api_url}/{self.repo}/{file['type']}/"
                f"{self.branch}/{file['path']}",
            }
            yield Document(page_content=content, metadata=metadata)

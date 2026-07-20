import sys
import os
import io
import queue
import json
import asyncio
import threading
from typing import Dict, Any, Generator, Optional, List
from pathlib import Path

# Add TreeRAG to system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.treerag.treerag.retriever import TreeRAGRetriever, TreeRAGQA
from backend.treerag.treerag.config import get_tree_retrieval_llm
import backend.treerag.treerag.config as treerag_config
from backend.config import OLLAMA_BASE_URL, LARGE_MODEL, SMALL_MODEL
import backend.database as db

# Thread-safe queue writer to capture stdout
class QueueWriter(io.TextIOBase):
    def __init__(self, q: queue.Queue):
        self.q = q
        
    def write(self, s: str) -> int:
        if s.strip():
            clean_s = s.strip()
            self.q.put(clean_s)
        return len(s)

# Subclass retriever to load index directly from MongoDB document
class MongoTreeRAGRetriever(TreeRAGRetriever):
    def __init__(self, repo_id: str, branch: str, max_depth: int = 4, verbose: bool = True):
        # Fetch compiled index from database
        index_data = db.get_repo_index(repo_id, branch)
        if not index_data:
            raise FileNotFoundError(f"TreeRAG index not found in database for repository: {repo_id} (branch: {branch})")
            
        # Direct initialization of BaseRetriever fields, bypassing local file loading
        super(TreeRAGRetriever, self).__init__(
            root_dir=index_data["root_dir"],
            nodes=index_data["nodes"],
            root_id=index_data["root_id"],
            max_depth=max_depth,
            verbose=verbose,
            llm=get_tree_retrieval_llm()
        )

class TreeRAGService:
    @staticmethod
    async def index_repository_remote(
        repo_id: str,
        owner: str,
        repo_name: str,
        branch: str,
        access_token: str,
        concurrency: int = 4,
        file_extensions: Optional[List[str]] = None,
        ignored_paths: Optional[List[str]] = None,
        selected_files: Optional[List[str]] = None
    ) -> tuple:
        """
        Builds the tree index remotely by querying files via GithubFileLoader
        and compiling them into nodes with summaries and file contents, avoiding disk cloning.
        """
        # Configure model environment for TreeRAG builder
        os.environ["OLLAMA_BASE_URL"] = OLLAMA_BASE_URL
        os.environ["TREE_BUILD_MODEL"] = SMALL_MODEL
        os.environ["TREE_RETRIEVAL_MODEL"] = LARGE_MODEL

        from backend.services.github_loader import GithubFileLoader
        from backend.treerag.treerag.builder import GithubTreeBuilder
        
        loader = GithubFileLoader(
            repo=repo_name,
            owner=owner,
            access_token=access_token,
            branch=branch
        )
        
        builder = GithubTreeBuilder(
            loader=loader,
            concurrency_limit=concurrency
        )
        
        root_id, index_data = await builder.build(
            file_extensions=file_extensions,
            ignored_paths=ignored_paths,
            selected_files=selected_files
        )
        
        return root_id, index_data

    @staticmethod
    def query_repository_stream(repo_id: str, query_str: str, branch: Optional[str] = None, username: Optional[str] = None) -> Generator[Dict[str, Any], None, None]:
        """
        Queries TreeRAG index directly from MongoDB and streams intermediate reasoning steps.
        """
        # Configure environment
        os.environ["OLLAMA_BASE_URL"] = OLLAMA_BASE_URL
        os.environ["TREE_BUILD_MODEL"] = SMALL_MODEL
        os.environ["TREE_RETRIEVAL_MODEL"] = LARGE_MODEL

        # Resolve active branch
        from backend.services.state import ACTIVE_BRANCHES, get_virtual_repo
        repo = get_virtual_repo(repo_id)
        active_branch = branch or ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"

        # Load custom DB-based retriever
        retriever = MongoTreeRAGRetriever(
            repo_id=repo_id,
            branch=active_branch,
            max_depth=4,
            verbose=True
        )
        qa_system = TreeRAGQA(retriever=retriever)
        
        yield {"type": "trace", "content": "Analyzing repository index via flat-pass node selection..."}
        
        for chunk in qa_system.query_stream(query_str):
            yield chunk

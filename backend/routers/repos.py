import asyncio
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse

# Import services & DB helpers
from backend.services.auth import AuthService
from backend.services.treerag_service import TreeRAGService
from backend.services.github_toolkit import GitHubToolkitService
from backend.services.ai import AIService
import backend.database as db
from backend.celery_app import index_repo_task
from backend.services.state import ACTIVE_BRANCHES, get_virtual_repo
from backend.routers.auth import get_current_user
from backend.models.repo import IndexRequest

router = APIRouter(tags=["repos"])

# --- TreeRAG Indexing ---

# --- Repository Routes ---
@router.get("/api/repos")
def list_repos(sync: bool = False, user = Depends(get_current_user)):
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token") if user_info else None
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if not decrypted_token:
        return []

    if not sync:
        cached_repos = db.get_cached_repos(user["username"])
        if cached_repos is not None:
            return cached_repos

    import urllib.request
    import json
    try:
        req_url = "https://api.github.com/user/repos?sort=updated&per_page=100"
        api_req = urllib.request.Request(
            req_url,
            headers={
                "Authorization": f"Bearer {decrypted_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "FastAPI"
            }
        )
        with urllib.request.urlopen(api_req, timeout=10) as api_res:
            github_repos = json.loads(api_res.read().decode("utf-8"))
            
        repos = []
        for gr in github_repos:
            repo_id = f"{gr['owner']['login']}_{gr['name']}"
            r = {
                "id": repo_id,
                "owner": gr["owner"]["login"],
                "name": gr["name"],
                "description": gr.get("description", ""),
                "is_private": gr.get("private", False),
                "clone_url": gr["clone_url"],
                "local_path": "",
                "active_branch": ACTIVE_BRANCHES.get(repo_id) or gr.get("default_branch", "main"),
                "stars": gr.get("stargazers_count", 0),
                "last_indexed": 0.0,
                "index_path": "",
                "created_at": 0.0
            }
            
            repo_idx = db.get_repo_index(repo_id, (ACTIVE_BRANCHES.get(repo_id) or gr.get("default_branch", "main")))
            if repo_idx:
                r["last_indexed"] = 1.0
                r["index_path"] = f"mongodb://repo_indexes/{repo_id}"
                
            repos.append(r)
            
        db.save_cached_repos(user["username"], repos)
        
        # If sync=true, fetch and cache branches and tree for each repo
        if sync:
            for repo in repos:
                try:
                    branches = GitHubToolkitService.get_github_branches(repo["owner"], repo["name"], decrypted_token)
                    if branches:
                        db.save_cached_branches(user["username"], repo["id"], branches)
                        
                    # Fetch tree for active branch
                    active_br = repo["active_branch"]
                    tree = GitHubToolkitService.get_github_file_tree(repo["owner"], repo["name"], active_br, decrypted_token)
                    if tree:
                        db.save_cached_tree(user["username"], repo["id"], active_br, tree)
                except Exception as e:
                    print(f"[Main API] Failed to sync branches/tree for {repo['id']}: {e}")

        return repos
    except Exception as e:
        print(f"[Main API] Failed to fetch repos from GitHub: {e}")
        return []

@router.get("/api/repos/{repo_id}")
def get_repo(repo_id: str, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    
    # Check if index exists in database
    branch = ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"
    repo_idx = db.get_repo_index(repo_id, branch)
    if repo_idx:
        repo["last_indexed"] = 1.0
        repo["index_path"] = f"mongodb://repo_indexes/{repo_id}"
            
    # Try to fetch live stars count dynamically
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if decrypted_token:
        try:
            import urllib.request
            import json
            req_url = f"https://api.github.com/repos/{repo['owner']}/{repo['name']}"
            api_req = urllib.request.Request(
                req_url,
                headers={
                    "Authorization": f"Bearer {decrypted_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "FastAPI"
                }
            )
            with urllib.request.urlopen(api_req, timeout=5) as api_res:
                repo_data = json.loads(api_res.read().decode("utf-8"))
                repo["stars"] = repo_data.get("stargazers_count", 0)
                default_branch = repo_data.get("default_branch", "main")
                if not ACTIVE_BRANCHES.get(repo_id):
                    repo["active_branch"] = default_branch
        except Exception as e:
            print(f"[Main API] Failed to fetch live repo details: {e}")
            
    return repo

@router.get("/api/repos/{repo_id}/branches")
def get_branches(repo_id: str, sync: bool = False, user = Depends(get_current_user)):
    if not sync:
        cached_branches = db.get_cached_branches(user["username"], repo_id)
        if cached_branches is not None:
            return cached_branches

    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if decrypted_token:
        branches = GitHubToolkitService.get_github_branches(repo["owner"], repo["name"], decrypted_token)
        if branches:
            db.save_cached_branches(user["username"], repo_id, branches)
        return branches
    return []

@router.post("/api/repos/{repo_id}/checkout")
def checkout_branch(repo_id: str, branch: str, user = Depends(get_current_user)):
    ACTIVE_BRANCHES[repo_id] = branch
    return {"message": f"Checked out branch {branch} successfully"}

@router.get("/api/repos/{repo_id}/tree")
def get_tree(repo_id: str, branch: Optional[str] = None, sync: bool = False, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    br = branch or ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"
    
    if not sync:
        cached_tree = db.get_cached_tree(user["username"], repo_id, br)
        if cached_tree is not None:
            return cached_tree

    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if decrypted_token:
        tree = GitHubToolkitService.get_github_file_tree(repo["owner"], repo["name"], br, decrypted_token)
        if tree:
            db.save_cached_tree(user["username"], repo_id, br, tree)
        return tree
    return []

@router.get("/api/repos/{repo_id}/file")
def get_file(repo_id: str, path: str, branch: Optional[str] = None, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if decrypted_token:
        br = branch or ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"
        content = GitHubToolkitService.get_github_file_content(repo["owner"], repo["name"], path, br, decrypted_token)
        return {"content": content}
    return {"content": "Authentication token missing."}

@router.post("/api/repos/{repo_id}/index")
def start_indexing(repo_id: str, req: IndexRequest, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token") if user_info else None
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    if not decrypted_token:
        raise HTTPException(status_code=400, detail="Secure GitHub access token missing.")
        
    task = index_repo_task.delay(
        repo_id=repo_id,
        owner=repo["owner"],
        repo_name=repo["name"],
        branch=repo.get("active_branch") or "main",
        access_token=decrypted_token,
        concurrency=req.concurrency or 4,
        file_extensions=req.file_extensions,
        ignored_paths=req.ignored_paths
    )
    return {"message": "Background Celery indexing task queued successfully.", "task_id": task.id}

@router.get("/api/repos/{repo_id}/indexing/logs")
def get_indexing_logs(repo_id: str, user = Depends(get_current_user)):
    logs = db.get_indexing_logs(repo_id)
    if not logs:
        return [{"log_line": "No active indexing logs found. Trigger indexing to begin.", "timestamp": 0.0}]
    return logs

# --- Core Streaming TreeRAG Chat ---
@router.get("/api/repos/{repo_id}/chat")
async def chat_stream(repo_id: str, query: str, user = Depends(get_current_user)):
    """
    Streams step-by-step reasoning trace followed by the final synthesized answer.
    """
    def sse_generator():
        try:
            generator = TreeRAGService.query_repository_stream(repo_id, query, user["username"])
            for event in generator:
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# --- File Explanation Stream ---
@router.get("/api/repos/{repo_id}/explain")
def explain_file(repo_id: str, path: str, question: Optional[str] = None, branch: Optional[str] = None, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    
    # Fetch content dynamically using decrypted token
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    content = ""
    if decrypted_token:
        br = branch or ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"
        content = GitHubToolkitService.get_github_file_content(repo["owner"], repo["name"], path, br, decrypted_token)
    
    filename = path.split("/")[-1]

    def sse_generator():
        try:
            generator = AIService.explain_file_stream(filename, path, content, question)
            for chunk in generator:
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# --- README Generation Stream ---
@router.get("/api/repos/{repo_id}/readme")
def generate_readme(repo_id: str, custom_info: Optional[str] = None, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    
    # Get dynamic file listing
    user_info = db.get_user(user["username"])
    encrypted_token = user_info.get("github_token")
    decrypted_token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    tree_items = []
    if decrypted_token:
        br = ACTIVE_BRANCHES.get(repo_id) or repo.get("active_branch") or "main"
        from backend.services.github_loader import GithubFileLoader
        try:
            loader = GithubFileLoader(repo=repo["name"], owner=repo["owner"], access_token=decrypted_token, branch=br)
            tree_items = [f["path"] for f in loader.get_file_paths()[:40]]
        except Exception:
            pass
            
    tree_str = "\n".join([f"- {p}" for p in tree_items])

    def sse_generator():
        try:
            generator = AIService.generate_readme_stream(repo["name"], tree_str, custom_info)
            for chunk in generator:
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# --- Pull Request Routes ---
@router.get("/api/repos/{repo_id}/pulls")
def list_pulls(repo_id: str, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    owner = repo["owner"]
    name = repo["name"]
    encrypted_token = user_info["github_token"] if user_info else None
    token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    return GitHubToolkitService.get_pull_requests(repo_id, owner, name, token)

@router.get("/api/repos/{repo_id}/pulls/{pr_number}")
def get_pull_details(repo_id: str, pr_number: int, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    encrypted_token = user_info["github_token"] if user_info else None
    token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    return GitHubToolkitService.get_pr_details(repo_id, pr_number, repo["owner"], repo["name"], token)

@router.get("/api/repos/{repo_id}/pulls/{pr_number}/summary")
def get_pr_summary(repo_id: str, pr_number: int, user = Depends(get_current_user)):
    repo = get_virtual_repo(repo_id)
    user_info = db.get_user(user["username"])
    encrypted_token = user_info["github_token"] if user_info else None
    token = AuthService.decrypt_token(encrypted_token) if encrypted_token else None
    
    details = GitHubToolkitService.get_pr_details(repo_id, pr_number, repo["owner"], repo["name"], token)
    
    def sse_generator():
        try:
            generator = AIService.summarize_pr_stream(details.get("title", ""), details.get("body", ""), details.get("changed_files", []))
            for chunk in generator:
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


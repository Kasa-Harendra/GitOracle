# Volatile database-free in-memory repository states
ACTIVE_BRANCHES = {}   # Map repo_id -> active_branch name

def get_virtual_repo(repo_id: str) -> dict:
    parts = repo_id.split("_")
    owner = parts[0]
    name = parts[1] if len(parts) > 1 else "unknown"
    return {
        "id": repo_id,
        "owner": owner,
        "name": name,
        "clone_url": f"https://github.com/{owner}/{name}.git",
        "local_path": "",
        "active_branch": ACTIVE_BRANCHES.get(repo_id) or "main",
        "stars": 0,
        "last_indexed": 0.0,
        "index_path": "",
        "created_at": 0.0
    }

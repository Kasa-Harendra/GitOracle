import json
import uuid
import time
from typing import Dict, Any, List, Optional
import redis
from pymongo import MongoClient
from backend.config import MONGO_URI, MONGO_DB_NAME, REDIS_URL

# Establish MongoDB Connection
mongo_client = None
mongo_db = None

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()
    mongo_db = mongo_client[MONGO_DB_NAME]
    print("[DB] Connected to MongoDB successfully!")
except Exception as e:
    print(f"[DB] MongoDB connection failed: {e}. Proceeding without active connection check.")
    if mongo_client is not None:
        mongo_db = mongo_client[MONGO_DB_NAME]

# Establish Redis Connection
redis_client = None

try:
    redis_client = redis.from_url(REDIS_URL, socket_timeout=2.0)
    redis_client.ping()
    print("[Cache] Connected to Redis successfully!")
except Exception as e:
    print(f"[Cache] Redis connection failed: {e}. Proceeding without active connection check.")

# Database Functions
def save_user(username: str, avatar_url: str = "", github_token: str = "") -> Dict[str, Any]:
    user_id = str(uuid.uuid4())
    now = time.time()
    user_data = {
        "id": user_id,
        "username": username,
        "avatar_url": avatar_url,
        "github_token": github_token,
        "created_at": now
    }
    
    mongo_db.users.update_one(
        {"username": username},
        {"$set": user_data},
        upsert=True
    )
    return mongo_db.users.find_one({"username": username}, {"_id": 0})

def get_user(username: str) -> Optional[Dict[str, Any]]:
    return mongo_db.users.find_one({"username": username}, {"_id": 0})

def get_repositories() -> List[Dict[str, Any]]:
    return list(mongo_db.repositories.find({}, {"_id": 0}))

def save_repository(owner: str, name: str, clone_url: str, local_path: str, active_branch: str = "main") -> Dict[str, Any]:
    repo_id = str(uuid.uuid4())
    now = time.time()
    repo_data = {
        "id": repo_id,
        "owner": owner,
        "name": name,
        "clone_url": clone_url,
        "local_path": local_path,
        "active_branch": active_branch,
        "last_indexed": 0.0,
        "index_path": "",
        "created_at": now
    }
    
    # Check if already exists to preserve fields, but update active_branch
    existing = mongo_db.repositories.find_one({"owner": owner, "name": name})
    if existing:
        mongo_db.repositories.update_one(
            {"owner": owner, "name": name},
            {"$set": {"active_branch": active_branch}}
        )
        return mongo_db.repositories.find_one({"owner": owner, "name": name}, {"_id": 0})
    else:
        mongo_db.repositories.update_one(
            {"owner": owner, "name": name},
            {"$set": repo_data},
            upsert=True
        )
        return mongo_db.repositories.find_one({"owner": owner, "name": name}, {"_id": 0})

def update_repo_indexing(repo_id: str, index_path: str) -> None:
    now = time.time()
    mongo_db.repositories.update_one(
        {"id": repo_id},
        {"$set": {"last_indexed": now, "index_path": index_path}}
    )

def get_repository(repo_id: str) -> Optional[Dict[str, Any]]:
    return mongo_db.repositories.find_one({"id": repo_id}, {"_id": 0})

def create_chat_session(user_id: str, repo_id: str, title: str) -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    now = time.time()
    session_data = {
        "id": session_id,
        "user_id": user_id,
        "repo_id": repo_id,
        "title": title,
        "created_at": now
    }
    
    mongo_db.chat_sessions.insert_one(session_data)
    session_data.pop("_id", None)
    return session_data

def get_chat_sessions(user_id: str) -> List[Dict[str, Any]]:
    return list(mongo_db.chat_sessions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1))

def save_message(session_id: str, sender: str, content: str, sources: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    msg_id = str(uuid.uuid4())
    now = time.time()
    msg_data = {
        "id": msg_id,
        "session_id": session_id,
        "sender": sender,
        "content": content,
        "sources": sources or [],
        "timestamp": now
    }
    
    mongo_db.messages.insert_one(msg_data.copy())
    msg_data.pop("_id", None)
    return msg_data

def get_messages(session_id: str) -> List[Dict[str, Any]]:
    return list(mongo_db.messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1))

# TreeRAG Index Document storage functions
def save_repo_index(repo_id: str, branch: str, index_data: Dict[str, Any]) -> None:
    now = time.time()
    mongo_db.repo_indexes.update_one(
        {"repo_id": repo_id, "branch": branch},
        {"$set": {"repo_id": repo_id, "branch": branch, "index_data": index_data, "created_at": now}},
        upsert=True
    )

def get_repo_index(repo_id: str, branch: str) -> Optional[Dict[str, Any]]:
    doc = mongo_db.repo_indexes.find_one({"repo_id": repo_id, "branch": branch})
    return doc["index_data"] if doc else None

# Redis cache helpers
def cache_set(key: str, value: str, expire_sec: int = 3600):
    if redis_client is not None:
        try:
            redis_client.setex(key, expire_sec, value)
        except Exception as e:
            print(f"[Cache] Failed to set key '{key}' in Redis: {e}")

def cache_get(key: str) -> Optional[str]:
    if redis_client is not None:
        try:
            val = redis_client.get(key)
            return val.decode('utf-8') if val else None
        except Exception as e:
            print(f"[Cache] Failed to get key '{key}' from Redis: {e}")
    return None

# TreeRAG Indexing Process Logging
def add_indexing_log(repo_id: str, branch: str, log_line: str) -> None:
    now = time.time()
    import sys
    if hasattr(sys, "__stdout__") and sys.__stdout__ and sys.stdout != sys.__stdout__:
        sys.__stdout__.write(f"[IndexingLog][{repo_id}][{branch}] {log_line}\n")
        sys.__stdout__.flush()
    else:
        print(f"[IndexingLog][{repo_id}][{branch}] {log_line}")
    mongo_db.indexing_logs.insert_one({
        "repo_id": repo_id,
        "branch": branch,
        "log_line": log_line,
        "timestamp": now
    })

def get_indexing_logs(repo_id: str, branch: str) -> List[Dict[str, Any]]:
    return list(mongo_db.indexing_logs.find({"repo_id": repo_id, "branch": branch}, {"_id": 0}).sort("timestamp", 1))

def clear_indexing_logs(repo_id: str, branch: str) -> None:
    mongo_db.indexing_logs.delete_many({"repo_id": repo_id, "branch": branch})

# Caching Functions
def save_cached_repos(user_id: str, repos: List[Dict[str, Any]]) -> None:
    now = time.time()
    mongo_db.user_github_repos.update_one(
        {"user_id": user_id},
        {"$set": {"repos": repos, "updated_at": now}},
        upsert=True
    )

def get_cached_repos(user_id: str) -> Optional[List[Dict[str, Any]]]:
    doc = mongo_db.user_github_repos.find_one({"user_id": user_id})
    return doc["repos"] if doc else None

def save_cached_branches(user_id: str, repo_id: str, branches: List[Dict[str, Any]]) -> None:
    now = time.time()
    mongo_db.repo_branches.update_one(
        {"user_id": user_id, "repo_id": repo_id},
        {"$set": {"branches": branches, "updated_at": now}},
        upsert=True
    )

def get_cached_branches(user_id: str, repo_id: str) -> Optional[List[Dict[str, Any]]]:
    doc = mongo_db.repo_branches.find_one({"user_id": user_id, "repo_id": repo_id})
    return doc["branches"] if doc else None

def save_cached_tree(user_id: str, repo_id: str, branch: str, tree: List[Dict[str, Any]]) -> None:
    now = time.time()
    mongo_db.repo_trees.update_one(
        {"user_id": user_id, "repo_id": repo_id, "branch": branch},
        {"$set": {"tree": tree, "updated_at": now}},
        upsert=True
    )

def get_cached_tree(user_id: str, repo_id: str, branch: str) -> Optional[List[Dict[str, Any]]]:
    doc = mongo_db.repo_trees.find_one({"user_id": user_id, "repo_id": repo_id, "branch": branch})
    return doc["tree"] if doc else None

# README Storage Functions
def save_readme(user_id: str, repo_id: str, content: str, readme_id: Optional[str] = None) -> Dict[str, Any]:
    if not readme_id:
        readme_id = str(uuid.uuid4())
    now = time.time()
    readme_data = {
        "readme_id": readme_id,
        "user_id": user_id,
        "repo_id": repo_id,
        "content": content,
        "updated_at": now
    }
    mongo_db.readmes.update_one(
        {"readme_id": readme_id, "user_id": user_id},
        {"$set": readme_data},
        upsert=True
    )
    readme_data.pop("_id", None)
    return readme_data

def get_readmes(user_id: str, repo_id: str) -> List[Dict[str, Any]]:
    return list(mongo_db.readmes.find({"user_id": user_id, "repo_id": repo_id}, {"_id": 0}).sort("updated_at", -1))

def delete_readme(user_id: str, readme_id: str) -> bool:
    result = mongo_db.readmes.delete_one({"readme_id": readme_id, "user_id": user_id})
    return result.deleted_count > 0

import json
import urllib.request
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import RedirectResponse

# Import services & DB helpers
from backend.services.auth import AuthService
from backend.services.github_toolkit import GitHubToolkitService
import backend.database as db
from backend.models.auth import LoginRequest
from backend.config import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, FRONTEND_URL

router = APIRouter(tags=["auth"])

# Authentication Dependency
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    token = authorization.replace("Bearer ", "")
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    return payload

# --- OAuth Helpers ---
def exchange_code_for_token(code: str) -> Optional[str]:
    url = "https://github.com/login/oauth/access_token"
    data = urllib.parse.urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI
    }).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Accept": "application/json", "User-Agent": "FastAPI"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("access_token")
    except Exception as e:
        print(f"[OAuth] Code exchange failed: {e}")
        return None

def fetch_github_user(access_token: str) -> Optional[dict]:
    url = "https://api.github.com/user"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {access_token}", "User-Agent": "FastAPI"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"[OAuth] Fetch user failed: {e}")
        return None

# --- Auth Routes ---
@router.get("/api/auth/github")
def github_login():
    """Redirects the client browser to GitHub OAuth authorization gate."""
    url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={GITHUB_REDIRECT_URI}&scope=repo,user"
    return RedirectResponse(url)

@router.get("/api/auth/callback")
def github_callback(code: str):
    """
    Handles the redirect callback from GitHub. Exchanges code, 
    encrypts the retrieved access token, logs in the user, and redirects
    to the frontend with the secure session token.
    """
    token_val = exchange_code_for_token(code)
    if not token_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="OAuth authentication failed: Failed to exchange authorization code for access token"
        )
        
    user_data = fetch_github_user(token_val)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="OAuth authentication failed: Failed to retrieve user profile data from GitHub"
        )
        
    username = user_data.get("login")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="OAuth authentication failed: GitHub response did not contain login handle"
        )
        
    avatar_url = user_data.get("avatar_url", "")
    
    # Securely log in and encrypt token
    res = AuthService.login_user(username, token_val, avatar_url)
    return RedirectResponse(
        f"{FRONTEND_URL}/?token={res['token']}&username={username}&avatar_url={avatar_url}"
    )

@router.post("/api/auth/login")
def login(req: LoginRequest):
    try:
        return AuthService.login_user(req.username, req.github_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/auth/me")
def me(user = Depends(get_current_user)):
    user_info = db.get_user(user["username"])
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user_info["id"],
        "username": user_info["username"],
        "avatar_url": user_info["avatar_url"],
        "has_github_token": bool(user_info.get("github_token"))
    }

@router.get("/api/github/repos")
def list_github_user_repos(user = Depends(get_current_user)):
    user_info = db.get_user(user["username"])
    if not user_info:
        raise HTTPException(status_code=404, detail="User session not found")
    
    encrypted_token = user_info.get("github_token")
    if not encrypted_token:
        raise HTTPException(status_code=400, detail="GitHub OAuth token missing in profile")
        
    decrypted_token = AuthService.decrypt_token(encrypted_token)
    if not decrypted_token:
         raise HTTPException(status_code=400, detail="Failed to decrypt secure GitHub access token")
         
    return GitHubToolkitService.get_user_repositories(decrypted_token)

from typing import List, Dict, Any, Optional
from github import Github

class GitHubToolkitService:
    @staticmethod
    def get_pull_requests(repo_id: str, owner: str, repo_name: str, github_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves pull requests for a repository.
        """
        prs = []
        if github_token:
            try:
                g = Github(github_token)
                r = g.get_repo(f"{owner}/{repo_name}")
                open_prs = r.get_pulls(state='open')
                for pr in open_prs:
                    prs.append({
                        "number": pr.number,
                        "title": pr.title,
                        "body": pr.body or "No description provided.",
                        "state": pr.state,
                        "source_branch": pr.head.ref,
                        "target_branch": pr.base.ref,
                        "author": pr.user.login,
                        "avatar_url": pr.user.avatar_url,
                        "created_at": pr.created_at.isoformat()
                    })
                return prs
            except Exception as e:
                print(f"[GithubToolkit] GitHub API PR fetch failed: {e}.")
        return prs

    @staticmethod
    def get_pr_details(repo_id: str, pr_number: int, owner: str, repo_name: str, github_token: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves details of a PR including commits and changed files with diffs."""
        if github_token:
            try:
                g = Github(github_token)
                r = g.get_repo(f"{owner}/{repo_name}")
                pr = r.get_pull(pr_number)
                
                commits = []
                for c in pr.get_commits():
                    commits.append({
                        "sha": c.sha[:7],
                        "message": c.commit.message,
                        "author": c.commit.author.name,
                        "date": c.commit.author.date.isoformat()
                    })
                    
                changed_files = []
                for f in pr.get_files():
                    changed_files.append({
                        "filename": f.filename,
                        "status": f.status,
                        "additions": f.additions,
                        "deletions": f.deletions,
                        "patch": f.patch or ""
                    })
                    
                return {
                    "number": pr.number,
                    "title": pr.title,
                    "body": pr.body or "",
                    "source_branch": pr.head.ref,
                    "target_branch": pr.base.ref,
                    "commits": commits,
                    "changed_files": changed_files
                }
            except Exception as e:
                print(f"[GithubToolkit] Fetch PR details failed: {e}.")
        return {}

    @staticmethod
    def get_user_repositories(github_token: str) -> List[Dict[str, Any]]:
        """Queries GitHub to fetch all public and private repositories belonging to the authenticated user."""
        import urllib.request
        import json
        
        # Standard page limit 100
        url = "https://api.github.com/user/repos?per_page=100&sort=updated"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "FastAPI"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                repos_data = json.loads(response.read().decode("utf-8"))
                simplified_repos = []
                for r in repos_data:
                    simplified_repos.append({
                        "name": r.get("name"),
                        "owner": r.get("owner", {}).get("login"),
                        "clone_url": r.get("clone_url"),
                        "description": r.get("description") or "No description provided.",
                        "is_private": r.get("private", False),
                        "default_branch": r.get("default_branch", "main"),
                        "active_branch": r.get("default_branch", "main"),
                        "github_id": r.get("id"),
                        "id": f"{r.get('owner', {}).get('login')}_{r.get('name')}",
                        "stars": r.get("stargazers_count", 0)
                    })
                return simplified_repos
        except Exception as e:
            print(f"[GithubToolkit] Failed to fetch user repositories: {e}")
            return []

    @staticmethod
    def get_github_branches(owner: str, repo_name: str, github_token: str) -> List[str]:
        """Fetches branches directly from GitHub API using the user access token without cloning."""
        import urllib.request
        import json
        
        url = f"https://api.github.com/repos/{owner}/{repo_name}/branches"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "FastAPI"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                branches_data = json.loads(response.read().decode("utf-8"))
                return [b.get("name") for b in branches_data]
        except Exception as e:
            print(f"[GithubToolkit] Failed to fetch branches from GitHub API: {e}")
            return []

    @staticmethod
    def get_github_file_tree(owner: str, repo_name: str, branch: str, github_token: str) -> List[Dict[str, Any]]:
        """
        Fetches repository recursive file list from GitHub using Langchain's GithubFileLoader
        and compiles it into a nested directory structure without cloning.
        """
        from backend.services.github_loader import GithubFileLoader
        
        try:
            loader = GithubFileLoader(
                repo=repo_name,
                owner=owner,
                access_token=github_token,
                branch=branch
            )
            tree_items = loader.get_file_paths()
            
            path_map = {}
            roots = []
            
            sorted_items = sorted(tree_items, key=lambda x: x["path"])
            ignored_dirs = {".git", "node_modules", ".venv", "venv", "__pycache__", ".next", "dist", "build"}
            
            for item in sorted_items:
                path = item["path"]
                parts = path.split("/")
                
                skip = False
                for p in parts[:-1]:
                    if p in ignored_dirs:
                        skip = True
                        break
                if parts[-1] in ignored_dirs or parts[-1].startswith(".git"):
                    skip = True
                    
                if skip:
                    continue
                    
                name = parts[-1]
                node_type = "directory" if item["type"] == "tree" else "file"
                
                node = {
                    "name": name,
                    "path": path,
                    "type": node_type
                }
                if node_type == "directory":
                    node["children"] = []
                    
                path_map[path] = node
                
                if len(parts) == 1:
                    roots.append(node)
                else:
                    parent_path = "/".join(parts[:-1])
                    if parent_path in path_map:
                        path_map[parent_path]["children"].append(node)
                    else:
                        roots.append(node)
                        
            def sort_nodes(nodes_list):
                for n in nodes_list:
                    if "children" in n:
                        sort_nodes(n["children"])
                nodes_list.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
                
            sort_nodes(roots)
            return roots
        except Exception as e:
            print(f"[GithubToolkit] Failed to fetch recursive tree using GithubFileLoader: {e}")
            return []

    @staticmethod
    def get_github_file_content(owner: str, repo_name: str, path: str, branch: str, github_token: str) -> str:
        """Fetches file content using Langchain's GithubFileLoader directly from GitHub without cloning."""
        from backend.services.github_loader import GithubFileLoader
        
        try:
            loader = GithubFileLoader(
                repo=repo_name,
                owner=owner,
                access_token=github_token,
                branch=branch
            )
            return loader.get_file_content_by_path(path)
        except Exception as e:
            print(f"[GithubToolkit] Failed to fetch file content using GithubFileLoader: {e}")
            return f"Error loading file content directly from GitHub API using GithubFileLoader: {e}"



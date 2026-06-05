import os
import sys
from celery import Celery
from celery.utils.log import get_task_logger

# Ensure backend folder is in path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import REDIS_URL

logger = get_task_logger(__name__)

# Initialize Celery
celery_app = Celery(
    "ai_github_workspace",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="backend.celery_app.index_repo_task")
def index_repo_task(
    repo_id: str,
    owner: str,
    repo_name: str,
    branch: str,
    access_token: str,
    concurrency: int = 4,
    file_extensions: list = None,
    ignored_paths: list = None
):
    import asyncio
    from backend.database import add_indexing_log, clear_indexing_logs, update_repo_indexing, save_repo_index
    from backend.services.treerag_service import TreeRAGService
    
    logger.info(f"Starting Celery background indexing task for {owner}/{repo_name} (branch: {branch})")
    
    try:
        clear_indexing_logs(repo_id, branch)
        add_indexing_log(repo_id, branch, f"Initializing Celery Remote TreeRAG Indexing Pipeline for {owner}/{repo_name}...")
        
        # We need an event loop to run async tasks in celery worker
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        async def run():
            add_indexing_log(repo_id, branch, "Loading and building GitHub File Tree structure via API (No Cloning)...")
            root_id, index_data = await TreeRAGService.index_repository_remote(
                repo_id=repo_id,
                owner=owner,
                repo_name=repo_name,
                branch=branch,
                access_token=access_token,
                concurrency=concurrency,
                file_extensions=file_extensions,
                ignored_paths=ignored_paths
            )
            return root_id, index_data
            
        root_id, index_data = loop.run_until_complete(run())
        
        add_indexing_log(repo_id, branch, "Codebase index compiled. Saving structures with raw contents in MongoDB...")
        save_repo_index(repo_id, branch, index_data)
        update_repo_indexing(repo_id, f"mongodb://repo_indexes/{repo_id}/{branch}")
        add_indexing_log(repo_id, branch, "Celery indexing task successfully completed!")
        logger.info(f"Celery indexing task successfully completed for {repo_id} (branch: {branch})")
        return {"status": "SUCCESS", "root_id": root_id}
    except Exception as e:
        import traceback
        err_msg = f"ERROR: Celery background indexing failed: {str(e)}\n{traceback.format_exc()}"
        logger.error(err_msg)
        add_indexing_log(repo_id, branch, err_msg)
        return {"status": "FAILED", "error": str(e)}

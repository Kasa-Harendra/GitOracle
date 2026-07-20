import os
import tiktoken
from langchain_ollama import ChatOllama
from langchain_nvidia_ai_endpoints import ChatNVIDIA

from backend.config import USE_OLLAMA, OLLAMA_BASE_URL, NVIDIA_API_KEY

# Ollama Server Configurations
TREE_BUILD_MODEL = os.getenv("TREE_BUILD_MODEL", "llama3.2:3b")
TREE_RETRIEVAL_MODEL = os.getenv("TREE_RETRIEVAL_MODEL", "gpt-oss:20b")

# NVIDIA Configurations
NVIDIA_TREE_BUILD_MODEL = os.getenv("NVIDIA_TREE_BUILD_MODEL", "meta/llama-3.2-3b-instruct")
NVIDIA_TREE_RETRIEVAL_MODEL = os.getenv("NVIDIA_TREE_RETRIEVAL_MODEL", "meta/llama-3.1-70b-instruct")

# Initialize our LLM using LangChain Ollama
def get_tree_build_llm(temperature=0.3):
    if not USE_OLLAMA:
        return ChatNVIDIA(
            model=NVIDIA_TREE_BUILD_MODEL,
            nvidia_api_key=NVIDIA_API_KEY,
            temperature=temperature,
        )
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=TREE_BUILD_MODEL,
        temperature=temperature,
    )


def get_tree_retrieval_llm(temperature=0.3):
    if not USE_OLLAMA:
        return ChatNVIDIA(
            model=NVIDIA_TREE_RETRIEVAL_MODEL,
            nvidia_api_key=NVIDIA_API_KEY,
            temperature=temperature,
        )
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=TREE_RETRIEVAL_MODEL,
        temperature=temperature,
    )


def get_llm(temperature=0.3):
    return get_tree_build_llm(temperature=temperature)

# Directories to always skip during indexing
IGNORED_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    "__pycache__",
    "dist",
    "build",
    "results",
    "PageIndex_src",
    "logs",
}

# Binary and media file extensions to skip summarizing
BINARY_EXTENSIONS = {
    # Images
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp",
    # Archives
    ".zip", ".tar", ".gz", ".rar", ".7z",
    # Audio/Video
    ".mp3", ".mp4", ".avi", ".mkv", ".wav",
    # Executables/Libraries
    ".exe", ".dll", ".so", ".dylib", ".bin", ".pyc", ".pyd",
    # Documents that require special parsing
    ".pdf", ".docx", ".xlsx", ".pptx",
    # Database files
    ".db", ".sqlite",
}

# Supported text extensions for full summaries
TEXT_EXTENSIONS = {
    ".py", ".md", ".txt", ".js", ".json", ".ts", ".html", ".css",
    ".yaml", ".yml", ".ini", ".cfg", ".sh", ".bat", ".ps1",
    ".c", ".cpp", ".h", ".hpp", ".java", ".go", ".rs", ".sql",
    ".toml", ".lock", ".dockerfile", "dockerfile", ".env"
}

# Token counter using standard tiktoken (cl100k_base like GPT-4)
def count_tokens(text: str) -> int:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text, disallowed_special=()))
    except Exception:
        # Fallback to rough estimate if tiktoken fails
        return len(text.split())

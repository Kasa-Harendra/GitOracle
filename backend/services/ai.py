import json
from typing import Generator, Dict, Any, List, Optional
from langchain_ollama import ChatOllama
from backend.config import OLLAMA_BASE_URL, LARGE_MODEL, SMALL_MODEL
import backend.database as db

# Initialize models
def get_large_llm(streaming: bool = True):
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=LARGE_MODEL,
        temperature=0.2,
        streaming=streaming
    )

def get_small_llm(streaming: bool = True):
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=SMALL_MODEL,
        temperature=0.1,
        streaming=streaming
    )

class AIService:
    @staticmethod
    def explain_file_stream(filename: str, path: str, content: str, query: str = None) -> Generator[str, None, None]:
        """Explains a file's structure and behavior using llama3.2:3b."""
        llm = get_small_llm(streaming=True)
        user_query = query or "Explain this file's architecture, role, and main functions."
        
        prompt = f"""You are an expert developer. Explain the following file.

File Name: {filename}
Path: {path}
Question/Instruction: {user_query}

File Content:
```
{content}
```

Provide a high-fidelity, professional technical explanation with code examples and clear explanations."""
        
        try:
            for chunk in llm.stream(prompt):
                yield chunk.content
        except Exception as e:
            yield f"Error generating explanation: {e}"

    @staticmethod
    def generate_readme_stream(repo_name: str, structure_summary: str, custom_info: Optional[str] = None) -> Generator[str, None, None]:
        """Generates a professional README file with Mermaid diagrams using llama3.2:3b."""
        llm = get_small_llm(streaming=True)
        
        instruction_extra = ""
        if custom_info:
            instruction_extra = f"\n**User custom instructions to emphasize:**\n{custom_info}\n"
            
        prompt = f"""You are an expert developer. Generate a professional, comprehensive, and clean README.md for the repository: '{repo_name}'.
Below is the summary of the repository files and directory structure:

{structure_summary}
{instruction_extra}
Please include the following sections:
1. # {repo_name} (Overview)
2. **System Architecture**: You MUST include a beautifully detailed **Mermaid Graph flowchart** (e.g. ```mermaid graph TD ... ```) visualizing the core architectural modules, routing pipeline, or subsystem components of this codebase. Ensure labels inside brackets are quoted correctly (e.g. `["Label Name"]`).
3. Features (Bulleted list)
4. Installation (Step-by-step shell commands)
5. Environment Variables
6. Folder Structure
7. API Documentation (if applicable)
8. Technologies Used
9. Usage Instructions

Make it visually outstanding, technical, and clean. Provide ONLY the markdown contents."""
        
        try:
            for chunk in llm.stream(prompt):
                yield chunk.content
        except Exception as e:
            yield f"Error generating README: {e}"

    @staticmethod
    def summarize_pr_stream(title: str, body: str, changed_files: List[Dict[str, Any]]) -> Generator[str, None, None]:
        """Generates a detailed PR summary (changed features, potential risks, breaking changes) using llama3.2:3b."""
        llm = get_small_llm(streaming=True)
        
        files_summary = ""
        for f in changed_files[:10]:  # Limit to top 10 files to save tokens
            files_summary += f"File: {f['filename']} ({f['status']})\n"
            if f.get('patch'):
                files_summary += f"Changes:\n{f['patch'][:2000]}\n"
        
        prompt = f"""You are a senior tech lead. Provide a comprehensive, high-fidelity AI Pull Request Summary.

PR Title: {title}
PR Description: {body}

Changed Files and Diffs:
{files_summary}

Please analyze and return:
1. **Pull Request Summary**: A concise explanation of the PR's goals.
2. **Changed Functionality**: Detailed bullet points of new features or modifications.
3. **Potential Risks**: Security vulnerabilities, memory issues, or logical flaws.
4. **Breaking Changes**: Any breaking changes in APIs, interfaces, or configurations.

Be technical and precise."""
        
        try:
            for chunk in llm.stream(prompt):
                yield chunk.content
        except Exception as e:
            yield f"Error generating PR summary: {e}"

    @staticmethod
    def semantic_search(repo_id: str, query: str) -> List[Dict[str, Any]]:
        """
        Uses llama3.2:3b to semantically filter and match files against a user query.
        Loads index data straight from MongoDB.
        """
        # Load from MongoDB
        index_data = db.get_repo_index(repo_id)
        if not index_data:
            print(f"[AI Search] No DB index found for repo {repo_id}")
            return []
            
        nodes = index_data.get("nodes", {})
        
        # Collect file summaries
        file_list = []
        for nid, node in nodes.items():
            if node["type"] == "file":
                file_list.append({
                    "node_id": nid,
                    "path": node["path"],
                    "title": node["title"],
                    "summary": node["summary"][:500]  # First 500 chars for prompt space
                })
                
        # Batch items for LLM evaluation (up to 30 files for token efficiency)
        eval_list = file_list[:30]
        if not eval_list:
            return []
        
        llm = get_small_llm(streaming=False)
        
        eval_str = ""
        for item in eval_list:
            eval_str += f"ID: {item['node_id']} | Path: {item['path']}\nSummary: {item['summary']}\n\n"
            
        prompt = f"""You are a code retrieval system. Your task is to select up to 5 files from the repository that are most relevant to the search query.

Search Query: "{query}"

Available files with summaries:
{eval_str}

Return a JSON object containing a list of objects under "results" with "node_id", "path", and a short 1-sentence "match_reason".
Example response format:
```json
{{
  "results": [
    {{
      "node_id": "0002",
      "path": "src/auth.js",
      "match_reason": "Contains authentication middleware and JWT verification."
    }}
  ]
}}
```
Ensure your response is valid JSON enclosed in ```json ... ``` blocks."""

        try:
            response = llm.invoke(prompt)
            # Extract JSON
            content = response.content
            start_idx = content.find("```json")
            if start_idx != -1:
                start_idx += 7
                end_idx = content.rfind("```")
                json_content = content[start_idx:end_idx].strip()
            else:
                json_content = content.strip()
                
            data = json.loads(json_content)
            results = data.get("results", [])
            
            # Enrich results with full nodes details
            enriched_results = []
            for res in results:
                nid = res.get("node_id")
                node = nodes.get(nid)
                if node:
                    enriched_results.append({
                        "node_id": nid,
                        "path": node["path"],
                        "title": node["title"],
                        "summary": node["summary"],
                        "match_reason": res.get("match_reason", "Semantic match.")
                    })
            return enriched_results
        except Exception as e:
            print(f"[AI Search] Error during semantic search: {e}")
            # Fallback simple keyword search if LLM fails
            keyword_results = []
            words = query.lower().split()
            for item in file_list:
                match_count = 0
                for w in words:
                    if w in item["path"].lower() or w in item["summary"].lower():
                        match_count += 1
                if match_count > 0:
                    keyword_results.append({
                        "node_id": item["node_id"],
                        "path": item["path"],
                        "title": item["title"],
                        "summary": item["summary"],
                        "match_reason": f"Matches query terms: {[w for w in words if w in item['path'].lower() or w in item['summary'].lower()]}"
                    })
            return keyword_results[:5]

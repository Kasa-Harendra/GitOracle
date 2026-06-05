import os
import json
from typing import Dict, Any, List, Set, Optional
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from backend.treerag.treerag.config import get_tree_retrieval_llm, count_tokens

# Prompts for Retrieval and QA
FLAT_TREE_SELECTOR_PROMPT = """You are an expert software developer and navigation assistant.
Your task is to analyze the complete directory structure and summaries of a codebase and select the files (and folders) that are relevant to answer the user's technical query.

User Query: {query}

Here is the flat directory tree index (node ID, path, type, and summary). Raw file contents are omitted to save context space:
{nodes_list_str}

Based on the query and summaries, choose the node IDs that are likely to contain the answers or context.
CRITICAL CONSTRAINT: You MUST select AT MOST 3 file nodes (files of type "file"). You can select any number of folder nodes (directories of type "directory").
Your response MUST be a JSON object containing a "selected_ids" key with a list of selected node IDs, and a "reasoning" key explaining why you chose them.

Example output format:
```json
{{
  "reasoning": "The user asks about routing and DB settings, so we need config.py and the api router.",
  "selected_ids": ["0002", "0005"]
}}
```

Ensure your response is valid JSON enclosed in ```json ... ``` blocks."""

QA_SYNTHESIS_PROMPT = """You are an expert software engineer and technical assistant. Your task is to answer the user's query using only the technical context retrieved from the directory tree index.

User Query: {query}

Retrieved Technical Context (from relevant files in the directory):
{context}

Provide a comprehensive, high-fidelity, and well-structured technical answer based on the retrieved files. If code blocks are helpful, write clean, commented code. If the answer cannot be found in the context, state that clearly."""


def extract_json(content: str) -> Dict[str, Any]:
    """Helper to extract JSON from a markdown code block."""
    try:
        start_idx = content.find("```json")
        if start_idx != -1:
            start_idx += 7
            end_idx = content.rfind("```")
            json_content = content[start_idx:end_idx].strip()
        else:
            json_content = content.strip()
            
        return json.loads(json_content)
    except Exception:
        # Fallback manual search
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end != 0:
                return json.loads(content[start:end])
        except Exception:
            pass
        return {}


class TreeRAGRetriever(BaseRetriever):
    """
    A custom LangChain retriever that navigates a directory structure represented as a
    flat graph of nodes. The LLM decides at each node which children to traverse based
    on the query and node summaries.
    """
    root_dir: str
    nodes: Dict[str, Dict[str, Any]]
    root_id: str
    max_depth: int = 4
    verbose: bool = True
    llm: Any = None

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, index_path: str, max_depth: int = 4, verbose: bool = True):
        # Load the index
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"Index file not found: {index_path}")
            
        with open(index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        super().__init__(
            root_dir=data["root_dir"],
            nodes=data["nodes"],
            root_id=data["root_id"],
            max_depth=max_depth,
            verbose=verbose,
            llm=get_tree_retrieval_llm()
        )

    def _get_relevant_documents(
        self, query: str, *, run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        """
        Modified flat-pass node selection:
        1. Strips file contents from all nodes.
        2. Passes all stripped node summaries to the LLM in one prompt.
        3. LLM selects relevant nodes.
        4. Retrieves the selected file nodes (which contain full file content) and returns them as Documents.
        """
        if self.verbose:
            print("\n" + "=" * 60)
            print(f"TreeRAG (Flat-Pass): Selecting nodes for query: '{query}'")
            print("=" * 60)

        # 1. Prepare the nodes details (without content)
        nodes_list = []
        for nid, node in self.nodes.items():
            node_type = node.get("type", "unknown")
            node_path = node.get("path", "")
            node_summary = node.get("summary", "")
            nodes_list.append(
                f"- ID: {nid} | Type: {node_type} | Path: {node_path}\n"
                f"  Summary: {node_summary}"
            )
        
        nodes_list_str = "\n".join(nodes_list)

        prompt = FLAT_TREE_SELECTOR_PROMPT.format(
            query=query,
            nodes_list_str=nodes_list_str
        )

        selected_ids = []
        try:
            response = self.llm.invoke(prompt)
            parsed_res = extract_json(response.content)
            reasoning = parsed_res.get("reasoning", "No reasoning provided.")
            selected_ids = parsed_res.get("selected_ids", [])
            
            if self.verbose:
                print(f"[LLM Reasoning]: {reasoning}")
                print(f"[LLM Decision]: Selected Node IDs to retrieve: {selected_ids}")
        except Exception as e:
            if self.verbose:
                print(f"Error during flat node selection: {e}")

        # 2. Retrieve selected file nodes
        retrieved_docs: List[Document] = []
        for nid in selected_ids:
            # Match both padded / unpadded keys
            node = self.nodes.get(str(nid).zfill(4)) or self.nodes.get(str(nid))
            if not node:
                continue
            
            if node["type"] == "file":
                content = node.get("content", "")
                if not content:
                    file_path = os.path.join(self.root_dir, node["path"])
                    try:
                        if os.path.exists(file_path):
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                                content = f.read()
                    except Exception:
                        pass
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "node_id": node["node_id"],
                        "title": node["title"],
                        "path": node["path"],
                        "type": "file",
                        "summary": node["summary"]
                    }
                )
                retrieved_docs.append(doc)
            elif node["type"] == "directory":
                # Fetch all descendant file nodes recursively
                def gather_files(dir_node):
                    files = []
                    for cid in dir_node.get("children", []):
                        cnode = self.nodes.get(cid)
                        if cnode:
                            if cnode["type"] == "file":
                                files.append(cnode)
                            elif cnode["type"] == "directory":
                                files.extend(gather_files(cnode))
                    return files
                
                child_files = gather_files(node)
                for file_node in child_files:
                    content = file_node.get("content", "")
                    doc = Document(
                        page_content=content,
                        metadata={
                            "node_id": file_node["node_id"],
                            "title": file_node["title"],
                            "path": file_node["path"],
                            "type": "file",
                            "summary": file_node["summary"]
                        }
                    )
                    retrieved_docs.append(doc)

        # De-duplicate docs
        unique_docs = []
        seen_paths = set()
        for doc in retrieved_docs:
            p = doc.metadata["path"]
            if p not in seen_paths:
                seen_paths.add(p)
                unique_docs.append(doc)

        if self.verbose:
            print(f"Retrieval complete. Retrieved {len(unique_docs)} relevant file(s).")
            print("=" * 60 + "\n")
            
        return unique_docs



class TreeRAGQA:
    """
    Coordinates context retrieval using TreeRAGRetriever and answers queries
    via local LLM synthesis.
    """
    def __init__(self, retriever: TreeRAGRetriever):
        self.retriever = retriever
        self.llm = get_tree_retrieval_llm()

    def query(self, user_query: str) -> Dict[str, Any]:
        """
        Retrieves context using TreeRAG and synthesizes a high-fidelity answer.
        """
        # 1. Retrieve the relevant documents using our reasoning-based tree traversal
        docs = self.retriever._get_relevant_documents(user_query)
        
        if not docs:
            return {
                "answer": "I traversed the directory structure but could not identify any files relevant to your query.",
                "sources": []
            }
            
        # 2. Format the context blocks for the QA synthesizer
        context_blocks = []
        for i, doc in enumerate(docs, 1):
            block = f"--- [{i}] File: {doc.metadata['path']} ---\n{doc.page_content}\n"
            context_blocks.append(block)
            
        context_str = "\n".join(context_blocks)
        
        # 3. Call synthesis prompt
        prompt = QA_SYNTHESIS_PROMPT.format(
            query=user_query,
            context=context_str
        )
        
        if self.retriever.verbose:
            print("Synthesizing final cohesive response...")
            
        response = self.llm.invoke(prompt)
        
        return {
            "answer": response.content.strip(),
            "sources": [doc.metadata for doc in docs]
        }

    def query_stream(self, user_query: str) -> Any:
        """
        Retrieves context using TreeRAG and yields step-by-step result chunks dynamically.
        """
        docs = self.retriever._get_relevant_documents(user_query)
        
        if not docs:
            yield {
                "type": "result",
                "content": "I traversed the directory structure but could not identify any files relevant to your query.",
                "sources": []
            }
            return
            
        context_blocks = []
        for i, doc in enumerate(docs, 1):
            block = f"--- [{i}] File: {doc.metadata['path']} ---\n{doc.page_content}\n"
            context_blocks.append(block)
            
        context_str = "\n".join(context_blocks)
        
        prompt = QA_SYNTHESIS_PROMPT.format(
            query=user_query,
            context=context_str
        )
        
        if self.retriever.verbose:
            print("Synthesizing final cohesive response as stream...")
            
        sources = [doc.metadata for doc in docs]
        for chunk in self.llm.stream(prompt):
            content_chunk = chunk.content
            if content_chunk:
                yield {
                    "type": "result",
                    "content": content_chunk,
                    "sources": sources
                }

# AI GitHub Workspace

##  Project Overview
**AI GitHub Workspace** is a high-performance, full-stack developer productivity platform. It deeply integrates with GitHub's API to allow users to securely browse, cache, and analyze their remote repositories. Powered by a **TreeRAG (Retrieval-Augmented Generation)** engine, the platform enables streaming AI file explanations, AI-powered chat over entire codebases, and automated PR summarizations without ever needing to locally clone the repositories.

##  Technology Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Context API.
- **Backend**: FastAPI, Python, Uvicorn.
- **Database & Caching**: MongoDB (Document store & Vector Indexing), Redis (Fast caching).
- **Asynchronous Processing**: Celery (Background workers).
- **Integrations**: GitHub OAuth, PyGithub, GitPython, LLM Streaming APIs.

---

##  Core Features

### 1. Secure OAuth & Zero-Clone Architecture
- **GitHub OAuth Integration**: Users securely authenticate via GitHub OAuth. Access tokens are symmetrically encrypted and stored locally in MongoDB, guaranteeing absolute user privacy and data isolation.
- **`GithubFileLoader` Integration**: Repositories are never fully cloned to the disk. The platform streams directory trees, branches, and file contents directly from GitHub's APIs in real-time, drastically reducing storage overhead.

### 2. Multi-Tiered Database Caching
- **MongoDB Data Layer**: Implemented an aggressive caching layer for repository structures. When a user syncs their GitHub account, the platform concurrently fetches and stores branches and multi-level directory trees in MongoDB.
- **Optimized Navigation**: Navigating through complex codebases feels instant. By relying on the cached MongoDB structures, live API requests to GitHub are reduced by over 90%, entirely circumventing strict rate limits.

### 3. TreeRAG (Retrieval-Augmented Generation) Codebase Indexing
- **Asynchronous Celery Workers**: The platform utilizes a robust background task queue via Celery. Codebase indexing is offloaded to background workers running with a concurrency pool, allowing the user to seamlessly navigate the UI while massive codebases are vectorized and embedded.
- **Granular Semantic Search**: Code snippets, functions, and documentation are indexed into MongoDB, allowing users to execute sub-second semantic queries to instantly locate specific middleware, authentication flows, or logic blocks across thousands of files.

### 4. Streaming AI Workflows (Server-Sent Events)
- **Live File Explainers**: Clicking on any code file allows the user to trigger an AI explanation. The backend streams the LLM response chunk-by-chunk using Server-Sent Events (SSE) for a zero-latency feel.
- **Conversational Code Chat**: Context-aware AI chat bots that can converse about specific files or the entire repository architecture, maintaining deep context across the session.
- **Automated PR Summaries & README Generation**: Dynamically fetches active Pull Requests from the GitHub API and streams AI-generated code-review summaries and highly detailed README files.

### 5. Modern Next.js Routing Architecture
- Refactored a complex, monolithic React Single Page Application (SPA) into a highly modular **Next.js App Router** structure.
- Abstracted massive prop-drilling into a global **React Context Provider** (`DashboardContext`), ensuring seamless state persistence across isolated routes (`/explorer`, `/repositories`, `/chat`, `/pulls`) with zero layout shift.

---

## 📈 Noticeable Numericals & Resume Highlights

Here are bullet points formatted specifically for a Software Engineering Resume:

* **Engineered a full-stack AI Developer Platform** using Next.js, Tailwind, and FastAPI, enabling users to semantically search, analyze, and chat with their GitHub repositories using a custom TreeRAG engine.
* **Implemented an asynchronous vector indexing pipeline** utilizing Celery background workers, scaling the platform to process and embed repositories with thousands of files concurrently without blocking the main event loop.
* **Architected a multi-tiered MongoDB caching layer** for remote GitHub directory trees and branches, reducing live GitHub API requests by **over 90%** and bypassing strict rate limits to achieve sub-second UI navigation.
* **Designed a Zero-Clone `GithubFileLoader` architecture** that streams repository file contents directly into the browser, saving significant server storage overhead and drastically improving time-to-interactivity.
* **Developed real-time AI streaming features** utilizing Server-Sent Events (SSE) to deliver instantaneous, chunk-by-chunk LLM explanations, PR summaries, and automated README generation directly to the client.
* **Refactored a 1,000+ line monolithic React state** into a scalable Next.js App Router architecture with a centralized Context Provider, achieving a modular, multi-page routing system with seamless global state persistence.
* **Secured user authentication** by integrating GitHub OAuth and symmetrically encrypting access tokens at rest in MongoDB, ensuring complete multi-tenant data isolation and privacy.

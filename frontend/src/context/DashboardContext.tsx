"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export const DashboardContext = createContext<any>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  
  // State variables
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("mock-token");
  
  // GitHub profile actual repositories
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  
  // Cloned repositories saved in database
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>("main");
  const [fileTree, setFileTree] = useState<any[]>([]);
  
  // Keep track of which folders in the file tree are expanded
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  // RAG Indexing Configurations
  const [cloneUrl, setCloneUrl] = useState<string>("https://github.com/langchain-ai/langchain.git");
  const [cloning, setCloning] = useState<boolean>(false);
  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexStatus, setIndexStatus] = useState<string>("RAG Indexing Active!");
  const [indexingLogs, setIndexingLogs] = useState<any[]>([]);
  const [allowedExtensions, setAllowedExtensions] = useState<string>("py, js, ts, json, md, html, css");
  const [customIgnoredDirs, setCustomIgnoredDirs] = useState<string>("tests, docs, build, dist");


  
  // Collapsible Side Panels States (100% reactive)
  const [isRepoPanelOpen, setIsRepoPanelOpen] = useState<boolean>(true);
  const [isTreePanelOpen, setIsTreePanelOpen] = useState<boolean>(true);
  const [isFileChatOpen, setIsFileChatOpen] = useState<boolean>(true);
  const [isLeftNavOpen, setIsLeftNavOpen] = useState<boolean>(true);
  const [leftNavWidth, setLeftNavWidth] = useState<number>(240);



  // Main TreeRAG Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>("What does this repository do?");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [traceActive, setTraceActive] = useState<boolean>(false);

  // Code Explorer File Viewer & File Chat (Granular focus)
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [selectedFileContent, setSelectedFileContent] = useState<string>("");
  const [fileExplainText, setFileExplainText] = useState<string>("");
  const [fileExplainLoading, setFileExplainLoading] = useState<boolean>(false);
  const [fileChatMessages, setFileChatMessages] = useState<any[]>([]);
  const [fileChatInput, setFileChatInput] = useState<string>("Review this file and highlight potential bugs.");
  const [fileChatLoading, setFileChatLoading] = useState<boolean>(false);

  // README Generator
  const [readmePrompt, setReadmePrompt] = useState<string>("Make sure to outline clean deploy scripts and a flowchart of the routing middleware.");
  const [generatedReadme, setGeneratedReadme] = useState<string>("");
  const [readmeLoading, setReadmeLoading] = useState<boolean>(false);

  // Pull Requests
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [prDetails, setPRDetails] = useState<any>(null);
  const [prSummary, setPRSummary] = useState<string>("");
  const [prSummaryLoading, setPrSummaryLoading] = useState<boolean>(false);

  // Dialog State
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const traceEndRef = useRef<HTMLDivElement>(null);
  const fileChatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const scrollTraceToBottom = () => {
    traceEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startResizingLeftNav = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = leftNavWidth;
    const startX = mouseDownEvent.clientX;
    
    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 64 && newWidth <= 450) {
        if (newWidth < 90) {
          setIsLeftNavOpen(false);
        } else {
          setIsLeftNavOpen(true);
          setLeftNavWidth(newWidth);
        }
      }
    };
    
    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
    
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const scrollFileChatToBottom = () => {
    fileChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "user") {
        scrollToBottom();
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollTraceToBottom();
  }, [traceLogs]);

  useEffect(() => {
    scrollFileChatToBottom();
  }, [fileChatMessages]);

  // Load session & user profile data
  useEffect(() => {
    const sessionToken = localStorage.getItem("session_token");
    const userProfile = localStorage.getItem("user_profile");

    if (!sessionToken || !userProfile) {
      router.push("/");
      return;
    }

    setToken(sessionToken);
    setUser(JSON.parse(userProfile));
    
    // Initial fetches
    fetchGithubRepos(sessionToken, false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_profile");
    router.push("/");
  };

  const fetchRepos = async (tok: string) => {
    // Deprecated, using fetchGithubRepos for everything
  };

  const fetchGithubRepos = async (tok: string, forceSync: boolean = false) => {
    setGithubLoading(true);
    try {
      const url = forceSync ? "http://127.0.0.1:8000/api/repos?sync=true" : "http://127.0.0.1:8000/api/repos";
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${tok}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGithubRepos(data);
        setRepos(data);
        
        // If forceSync is true, optionally re-select the current repo to fetch its newly cached tree
        if (forceSync && selectedRepo) {
           selectRepository(selectedRepo, tok);
        }
      }
    } catch (err) {
      console.error("Error fetching GitHub repos:", err);
    } finally {
      setGithubLoading(false);
    }
  };

  const selectRepository = async (repo: any, tok: string = token) => {
    if (!repo) {
      setSelectedRepo(null);
      return;
    }
    const sessionToken = tok || token;
    let dbRepo = repo;

    setSelectedRepo(dbRepo);
    setActiveBranch(dbRepo.active_branch || "main");
    setFileTree([]);
    setSelectedFilePath("");
    setSelectedFileContent("");
    setFileExplainText("");
    setFileChatMessages([]);
    setGeneratedReadme("");
    setPRDetails(null);
    setSelectedPR(null);
    setPRSummary("");
    setMessages([]);
    setTraceLogs([]);
    setIsRepoPanelOpen(true);
    
    // Get repo structures & branch listings
    try {
      // Fetch live details (such as updated stargazers count)
      fetch(`http://127.0.0.1:8000/api/repos/${dbRepo.id}`, {
        headers: { "Authorization": `Bearer ${sessionToken}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(updatedRepo => {
        if (updatedRepo) {
          setSelectedRepo(updatedRepo);
          setRepos(prev => prev.map(r => r.id === updatedRepo.id ? updatedRepo : r));
        }
      })
      .catch(err => console.error("Error fetching live repo details:", err));

      const branchToUse = dbRepo.active_branch || "main";
      const treeRes = await fetch(`http://127.0.0.1:8000/api/repos/${dbRepo.id}/tree?branch=${encodeURIComponent(branchToUse)}`, {
        headers: { "Authorization": `Bearer ${sessionToken}` }
      });
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setFileTree(treeData);
      }

      const branchRes = await fetch(`http://127.0.0.1:8000/api/repos/${dbRepo.id}/branches`, {
        headers: { "Authorization": `Bearer ${sessionToken}` }
      });
      if (branchRes.ok) {
        const branchesData = await branchRes.json();
        setBranches(branchesData);
      }

      const prRes = await fetch(`http://127.0.0.1:8000/api/repos/${dbRepo.id}/pulls`, {
        headers: { "Authorization": `Bearer ${sessionToken}` }
      });
      if (prRes.ok) {
        const prsData = await prRes.json();
        setPullRequests(prsData);
      }
    } catch (err) {
      console.error("Error loading repo details:", err);
    }
  };

  // Clone Repo Handler
  const handleCloneRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Repository cloning has been removed. Repositories are now dynamically fetched from your GitHub account.");
    setShowCloneModal(false);
  };

  // Index Repo Handler (with custom filters saved directly in MongoDB)
  const handleIndexRepo = async () => {
    if (!selectedRepo) return;
    setIndexing(true);
    setIndexStatus("Initializing background indexing pipeline...");
    setIndexingLogs([{ log_line: "Establishing connection to TreeRAG server task...", timestamp: Date.now() / 1000 }]);
    
    const file_extensions = allowedExtensions.split(",").map(e => e.trim()).filter(e => e.length > 0);
    const ignored_paths = customIgnoredDirs.split(",").map(p => p.trim()).filter(p => p.length > 0);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          concurrency: 4,
          file_extensions,
          ignored_paths
        })
      });
      if (res.ok) {
        setIndexStatus("RAG Indexing Active!");
        
        let pollCount = 0;
        const intervalId = setInterval(async () => {
          try {
            const logsRes = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/indexing/logs`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (logsRes.ok) {
              const logsData = await logsRes.json();
              setIndexingLogs(logsData);
              
              const hasFinished = logsData.some((log: any) => 
                log.log_line.includes("indexed successfully!") || 
                log.log_line.includes("Indexing completed successfully!")
              );
              const hasFailed = logsData.some((log: any) => log.log_line.includes("ERROR:"));
              
              pollCount++;
              if (hasFinished || hasFailed || pollCount > 100) {
                clearInterval(intervalId);
                setIndexing(false);
                setIndexStatus("");
                fetchGithubRepos(token, false);
                // Re-select repo to fetch new tree
                const refreshedRepo = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}`, {
                  headers: { "Authorization": `Bearer ${token}` }
                });
                if (refreshedRepo.ok) {
                  const refreshedData = await refreshedRepo.json();
                  selectRepository(refreshedData);
                }
              }
            }
          } catch (err) {
            console.error("Error polling indexing logs:", err);
          }
        }, 1500);
      } else {
        setIndexing(false);
        setIndexStatus("");
        alert("Failed to start indexing.");
      }
    } catch (err) {
      alert("Indexing error: " + err);
      setIndexing(false);
      setIndexStatus("");
    }
  };

  // Checkout Branch Handler
  const handleBranchSwitch = async (branchName: string) => {
    if (!selectedRepo) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/checkout?branch=${branchName}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveBranch(branchName);
        const updatedRepo = { ...selectedRepo, active_branch: branchName };
        selectRepository(updatedRepo);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Read File Handler (Loads content using GitFileLoader backend API routes)
  const handleFileSelect = async (filePath: string) => {
    if (!selectedRepo) return;
    setSelectedFilePath(filePath);
    setSelectedFileContent("Loading file content securely from GitHub API using GithubFileLoader...");
    setFileExplainText("");
    setFileChatMessages([]);
    router.push("/explorer");
    
    try {
      const branchToUse = activeBranch || selectedRepo.active_branch || "main";
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/file?path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branchToUse)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedFileContent(data.content);
      }
    } catch (err) {
      setSelectedFileContent("Failed to read file contents.");
    }
  };

  // AI Explain File Handler (Streaming explanation)
  const handleExplainFile = async () => {
    if (!selectedRepo || !selectedFilePath) return;
    setFileExplainLoading(true);
    setFileExplainText("");
    try {
      const branchToUse = activeBranch || selectedRepo.active_branch || "main";
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/explain?path=${encodeURIComponent(selectedFilePath)}&branch=${encodeURIComponent(branchToUse)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "content") {
                setFileExplainText(prev => prev + data.content);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFileExplainLoading(false);
    }
  };

  // File Specific Streaming AI Chat Handler
  const handleSendFileChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !selectedFilePath || !fileChatInput.trim() || fileChatLoading) return;

    const userQuery = fileChatInput.trim();
    setFileChatInput("");
    setFileChatLoading(true);

    const userMsgId = `user-${Date.now()}-${Math.random()}`;
    const newUserMsg = { id: userMsgId, sender: "user", content: userQuery, timestamp: Date.now() };
    setFileChatMessages(prev => [...prev, newUserMsg]);

    const botMsgId = `bot-${Date.now()}-${Math.random()}`;
    const newBotMsg = { id: botMsgId, sender: "bot", content: "", timestamp: Date.now() };
    setFileChatMessages(prev => [...prev, newBotMsg]);

    try {
      const branchToUse = activeBranch || selectedRepo.active_branch || "main";
      const url = `http://127.0.0.1:8000/api/repos/${selectedRepo.id}/explain?path=${encodeURIComponent(selectedFilePath)}&question=${encodeURIComponent(userQuery)}&branch=${encodeURIComponent(branchToUse)}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setFileChatMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: "Error connecting to File Chat API." } : m));
        return;
      }

      let completeAnswer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "content") {
                completeAnswer += data.content;
                setFileChatMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: completeAnswer } : m));
              } else if (data.type === "error") {
                setFileChatMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: `Error: ${data.content}` } : m));
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setFileChatMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: `Connection failed: ${err.message}` } : m));
    } finally {
      setFileChatLoading(false);
    }
  };

  // README Generator Handler (Streaming from MongoDB index + live edits!)
  const handleGenerateReadme = async () => {
    if (!selectedRepo) return;
    setReadmeLoading(true);
    setGeneratedReadme("");
    try {
      const url = `http://127.0.0.1:8000/api/repos/${selectedRepo.id}/readme?custom_info=${encodeURIComponent(readmePrompt)}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "content") {
                setGeneratedReadme(prev => prev + data.content);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReadmeLoading(false);
    }
  };

  // PR Details Loader
  const handlePRSelect = async (pr: any) => {
    setSelectedPR(pr);
    setPRDetails(null);
    setPRSummary("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/pulls/${pr.number}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const details = await res.json();
        setPRDetails(details);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PR AI Summary Generator (Streaming)
  const handlePRSummary = async () => {
    if (!selectedRepo || !selectedPR) return;
    setPrSummaryLoading(true);
    setPRSummary("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/pulls/${selectedPR.number}/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "content") {
                setPRSummary(prev => prev + data.content);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPrSummaryLoading(false);
    }
  };

  // TreeRAG Streaming Main Chat Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !chatInput.trim() || chatLoading) return;

    const userQuery = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    
    setTraceLogs([]);
    setTraceActive(true);

    const userMsgId = `user-${Date.now()}-${Math.random()}`;
    const newUserMsg = { id: userMsgId, sender: "user", content: userQuery, timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]);

    const botMsgId = `bot-${Date.now()}-${Math.random()}`;
    const newBotMsg = { id: botMsgId, sender: "bot", content: "", timestamp: Date.now(), sources: [] };
    setMessages(prev => [...prev, newBotMsg]);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repos/${selectedRepo.id}/chat?query=${encodeURIComponent(userQuery)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: "Error connecting to TreeRAG endpoint." } : m));
        return;
      }

      let completeAnswer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const event = JSON.parse(line.substring(6));
              
              if (event.type === "trace") {
                setTraceLogs(prev => [...prev, event.content]);
              } else if (event.type === "result") {
                completeAnswer += event.content;
                setMessages(prev => prev.map(m => m.id === botMsgId ? { 
                  ...m, 
                  content: completeAnswer, 
                  sources: event.sources || [] 
                } : m));
              } else if (event.type === "error") {
                setMessages(prev => prev.map(m => m.id === botMsgId ? { 
                  ...m, 
                  content: `Error: ${event.content}` 
                } : m));
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.timestamp === botMsgId ? { ...m, content: `Connection error: ${err.message}` } : m));
    } finally {
      setChatLoading(false);
    }
  };

  const totalStarsCount = githubRepos.reduce((acc: any, repo: any) => acc + (repo.stars || 0), 0);
  const totalReposCount = githubRepos.length;
  const publicReposCount = githubRepos.filter((r: any) => !r.is_private).length;
  const privateReposCount = githubRepos.filter((r: any) => r.is_private).length;

  const value = {
    totalStarsCount, totalReposCount, publicReposCount, privateReposCount,
    user, setUser, token, setToken, githubRepos, setGithubRepos, githubLoading, setGithubLoading,
    repos, setRepos, selectedRepo, setSelectedRepo, branches, setBranches, activeBranch, setActiveBranch,
    fileTree, setFileTree, expandedFolders, setExpandedFolders, toggleFolder, cloneUrl, setCloneUrl,
    cloning, setCloning, indexing, setIndexing, indexStatus, setIndexStatus, indexingLogs, setIndexingLogs,
    allowedExtensions, setAllowedExtensions, customIgnoredDirs, setCustomIgnoredDirs,
    isRepoPanelOpen, setIsRepoPanelOpen, isTreePanelOpen, setIsTreePanelOpen, isFileChatOpen, setIsFileChatOpen,
    isLeftNavOpen, setIsLeftNavOpen, leftNavWidth, setLeftNavWidth, messages, setMessages, chatInput, setChatInput,
    chatLoading, setChatLoading, traceLogs, setTraceLogs, traceActive, setTraceActive, selectedFilePath, setSelectedFilePath,
    selectedFileContent, setSelectedFileContent, fileExplainText, setFileExplainText, fileExplainLoading, setFileExplainLoading,
    fileChatMessages, setFileChatMessages, fileChatInput, setFileChatInput, fileChatLoading, setFileChatLoading,
    readmePrompt, setReadmePrompt, generatedReadme, setGeneratedReadme, readmeLoading, setReadmeLoading, pullRequests,
    setPullRequests, selectedPR, setSelectedPR, prDetails, setPRDetails, prSummary, setPRSummary, prSummaryLoading, setPrSummaryLoading,
    showCloneModal, setShowCloneModal,
    messagesEndRef, traceEndRef, fileChatEndRef, startResizingLeftNav, scrollFileChatToBottom, scrollToBottom, scrollTraceToBottom,
    handleLogout, fetchRepos, fetchGithubRepos, selectRepository, handleCloneRepo, handleIndexRepo, handleBranchSwitch,
    handleFileSelect, handleExplainFile, handleSendFileChatMessage, handleGenerateReadme, handlePRSelect, handlePRSummary,
    handleSendMessage
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

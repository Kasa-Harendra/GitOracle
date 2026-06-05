"use client";

import React from "react";
import { 
  Folder, FileCode, ChevronDown, ChevronRight, MessageSquare, 
  X, Bot, Loader2, Send, ZoomIn, ZoomOut
} from "lucide-react";
import { parseMarkdownToReact } from "./shared";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeExplorerProps {
  githubRepos: any[];
  repos: any[];
  selectedRepo: any;
  selectRepository: (repo: any) => void;
  isFileChatOpen: boolean;
  setIsFileChatOpen: (open: boolean) => void;
  isTreePanelOpen: boolean;
  setIsTreePanelOpen: (open: boolean) => void;
  selectedFilePath: string;
  selectedFileContent: string;
  handleExplainFile: () => void;
  fileExplainLoading: boolean;
  fileChatMessages: any[];
  fileChatInput: string;
  setFileChatInput: (val: string) => void;
  handleSendFileChatMessage: (e: React.FormEvent) => void;
  fileChatLoading: boolean;
  fileTree: any[];
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  handleFileSelect: (path: string) => void;
  fileChatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
  githubRepos,
  repos,
  selectedRepo,
  selectRepository,
  isFileChatOpen,
  setIsFileChatOpen,
  isTreePanelOpen,
  setIsTreePanelOpen,
  selectedFilePath,
  selectedFileContent,
  handleExplainFile,
  fileExplainLoading,
  fileChatMessages,
  fileChatInput,
  setFileChatInput,
  handleSendFileChatMessage,
  fileChatLoading,
  fileTree,
  expandedFolders,
  toggleFolder,
  handleFileSelect,
  fileChatEndRef
}) => {
  const [treeWidth, setTreeWidth] = React.useState<number>(288);
  const [fileChatWidth, setFileChatWidth] = React.useState<number>(320);

  const [fontSize, setFontSize] = React.useState<number>(12);
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      txt: "text",
      sh: "bash",
    };
    return ext && map[ext] ? map[ext] : "text";
  };
  const startResizingTree = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = treeWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Tree explorer on the right: Dragging left (negative delta) increases width
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth >= 180 && newWidth <= 450) {
        setTreeWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const startResizingFileChat = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = fileChatWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // File chat on the right: Dragging left (negative delta) increases width
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth >= 240 && newWidth <= 550) {
        setFileChatWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  // Recursive nested directory structure renderer
  const renderTree = (nodes: any[]) => {

    return (
      <ul className="pl-3.5 space-y-1 border-l border-[#30363D]/40 font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
        {nodes.map((node) => {
          const isDir = node.type === "directory";
          const isExpanded = !!expandedFolders[node.path];
          return (
            <li key={node.path} className="text-xs">
              {isDir ? (
                <div>
                  <span 
                    onClick={() => toggleFolder(node.path)}
                    className="flex items-center gap-1.5 text-[#C9D1D9] font-medium py-0.5 hover:text-white cursor-pointer select-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-[#8B949E] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-[#8B949E] shrink-0" />
                    )}
                    <Folder className="w-3.5 h-3.5 text-[#8B949E] shrink-0 fill-[#8B949E]/10" />
                    <span className="truncate">{node.name}</span>
                  </span>
                  {isExpanded && node.children && renderTree(node.children)}
                </div>
              ) : (
                <button
                  onClick={() => handleFileSelect(node.path)}
                  className={`flex items-center gap-1.5 w-full text-left py-0.5 hover:text-white transition-all select-none text-[11px] ${
                    selectedFilePath === node.path ? "text-cyan-400 font-semibold" : "text-[#8B949E]"
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  title={node.path}
                  data-path={node.path}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{node.name}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0D1117] animate-fade-in">
      {/* Header Selector */}
      <div className="h-14 border-b border-[#30363D] bg-[#161B22] px-6 flex items-center justify-between shrink-0 font-sans z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Explore Repository:</span>
          <select
            value={selectedRepo ? selectedRepo.id : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                selectRepository(null);
                return;
              }
              
              if (val.startsWith("sync:")) {
                const parts = val.split(":");
                const owner = parts[1];
                const name = parts[2];
                const clone_url = decodeURIComponent(parts[3]);
                selectRepository({ owner, name, clone_url });
              } else {
                const selected = repos.find(r => r.id === val);
                if (selected) selectRepository(selected);
              }
            }}
            className="bg-[#0D1117] border border-[#30363D] hover:border-[#8b949e]/30 px-3 py-1.5 rounded-lg text-xs text-[#C9D1D9] focus:outline-none focus:border-[#2F81F7] font-mono cursor-pointer transition-all"
          >
            <option value="">-- Choose Repository --</option>
            {githubRepos.map((r: any) => {
              const dbR = repos.find(dr => dr.owner === r.owner && dr.name === r.name);
              const val = dbR ? dbR.id : `sync:${r.owner}:${r.name}:${encodeURIComponent(r.clone_url)}`;
              return (
                <option key={val} value={val}>
                  {r.owner}/{r.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Collapsible panels toggle toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFileChatOpen(!isFileChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isFileChatOpen ? "bg-purple-950/20 border-purple-800/40 text-purple-400" : "bg-[#21262d] border-[#30363D] text-[#8B949E]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {/* <span>File Chat {isFileChatOpen ? "Open" : "Closed"}</span> */}
          </button>

          <button
            onClick={() => setIsTreePanelOpen(!isTreePanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isTreePanelOpen ? "bg-pink-950/20 border-pink-800/40 text-pink-400" : "bg-[#21262d] border-[#30363D] text-[#8B949E]"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            {/* <span>File Explorer {isTreePanelOpen ? "Open" : "Closed"}</span> */}
          </button>
        </div>
      </div>

      {selectedRepo ? (
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left Column/Main viewport: Code editor pane */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#0d1117]">
            {selectedFilePath ? (
              <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                {/* Filename toolbar */}
                <div className="h-10 px-4 border-b border-[#30363D] bg-[#161B22] flex items-center justify-between shrink-0 font-sans">
                  <div className="flex items-center gap-1 truncate">
                    <FileCode className="w-4 h-4 text-[#2F81F7] shrink-0" />
                    <span className="text-xs font-mono text-[#C9D1D9] truncate" title={selectedFilePath}>{selectedFilePath}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handleExplainFile}
                      disabled={fileExplainLoading}
                      className={`flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1 rounded transition-all cursor-pointer`}
                    >
                      {fileExplainLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                      Explain File
                    </button>
                    <button
                      onClick={() => setFontSize((prev) => Math.max(prev - 2, 8))}
                      className="flex items-center text-[#8B949E] hover:text-white p-1 rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setFontSize((prev) => Math.min(prev + 2, 24))}
                      className="flex items-center text-[#8B949E] hover:text-white p-1 rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-[#0b0e14]">
                  <div className="select-text text-[12px] font-mono whitespace-pre tab-size-4 bg-[#0b0e14]" style={{ fontSize: `${fontSize}px` }}>
                    <SyntaxHighlighter
                      language={getLanguage(selectedFilePath)}
                      style={atomDark}
                      customStyle={{ background: "transparent", margin: 0, padding: 0 }}
                      wrapLines
                      showLineNumbers={false}
                    >
                      {selectedFileContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-[#8B949E] font-sans">
                <FileCode className="w-12 h-12 text-[#30363D] mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Select a code file to explore</h3>
                {/* <p className="text-xs text-[#8B949E] mt-1 max-w-[280px] leading-relaxed">
                  Please expand the Collapsible File Explorer tree on the right panel and select any file name to fetch its contents using `GithubFileLoader`.
                </p> */}
              </div>
            )}
          </div>

          {/* Right Collapsible Panel 1: AI File-Specific Chat panel */}
          {isFileChatOpen && selectedFilePath && (
            <aside 
              style={{ width: `${fileChatWidth}px` }}
              className="border-l border-[#30363D] bg-[#161B22] flex flex-col shrink-0 overflow-hidden animate-fade-in relative select-none"
            >
              {/* Draggable border resize handle */}
              <div 
                onMouseDown={startResizingFileChat}
                className="absolute top-0 left-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
              />

              <div className="h-10 px-4 border-b border-[#30363D] flex items-center justify-between bg-[#1f242d]/30 shrink-0">

                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-3.5 h-3.5" />
                  AI File Chat
                </span>
                <button
                  onClick={() => setIsFileChatOpen(false)}
                  className="text-[#8B949E] hover:text-white cursor-pointer"
                  title="Hide Chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* File Chat messages checklist */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs bg-[#0D1117]/30 scrollbar-thin">
                {fileChatMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4 text-[#8B949E]">
                    <Bot className="w-8 h-8 text-[#30363D] mb-2 animate-bounce" />
                    <p className="font-semibold text-white text-[11px] mb-1">Chat specifically about this file</p>
                    <p className="text-[10px] leading-normal">Ask instructions, clarify behaviors, or request bug patches focusing exclusively on `{selectedFilePath.split("/").pop()}`.</p>
                  </div>
                ) : (
                  fileChatMessages.map((m, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-lg p-2.5 border leading-relaxed ${
                        m.sender === "user" ? "bg-[#21262d] border-[#30363D] text-[#F0F6FC]" : "bg-[#161B22] border-[#30363D] text-[#C9D1D9]"
                      }`}>
                        {m.sender === "bot" ? (
                          <div className="font-sans text-xs space-y-1">
                            {parseMarkdownToReact(m.content || "Thinking and analyzing code...")}
                          </div>
                        ) : (
                          <p className="font-mono text-[11px] whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={fileChatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendFileChatMessage} className="p-3 border-t border-[#30363D] bg-[#161B22] shrink-0 font-sans">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask about this code..."
                    value={fileChatInput}
                    onChange={(e) => setFileChatInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] focus:border-purple-500 focus:outline-none text-xs text-[#F0F6FC] placeholder-[#484f58]"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-1 right-1 px-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </aside>
          )}

          {/* Right Collapsible Panel 2: Collapsible file explorer tree panel */}
          {isTreePanelOpen && (
            <aside 
              style={{ width: `${treeWidth}px` }}
              className="border-l border-[#30363D] bg-[#161B22] flex flex-col shrink-0 overflow-hidden animate-fade-in relative select-none"
            >
              {/* Draggable border resize handle */}
              <div 
                onMouseDown={startResizingTree}
                className="absolute top-0 left-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
              />

              <div className="h-10 px-4 border-b border-[#30363D] flex items-center justify-between bg-[#1f242d]/30 shrink-0 font-sans">

                <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" />
                  File Explorer
                </span>
                <button
                  onClick={() => setIsTreePanelOpen(false)}
                  className="text-[#8B949E] hover:text-white cursor-pointer"
                  title="Hide Tree"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {fileTree.length > 0 ? renderTree(fileTree) : (
                  <div className="text-[11px] text-[#8B949E] text-center py-4">
                    No directory tree structures found.
                  </div>
                )}
              </div>
            </aside>
          )}

        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-[460px] mx-auto font-sans">
          <Folder className="w-14 h-14 text-pink-400/40 mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-white">Load Code Explorer</h3>
          <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
            Please select an active repository from the top selector dropdown to dynamically load its structures in the collapsible sidebar.
          </p>
        </div>
      )}
    </div>
  );
};

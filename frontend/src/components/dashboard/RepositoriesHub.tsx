"use client";

import React, { useContext } from "react";
import { DashboardContext } from "@/context/DashboardContext";
import { 
  RefreshCw, Loader2, Database, X, Star, GitBranch, 
  Folder, Sliders, Sparkles, Terminal, FileCode, ChevronDown, ChevronRight
} from "lucide-react";

interface RepositoriesHubProps {
  githubRepos: any[];
  githubLoading: boolean;
  fetchGithubRepos: (tok: string, forceSync?: boolean) => void;
  token: string;
  selectedRepo: any;
  selectRepository: (repo: any) => void;
  repos: any[];
  isRepoPanelOpen: boolean;
  setIsRepoPanelOpen: (open: boolean) => void;
  activeBranch: string;
  branches: string[];
  handleBranchSwitch: (branchName: string) => void;
  fileTree: any[];
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  allowedExtensions: string;
  setAllowedExtensions: (exts: string) => void;
  handleIndexRepo: () => void;
  handleDeleteIndex: () => void;
  indexing: boolean;
  indexingLogs: any[];
  selectedFilePath: string;
  handleFileSelect: (path: string) => void;
}

export const RepositoriesHub: React.FC<RepositoriesHubProps> = ({
  githubRepos,
  githubLoading,
  fetchGithubRepos,
  token,
  selectedRepo,
  selectRepository,
  repos,
  isRepoPanelOpen,
  setIsRepoPanelOpen,
  activeBranch,
  branches,
  handleBranchSwitch,
  fileTree,
  expandedFolders,
  toggleFolder,
  allowedExtensions,
  setAllowedExtensions,
  handleIndexRepo,
  handleDeleteIndex,
  indexing,
  indexingLogs,
  selectedFilePath,
  handleFileSelect
}) => {
  const { 
    indexMode,
    setIndexMode,
    selectedFilesForIndex,
    toggleFileSelection,
    toggleFolderSelection
  } = useContext(DashboardContext) as any;

  const [panelWidth, setPanelWidth] = React.useState<number>(380);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = panelWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Dragging left (negative clientX delta) increases the width
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth >= 280 && newWidth <= 650) {
        setPanelWidth(newWidth);
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
                  <div className="flex items-center gap-1.5 py-0.5">
                    {indexMode === "files" && (
                      <input 
                        type="checkbox" 
                        onChange={() => toggleFolderSelection(node)} 
                        checked={node.children && node.children.length > 0 && (() => {
                          const allDescendants: string[] = [];
                          const collect = (n: any) => {
                            if (n.type === "file" || n.type === "blob") allDescendants.push(n.path);
                            else if (n.children) n.children.forEach(collect);
                          };
                          collect(node);
                          return allDescendants.length > 0 && allDescendants.some((p: string) => selectedFilesForIndex.includes(p));
                        })()}
                        className="w-3 h-3 cursor-pointer accent-[#238636]" 
                      />
                    )}
                    <span 
                      onClick={() => toggleFolder(node.path)}
                      className="flex items-center gap-1.5 text-[#C9D1D9] font-medium hover:text-white cursor-pointer select-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-[#8B949E] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[#8B949E] shrink-0" />
                      )}
                      <Folder className="w-3.5 h-3.5 text-[#8B949E] shrink-0 fill-[#8B949E]/10" />
                      <span className="truncate">{node.name}</span>
                    </span>
                  </div>
                  {isExpanded && node.children && renderTree(node.children)}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 w-full py-0.5">
                  {indexMode === "files" && (
                    <input 
                      type="checkbox" 
                      checked={selectedFilesForIndex.includes(node.path)} 
                      onChange={() => toggleFileSelection(node.path)} 
                      className="w-3 h-3 cursor-pointer accent-[#238636]" 
                    />
                  )}
                  <button
                    onClick={() => handleFileSelect(node.path)}
                    className={`flex items-center gap-1.5 w-full text-left hover:text-white transition-all select-none text-[11px] ${
                      selectedFilePath === node.path ? "text-cyan-400 font-semibold" : "text-[#8B949E]"
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    title={node.path}
                    data-path={node.path}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{node.name}</span>
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0D1117] animate-fade-in font-sans">
      
      {/* Left pane: Repos list grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#8B949E]">Synced Profile Repositories</h3>
          <button
            onClick={() => fetchGithubRepos(token, true)}
            disabled={githubLoading}
            className="flex items-center gap-1 bg-[#21262d] border border-[#30363D] px-2.5 py-1 rounded text-[#8B949E] hover:text-white hover:bg-[#30363d] text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${githubLoading ? "animate-spin" : ""}`} />
            Sync GitHub Repos
          </button>
        </div>

        {githubLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#2EA043] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#8B949E] font-mono">Fetching repos from API...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {githubRepos.map(repo => {
              const isSelected = selectedRepo?.owner === repo.owner && selectedRepo?.name === repo.name;
              
              return (
                <div
                  key={repo.id}
                  onClick={() => selectRepository(repo)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-[155px] ${
                    isSelected 
                      ? "bg-[#161B22] border-[#2F81F7] shadow-lg shadow-[#2F81F7]/5" 
                      : "bg-[#161B22]/60 border-[#30363D] hover:bg-[#161B22] hover:border-[#8b949e]/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-xs text-white truncate max-w-[70%]">{repo.name}</h4>
                      <span className="flex items-center gap-1 text-[9px] font-mono text-[#8B949E] px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D]">
                        {repo.is_private ? "Private" : "Public"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B949E] line-clamp-2 mt-1">{repo.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#30363D]/40">
                    <span className="text-[10px] text-[#8B949E] font-mono flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500/20" /> {repo.stars ?? 0}
                    </span>
                    {repo.last_indexed > 0 && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        repo.index_config?.index_type === "partial" || repo.index_config?.selected_files 
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {repo.index_config?.index_type === "partial" || repo.index_config?.selected_files ? "Partially Indexed" : "Indexed"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right collapsible side panel: Repository details */}
      {isRepoPanelOpen && selectedRepo && (
        <aside 
          style={{ width: `${panelWidth}px` }}
          className="border-l border-[#30363D] bg-[#161B22] flex flex-col shrink-0 overflow-hidden animate-fade-in relative select-none"
        >
          {/* Draggable border resize handle */}
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 left-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
          />

          {/* Header */}
          <div className="p-4 border-b border-[#30363D] flex items-center justify-between bg-[#1f242d]/30 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Repository Details
            </span>
            <button
              onClick={() => setIsRepoPanelOpen(false)}
              className="p-1 hover:bg-[#30363D] rounded text-[#8B949E] hover:text-white transition-all cursor-pointer"
              title="Collapse Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2 font-mono truncate">
                {selectedRepo.owner}/{selectedRepo.name}
              </h4>
              <p className="text-xs text-[#8B949E] mt-1.5 font-sans leading-relaxed">{selectedRepo.description}</p>
            </div>

            {/* Stats List */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-left flex flex-col justify-between">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E]">Stats</span>
                <span className="text-xs font-bold text-white mt-1 font-mono flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" /> {selectedRepo.stars ?? 0}
                </span>
              </div>
              <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-left flex flex-col justify-between">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E]">Status</span>
                <div className="mt-1 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#2ea043] font-mono flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> {activeBranch}
                  </span>
                  {selectedRepo.last_indexed > 0 && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit ${
                      selectedRepo.index_config?.index_type === "partial" || selectedRepo.index_config?.selected_files 
                        ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {selectedRepo.index_config?.index_type === "partial" || selectedRepo.index_config?.selected_files ? "Partially Indexed" : "Indexed"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Branch switcher dropdown listing names */}
            <div className="space-y-1.5 font-sans">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E]">Switches Active Branch ({branches.length} total)</span>
              <select
                value={activeBranch}
                onChange={(e) => handleBranchSwitch(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] hover:border-[#8b949e]/30 px-3 py-2 rounded-lg text-xs font-mono text-[#C9D1D9] focus:outline-none focus:border-[#2F81F7] cursor-pointer transition-all"
              >
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Directory tree explorer view in repo panel */}
            <div className="space-y-2 pt-2 border-t border-[#30363D]/60 flex-1 flex flex-col min-h-0">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#2F81F7]" />
                Directory tree structure
              </span>
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D] max-h-56 overflow-y-auto scrollbar-thin">
                {fileTree.length > 0 ? renderTree(fileTree) : (
                  <div className="text-[11px] text-[#8B949E] text-center py-4">
                    No files indexed in tree list.
                  </div>
                )}
              </div>
            </div>

            {/* Quick RAG Index Panel */}
            <div className="pt-4 border-t border-[#30363D]/60 space-y-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5 font-sans">
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                TreeRAG Indexing settings
              </span>
              <div className="space-y-3 bg-[#0D1117] p-3 rounded-lg border border-[#30363D] text-xs">
                
                <div className="flex bg-[#161B22] border border-[#30363D] rounded-lg p-0.5 mb-2">
                  <button 
                    onClick={() => setIndexMode("extensions")}
                    className={`flex-1 py-1 text-[10px] rounded font-semibold transition-all ${indexMode === "extensions" ? "bg-[#21262D] text-white shadow-sm" : "text-[#8B949E] hover:text-[#C9D1D9]"}`}
                  >
                    By Extensions
                  </button>
                  <button 
                    onClick={() => setIndexMode("files")}
                    className={`flex-1 py-1 text-[10px] rounded font-semibold transition-all ${indexMode === "files" ? "bg-[#21262D] text-white shadow-sm" : "text-[#8B949E] hover:text-[#C9D1D9]"}`}
                  >
                    Selected Files
                  </button>
                </div>

                {indexMode === "extensions" ? (
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[#8B949E] mb-2">Extensions</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["py", "js", "ts", "jsx", "tsx", "json", "md", "html", "css", "java", "cpp", "go", "rs", "sql"].map(ext => {
                        const isActive = allowedExtensions.split(",").map((e: string) => e.trim()).includes(ext);
                        return (
                          <button
                            key={ext}
                            onClick={() => {
                              const current = allowedExtensions.split(",").map((e: string) => e.trim()).filter((e: string) => e.length > 0);
                              const newExts = isActive ? current.filter((e: string) => e !== ext) : [...current, ext];
                              setAllowedExtensions(newExts.join(", "));
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                              isActive
                                ? "bg-[#2F81F7]/20 border-[#2F81F7] text-[#2F81F7] font-semibold"
                                : "bg-[#161B22] border-[#30363D] text-[#8B949E] hover:border-[#8b949e]/80"
                            }`}
                          >
                            .{ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-[#8B949E]">Check specific files or folders in the directory tree above to select them for indexing.</p>
                    <div className="mt-1.5 text-[10px] font-mono text-[#2F81F7]">
                      {selectedFilesForIndex.length} file(s) selected
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleIndexRepo}
                    disabled={indexing}
                    className="flex-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white py-1.5 rounded font-semibold text-xs transition-all cursor-pointer flex justify-center items-center gap-1"
                  >
                    {indexing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Index
                  </button>
                  <button
                    onClick={handleDeleteIndex}
                    disabled={indexing}
                    className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white py-1.5 rounded font-semibold text-xs transition-all cursor-pointer flex justify-center items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Logs terminal */}
            {indexingLogs.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-[#2EA043]" />
                  Stdout Logs
                </span>
                <div className="bg-[#0b0e14] p-3 rounded border border-[#30363D] font-mono text-[9px] text-[#8B949E] h-28 overflow-y-auto space-y-1 scrollbar-thin">
                  {indexingLogs.map((log, index) => (
                    <div key={index} className="truncate">{log.log_line}</div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </aside>
      )}

      {/* Toggle to expand Right Side panel if collapsed */}
      {!isRepoPanelOpen && selectedRepo && (
        <button
          onClick={() => setIsRepoPanelOpen(true)}
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-tr from-[#161B22] to-[#1F2937] hover:bg-[#30363D] border border-[#30363D] rounded-full text-[#2ea043] hover:text-white shadow-2xl flex items-center justify-center transition-all z-20 cursor-pointer glow-active"
          title="Expand Repository Details Panel"
        >
          <Database className="w-5 h-5" />
        </button>
      )}

    </div>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import { 
  Loader2, Sparkles, AlertTriangle, BookOpen, Edit3, Eye, Save, Trash2, Download, PanelLeftOpen, PanelLeftClose
} from "lucide-react";
import { parseMarkdownToReact } from "./shared";

interface ReadmeGeneratorProps {
  githubRepos: any[];
  repos: any[];
  selectedRepo: any;
  selectRepository: (repo: any) => void;
  readmePrompt: string;
  setReadmePrompt: (val: string) => void;
  handleGenerateReadme: () => void;
  readmeLoading: boolean;
  generatedReadme: string;
  setGeneratedReadme: (val: string) => void;
}

export const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({
  githubRepos,
  repos,
  selectedRepo,
  selectRepository,
  readmePrompt,
  setReadmePrompt,
  handleGenerateReadme,
  readmeLoading,
  generatedReadme,
  setGeneratedReadme
}) => {
  const [readmes, setReadmes] = useState<Array<{readme_id:string, repo_id:string, content:string}>>([]);
  const [selectedReadmeId, setSelectedReadmeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240); // px

  // Load saved readmes for the selected repository
  React.useEffect(() => {
    if (!selectedRepo) return;
    fetch(`/api/readmes`, {
      headers: { "X-User-Id": "demo_user" }
    })
      .then(res => res.json())
      .then(data => {
        setReadmes(data.filter((r:any) => r.repo_id === selectedRepo.id));
      })
      .catch(console.error);
  }, [selectedRepo]);

  // Resizable sidebar handlers
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (moveEvt: MouseEvent) => {
      const newWidth = Math.max(180, startWidth + moveEvt.clientX - startX);
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSelectReadme = (id:string) => {
    const r = readmes.find(r => r.readme_id === id);
    if (r) {
      setGeneratedReadme(r.content);
      setSelectedReadmeId(id);
    }
  };

  const handleSaveReadme = async () => {
    if (!selectedRepo) return;
    const payload = { repo_id: selectedRepo.id, content: generatedReadme };
    if (selectedReadmeId) {
      await fetch(`/api/readmes/${selectedReadmeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": "demo_user" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(`/api/readmes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": "demo_user" },
        body: JSON.stringify(payload)
      }).then(res => res.json()).then(data => {
        setReadmes(prev => [...prev, data]);
        setSelectedReadmeId(data.readme_id);
      });
    }
  };

  const handleDeleteReadme = async (id:string) => {
    await fetch(`/api/readmes/${id}`, { method: "DELETE", headers: { "X-User-Id": "demo_user" } });
    setReadmes(prev => prev.filter(r => r.readme_id !== id));
    if (id === selectedReadmeId) {
      setGeneratedReadme("");
      setSelectedReadmeId(null);
    }
  };

  const handleDownloadReadme = (id:string) => {
    const link = document.createElement("a");
    link.href = `/api/readmes/${id}/download`;
    link.setAttribute("download", "readme.md");
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0D1117] animate-fade-in font-sans" style={sidebarOpen ? {} : {}} >

      {/* Header with panel toggle */}
      <div className="h-14 border-b border-[#30363D] bg-[#161B22] px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#C9D1D9] hover:text-[#58a6ff]">
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <span className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Repository:</span>
          <select
            value={selectedRepo ? selectedRepo.id : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) { selectRepository(null); return; }
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
        {selectedRepo && (
          <div className="flex items-center gap-2 max-w-[440px] mx-4">
            <input
              type="text"
              placeholder="Guidelines (e.g. 'flowchart diagrams, deploy pipelines')..."
              value={readmePrompt}
              onChange={(e) => setReadmePrompt(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] px-3 py-1.5 rounded-lg text-xs text-[#C9D1D9] placeholder-[#484f58] focus:outline-none focus:border-[#2F81F7] font-mono"
            />
            <button
              onClick={handleGenerateReadme}
              disabled={readmeLoading || selectedRepo.last_indexed === 0}
              className="flex items-center gap-1.5 bg-[#2F81F7] hover:bg-[#58a6ff] disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
            >
              {readmeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate</span>
            </button>
            {/* Save button */}
            <button
              onClick={handleSaveReadme}
              disabled={!generatedReadme}
              className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      {selectedRepo ? (
        selectedRepo.last_indexed === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-[460px] mx-auto">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
            <h3 className="text-sm font-bold text-white">Repository Index Required</h3>
            <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
              Please index the codebase first. Go to Repositories Hub or active settings panel and run "Index to MongoDB".
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {sidebarOpen && (
              <div style={{ width: sidebarWidth }} className="flex flex-col bg-[#0D1117] border-r border-[#30363D] p-2 overflow-y-auto">
                <h4 className="text-xs font-bold text-[#8B949E] mb-2">Saved Readmes</h4>
                {readmes.map(r => (
                  <div key={r.readme_id} className="flex items-center justify-between py-1 border-b border-[#30363D]">
                    <button onClick={() => handleSelectReadme(r.readme_id)} className="text-xs text-[#C9D1D9] hover:text-[#58a6ff] truncate">{r.readme_id.slice(0,8)}</button>
                    <div className="flex gap-1">
                      <Save size={14} className="text-[#58a6ff] cursor-pointer" onClick={handleSaveReadme} />
                      <Trash2 size={14} className="text-[#f85149] cursor-pointer" onClick={() => handleDeleteReadme(r.readme_id)} />
                      <Download size={14} className="text-[#8b949e] cursor-pointer" onClick={() => handleDownloadReadme(r.readme_id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Divider for resizing */}
            {sidebarOpen && (
              <div
                onMouseDown={startResize}
                className="w-1 bg-[#30363D] cursor-col-resize hover:bg-[#58a6ff]"
              />
            )}
            <div className="flex-1 flex flex-col border-r border-[#30363D] min-w-0 bg-[#0d1117]">
              <div className="h-9 px-4 border-b border-[#30363D] bg-[#161B22] flex items-center justify-between shrink-0 font-sans">
                <span className="text-[10px] font-bold text-[#8B949E] uppercase flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-yellow-500" />
                  Markdown Editor
                </span>
              </div>
              <textarea
                value={generatedReadme}
                onChange={(e) => setGeneratedReadme(e.target.value)}
                placeholder="Live markdown..."
                className="flex-1 p-6 bg-[#0D1117] text-[#C9D1D9] font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-relaxed"
              />
            </div>
            <div className="flex-1 flex flex-col bg-[#161B22] min-w-0">
              <div className="h-9 px-4 border-b border-[#30363D] bg-[#161B22] flex items-center gap-1.5 shrink-0 font-sans">
                <Eye className="w-3.5 h-3.5 text-[#2EA043]" />
                <span className="text-[10px] font-bold text-[#8B949E] uppercase">Live Render</span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto max-w-none bg-[#0D1117]/40">
                {generatedReadme ? (
                  <div className="prose prose-invert select-text max-w-none">
                    {parseMarkdownToReact(generatedReadme)}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4 text-[#8B949E]">
                    <BookOpen className="w-8 h-8 text-[#30363D] mb-2 animate-pulse" />
                    Live preview compiles here.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-[460px] mx-auto font-sans">
          <BookOpen className="w-12 h-12 text-[#30363D] mb-4 animate-pulse" />
          <h3 className="text-sm font-bold text-white">README Generator</h3>
          <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
            Select a repository to start generating professional system documentation with visual flowcharts.
          </p>
        </div>
      )}
    </div>
  );
};

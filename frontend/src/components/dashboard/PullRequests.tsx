"use client";

import React from "react";
import { 
  Bot, Loader2
} from "lucide-react";

interface PullRequestsProps {
  selectedRepo: any;
  pullRequests: any[];
  selectedPR: any;
  handlePRSelect: (pr: any) => void;
  prDetails: any;
  handlePRSummary: () => void;
  prSummaryLoading: boolean;
  prSummary: string;
}

export const PullRequests: React.FC<PullRequestsProps> = ({
  selectedRepo,
  pullRequests,
  selectedPR,
  handlePRSelect,
  prDetails,
  handlePRSummary,
  prSummaryLoading,
  prSummary
}) => {
  const [isPrListOpen, setIsPrListOpen] = React.useState<boolean>(true);
  const [isSummaryOpen, setIsSummaryOpen] = React.useState<boolean>(true);
  const [listWidth, setListWidth] = React.useState<number>(288);
  const [summaryWidth, setSummaryWidth] = React.useState<number>(320);

  const startResizingList = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = listWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Left-side panel resizing: Dragging right (positive clientX delta) increases width
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 180 && newWidth <= 450) {
        setListWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const startResizingSummary = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = summaryWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Right-side panel resizing: Dragging left (negative clientX delta) increases width
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth >= 240 && newWidth <= 550) {
        setSummaryWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0D1117] animate-fade-in font-sans relative">
      {selectedRepo ? (
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left panel: Open Pull Requests list */}
          <div 
            style={{ width: isPrListOpen ? `${listWidth}px` : "0px" }}
            className="border-r border-[#30363D] bg-[#161B22] flex flex-col shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden relative select-none"
          >
            {/* Draggable border resize handle */}
            {isPrListOpen && (
              <div 
                onMouseDown={startResizingList}
                className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
              />
            )}

            <div className="p-4 border-b border-[#30363D] flex items-center justify-between shrink-0">

              <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">Open Pull Requests</span>
              <button 
                onClick={() => setIsPrListOpen(false)}
                className="p-1 rounded hover:bg-[#30363D] text-[#8B949E] hover:text-white cursor-pointer"
                title="Collapse List"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pullRequests.map(pr => (
                <button
                  key={pr.number}
                  onClick={() => handlePRSelect(pr)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                    selectedPR?.number === pr.number 
                      ? "bg-[#21262d] border-[#30363D] text-white shadow-md" 
                      : "bg-[#161B22] border-transparent text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
                  }`}
                >
                  <span className="font-semibold text-[#F0F6FC] line-clamp-1">#{pr.number} {pr.title}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E]">
                    <img src={pr.avatar_url} alt="Author" className="w-3.5 h-3.5 rounded-full" />
                    <span>{pr.author}</span>
                    <span>•</span>
                    <span className="font-mono text-[#2EA043]">{pr.source_branch}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsed left list floating restore trigger */}
          {!isPrListOpen && (
            <button 
              onClick={() => setIsPrListOpen(true)}
              className="absolute left-3 top-3 z-20 p-2 bg-[#161B22] border border-[#30363D] rounded-lg text-purple-400 hover:text-white hover:bg-[#30363D] transition-all cursor-pointer shadow-xl flex items-center justify-center"
              title="Expand PR List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          )}

          {/* Main viewport */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedPR ? (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Header toolbar */}
                <div className={`p-6 border-b border-[#30363D] bg-[#161B22] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 transition-all ${!isPrListOpen ? "pl-16" : ""}`}>
                  <div>
                    <h2 className="text-base font-bold text-[#F0F6FC] flex items-center gap-2 font-mono">
                      <span className="text-[#8B949E]">#{selectedPR.number}</span>
                      {selectedPR.title}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePRSummary}
                      disabled={prSummaryLoading}
                      className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      {prSummaryLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      AI PR Summary
                    </button>
                    
                    {!isSummaryOpen && (
                      <button
                        onClick={() => setIsSummaryOpen(true)}
                        className="flex items-center gap-1 bg-[#21262d] border border-[#30363D] hover:bg-[#30363d] text-[#8B949E] hover:text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                        title="Show Summary Side Drawer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Show Summary</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                  
                  {/* File diff viewer */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-[#30363D]">
                    {prDetails ? (
                      <div className="space-y-6">
                        {prDetails.changed_files.map((file: any) => (
                          <div key={file.filename} className="rounded-lg border border-[#30363D] overflow-hidden bg-[#161B22]">
                            <div className="h-9 px-4 bg-[#21262d] border-b border-[#30363D] flex items-center justify-between text-xs">
                              <span className="font-mono text-[#C9D1D9]">{file.filename}</span>
                            </div>
                            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-[#C9D1D9] bg-[#0b0e14] whitespace-pre">
                              {file.patch || "No patch diff."}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-xs text-[#8B949E]">Loading diff details...</div>
                    )}
                  </div>

                  {/* Right panel: AI Pull Request Summary details */}
                  <div 
                    style={{ width: isSummaryOpen ? `${summaryWidth}px` : "0px" }}
                    className="bg-[#161B22] flex flex-col overflow-hidden shrink-0 transition-all duration-300 border-l border-[#30363D]/40 relative select-none"
                  >
                    {/* Draggable border resize handle */}
                    {isSummaryOpen && (
                      <div 
                        onMouseDown={startResizingSummary}
                        className="absolute top-0 left-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
                      />
                    )}

                    <div className="h-10 px-4 border-b border-[#30363D] flex items-center justify-between shrink-0 bg-[#1f242d]/30">

                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[#2EA043]" />
                        <span className="text-xs font-bold text-[#8B949E]">AI PR Summary</span>
                      </div>
                      <button 
                        onClick={() => setIsSummaryOpen(false)}
                        className="p-1 rounded hover:bg-[#30363D] text-[#8B949E] hover:text-white cursor-pointer"
                        title="Collapse Summary"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 text-xs text-[#C9D1D9] whitespace-pre-wrap font-mono leading-relaxed bg-[#0b0e14]/50">
                      {prSummary || "No AI summary generated yet."}
                    </div>
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-[#8B949E]">Select a Pull Request to review branch changes.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-xs text-[#8B949E]">Select a Repository first on Repositories Hub.</div>
      )}
    </div>
  );
};

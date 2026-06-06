"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot, Shield, Database, Code, BookOpen, GitPullRequest, Search, LogOut, Cpu, Loader2, Terminal
} from "lucide-react";
import { useDashboard, DashboardProvider } from "../../context/DashboardContext";
import { AIChatTabIcon } from "../../components/dashboard/shared";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    user, handleLogout, selectedRepo, indexStatus, indexing,
    pullRequests, isLeftNavOpen, setIsLeftNavOpen, leftNavWidth, startResizingLeftNav
  } = useDashboard();
  
  const pathname = usePathname();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0D1117]">
      <header className="h-14 border-b border-[#30363D] bg-[#161B22] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-sm text-[#F0F6FC] tracking-tight">GitOracle</span>
            {selectedRepo && (
              <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-[#21262d] border border-[#30363D] text-[#8B949E] uppercase font-mono">
                {selectedRepo.owner}/{selectedRepo.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedRepo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B949E] font-mono mr-1">
                Index: {selectedRepo.last_indexed > 0 ? (
                  <span className="text-[#2EA043] font-semibold">MongoDB Active</span>
                ) : (
                  <span className="text-amber-500">Not Synced</span>
                )}
              </span>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-[#30363D]">
              <img
                src={user.avatar_url || "https://github.com/github.png"}
                alt={user.username}
                className="w-7 h-7 rounded-full border border-[#30363D]"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#F0F6FC] leading-none">{user.username}</p>
                <p className="text-[10px] text-[#8B949E] mt-0.5 leading-none">OAuth Connected</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-[#30363D] rounded-lg text-[#8B949E] hover:text-[#F0F6FC] transition-all cursor-pointer"
                title="Log Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>
      
      {indexing && indexStatus && (
        <div className="bg-[#2EA043]/10 border-b border-[#2EA043]/30 px-6 py-2 flex items-center justify-between text-xs text-[#2EA043] animate-fade-in shrink-0">
          <span className="flex items-center gap-2 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            {indexStatus}
          </span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside 
          style={{ width: isLeftNavOpen ? `${leftNavWidth}px` : "64px" }}
          className="border-r border-[#30363D] bg-[#161B22] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300 relative select-none"
        >
          <nav className="p-4 space-y-1.5 shrink-0 border-b border-[#30363D]">
            <Link
              href="/dashboard"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/dashboard" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="Dashboard Overview"
            >
              <Cpu className="w-4 h-4 text-[#2F81F7] shrink-0" />
              {isLeftNavOpen && <span>Dashboard Overview</span>}
            </Link>

            <Link
              href="/repositories"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/repositories" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="Repositories Hub"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              {isLeftNavOpen && <span>Repositories Hub</span>}
            </Link>

            <Link
              href="/explorer"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/explorer" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="Code Explorer"
            >
              <Code className="w-4 h-4 text-pink-400" />
              {isLeftNavOpen && <span>Code Explorer</span>}
            </Link>

            <Link
              href="/chat"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/chat" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="AI RAG Chat"
            >
              <AIChatTabIcon className="w-4 h-4" />
              {isLeftNavOpen && <span>AI RAG Chat</span>}
            </Link>

            <Link
              href="/readme"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/readme" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="README Generator"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              {isLeftNavOpen && <span>README Generator</span>}
            </Link>

            <Link
              href="/pulls"
              className={`w-full flex items-center ${isLeftNavOpen ? "gap-2.5 px-3" : "justify-center px-1"} py-2 text-xs rounded-lg transition-all font-medium ${
                pathname === "/pulls" ? "bg-[#1f242c] text-white shadow-sm shadow-black/20" : "text-[#8B949E] hover:bg-[#1f242c]/50 hover:text-white"
              }`}
              title="Pull Requests"
            >
              <GitPullRequest className="w-4 h-4 text-purple-400" />
              {isLeftNavOpen && <span>Pull Requests</span>}
              {pullRequests.length > 0 && (
                <span className={`${isLeftNavOpen ? "ml-auto" : "absolute top-1 right-1"} bg-[#238636] text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none font-bold`}>
                  {pullRequests.length}
                </span>
              )}
            </Link>


          </nav>
          
          <div className="flex-1 flex flex-col justify-between p-4 font-sans relative">
            {isLeftNavOpen ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center text-xs text-[#8B949E] p-2 mt-4 select-none">
                {/* <Shield className="w-8 h-8 text-[#30363D] mb-2" /> */}
                <p className="text-[10px] leading-relaxed">Secure credentials symmetrically encrypted in DB memory.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-1 mt-4">
                <Shield className="w-6 h-6 text-[#30363D]" />
              </div>
            )}
            
            <div className="flex justify-center pt-4 border-t border-[#30363D]/40">
              <button 
                onClick={() => setIsLeftNavOpen(!isLeftNavOpen)}
                className="p-1.5 rounded-lg hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] transition-all cursor-pointer flex items-center justify-center bg-[#21262d]/50 border border-[#30363D]"
                title={isLeftNavOpen ? "Collapse Navigation" : "Expand Navigation"}
              >
                {isLeftNavOpen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Draggable border resize handle */}
          {isLeftNavOpen && (
            <div 
              onMouseDown={startResizingLeftNav}
              className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
            />
          )}
        </aside>
        <main className="flex-1 flex flex-col bg-[#0D1117] min-w-0 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>
  );
}

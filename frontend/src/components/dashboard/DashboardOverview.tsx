"use client";

import React from "react";
import { Star, Database, Globe, Lock, Shield } from "lucide-react";
import { GitHeatmap } from "./GitHeatmap";

interface DashboardOverviewProps {
  user: any;
  totalStarsCount: number;
  totalReposCount: number;
  publicReposCount: number;
  privateReposCount: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  totalStarsCount,
  totalReposCount,
  publicReposCount,
  privateReposCount
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 animate-fade-in font-sans">
      
      {/* User welcoming details */}
      {user && (
        <div className="rounded-2xl bg-gradient-to-tr from-[#161B22] to-[#1F2937] border border-[#30363D] p-6 flex flex-col md:flex-row items-center gap-5 justify-between">
          <div className="flex items-center gap-4 text-left">
            <img
              src={user.avatar_url || "https://github.com/github.png"}
              alt={user.username}
              className="w-14 h-14 rounded-full border-2 border-[#2ea043] shadow-lg shadow-[#2ea043]/15"
            />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                {user.username}
              </h2>
              <p className="text-xs text-[#8B949E] mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Connected Profile • Has GitHub Token: <span className="text-[#2F81F7] font-semibold">True</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 bg-[#161B22]/50 border border-[#30363D]">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Total Stars</span>
            <span className="text-lg font-bold text-white mt-0.5 font-mono">{totalStarsCount} Stars</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3 bg-[#161B22]/50 border border-[#30363D]">
          <div className="w-10 h-10 rounded-lg bg-[#2F81F7]/10 flex items-center justify-center border border-[#2F81F7]/20">
            <Database className="w-5 h-5 text-[#2F81F7]" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Repositories</span>
            <span className="text-lg font-bold text-white mt-0.5 font-mono">{totalReposCount} Total</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3 bg-[#161B22]/50 border border-[#30363D]">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Public Repos</span>
            <span className="text-lg font-bold text-white mt-0.5 font-mono">{publicReposCount} Public</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3 bg-[#161B22]/50 border border-[#30363D]">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">Private Repos</span>
            <span className="text-lg font-bold text-white mt-0.5 font-mono">{privateReposCount} Private</span>
          </div>
        </div>

      </div>

      {/* Contributions & Git Activity Heatmap Section */}
      <div className="space-y-4">
        <GitHeatmap username={user?.username} />
      </div>

      {/* Tips block */}
      <div className="p-4 bg-[#161B22]/40 rounded-xl border border-[#30363D] flex gap-3 items-start text-xs text-[#8B949E]">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white block mb-0.5">Workspace Operations tip:</span>
          Navigate to the **Repositories Hub** tab to explore your repositories and open their details, or use **Code Explorer** to select any repo and read code files using direct `GithubFileLoader` zero-clone integrations without wait.
        </div>
      </div>

    </div>
  );
};

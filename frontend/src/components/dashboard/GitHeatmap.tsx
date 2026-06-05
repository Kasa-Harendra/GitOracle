"use client";

import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";

interface GitHeatmapProps {
  username?: string;
}

export const GitHeatmap: React.FC<GitHeatmapProps> = ({ username }) => {
  if (!username) {
    return (
      <div className="bg-[#161B22]/60 backdrop-blur-md border border-[#30363D] rounded-xl p-5 h-[178px] animate-pulse flex flex-col justify-center items-center font-sans text-xs text-[#8B949E]">
        Loading GitHub Stats...
      </div>
    );
  }

  // The user requested to embed github-readme-streak-stats
  const streakStatsUrl = `https://streak-stats.demolab.com/?user=${username}&theme=dark&hide_border=true&background=0D1117&ring=2EA043&fire=2EA043&currStreakNum=F0F6FC&sideNums=F0F6FC&currStreakLabel=8B949E&sideLabels=8B949E&dates=8B949E`;

  return (
    <div className="bg-[#161B22]/60 backdrop-blur-md border border-[#30363D] rounded-xl p-5 font-sans animate-fade-in flex flex-col items-center overflow-hidden">
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#2ea043] animate-pulse" />
          GitHub Contribution Streak
        </span>
      </div>
      
      <div className="w-full flex justify-center overflow-x-auto scrollbar-thin pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={streakStatsUrl} 
          alt={`${username}'s GitHub Streak`} 
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, FolderSearch, GitPullRequest, Search, ArrowRight, Bot, FileText } from "lucide-react";

const GitHub = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Listen for callback query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    const usernameParam = params.get("username");
    const avatarParam = params.get("avatar_url");

    if (tokenParam && usernameParam) {
      setLoading(true);
      localStorage.setItem("session_token", tokenParam);
      localStorage.setItem("user_profile", JSON.stringify({
        username: usernameParam,
        avatar_url: avatarParam || `https://github.com/${usernameParam}.png`
      }));
      router.push("/dashboard");
    }
  }, [router]);

  const handleOAuthLogin = () => {
    setError("");
    setLoading(true);
    // Redirect to FastAPI OAuth gate
    window.location.href = "http://127.0.0.1:8000/api/auth/github";
  };

  const features = [
    {
      title: "File-Specific Chat",
      description: "Trigger streaming AI explanations for any code file with chunk-by-chunk responses for a zero-latency feel.",
      icon: <MessageSquare className="w-5 h-5 text-[#2EA043]" />,
    },
    {
      title: "Repository Code Chat",
      description: "Maintain deep context across your session with AI bots that can converse about your entire repository architecture.",
      icon: <Bot className="w-5 h-5 text-[#2F81F7]" />,
    },
    {
      title: "Seamless File Exploration",
      description: "Stream directory trees, branches, and file contents directly from GitHub without ever fully cloning the repository locally.",
      icon: <FolderSearch className="w-5 h-5 text-[#2EA043]" />,
    },
    {
      title: "Automated PR Summaries",
      description: "Dynamically fetch active Pull Requests from GitHub and automatically generate AI-powered code-review summaries.",
      icon: <GitPullRequest className="w-5 h-5 text-[#2F81F7]" />,
    },
    {
      title: "Readme Generator",
      description: "Automatically generate highly detailed and formatted README files for your projects based on deep codebase analysis.",
      icon: <FileText className="w-5 h-5 text-[#2EA043]" />,
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[#0D1117] relative overflow-x-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#238636] rounded-full blur-[120px] opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#2F81F7] rounded-full blur-[120px] opacity-30 animate-pulse pointer-events-none" />

      {/* Navbar Area */}
      <header className="w-full px-8 py-6 flex justify-between items-center relative z-10 bg-transparent">
        <div className="text-xl font-bold tracking-tight text-[#F0F6FC]">
          GitOracle
        </div>
        <button
          onClick={handleOAuthLogin}
          disabled={loading}
          className="bg-[#238636] hover:bg-[#2ea043] text-white px-5 py-2.5 rounded-sm font-medium text-sm flex items-center gap-2 border border-[#30363D] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <GitHub className="w-4 h-4" />
          {loading ? "Authenticating..." : "Login with GitHub"}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-16 animate-fade-in">
        
        {/* Hero Section */}
        <div className="max-w-3xl text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F0F6FC] mb-6 leading-tight">
            Unlock the Intelligence <br/> Within Your Repositories
          </h1>
          <p className="text-sm md:text-base text-[#8B949E] mb-10 max-w-2xl mx-auto leading-relaxed">
            Securely browse, and analyze your remote GitHub repositories with streaming AI file explanations, full codebase chat, automated PR summaries, and Readme Generations.
          </p>
          <button
            onClick={handleOAuthLogin}
            disabled={loading}
            className="mx-auto bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-3.5 rounded-sm font-medium text-base flex items-center justify-center gap-2.5 border border-[#30363D] shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <GitHub className="w-5 h-5" />
            {loading ? "Connecting to GitHub..." : "Get Started with GitHub"}
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
          {error && (
            <div className="mt-4 p-3 border border-red-800 text-red-400 text-sm text-center bg-red-950/40 rounded-sm inline-block">
              {error}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="glass-card rounded-sm border border-[#30363D] p-6 hover:border-[#8B949E] transition-colors duration-300">
              <div className="w-10 h-10 bg-[#161B22] border border-[#30363D] rounded-sm flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-[#F0F6FC] mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-[#8B949E] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

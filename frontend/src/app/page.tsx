"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Terminal, Shield, ArrowRight, Activity } from "lucide-react";

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

  const handleDemoLogin = () => {
    setError("");
    setLoading(true);
    // Redirect directly through the secure callback pipeline in mock mode
    window.location.href = "http://127.0.0.1:8000/api/auth/callback?code=mock-code";
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[#0D1117]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#238636] rounded-full blur-[120px] opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#2F81F7] rounded-full blur-[120px] opacity-15 animate-pulse pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10 animate-fade-in">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#161B22] to-[#1F2937] rounded-2xl flex items-center justify-center border border-[#30363D] shadow-lg mb-4">
            <Bot className="w-8 h-8 text-[#2EA043]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F0F6FC] text-center">
            AI GitHub Workspace
          </h1>
          <p className="text-sm text-[#8B949E] mt-1 text-center">
            Core Intelligence & TreeRAG Developer Platform
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-card rounded-2xl border border-[#30363D] p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-[#2EA043]" />
              </div>
              <p className="text-xs text-[#C9D1D9] leading-relaxed">
                Connect your account with GitHub OAuth. Tokens are symmetrically encrypted and stored on the backend, ensuring full local privacy.
              </p>
            </div>

            <button
              onClick={handleOAuthLogin}
              disabled={loading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2.5 border border-[#30363D] shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <GitHub className="w-4.5 h-4.5" />
              {loading ? "Establishing OAuth..." : "Sign in with GitHub OAuth"}
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Footer Technical Notes */}
        <div className="mt-8 flex justify-center gap-6 text-[11px] text-[#8B949E]">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#2EA043]" />
            FastAPI Backend
          </span>
          <span className="flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-[#2F81F7]" />
            TreeRAG Retrieval
          </span>
          <span className="flex items-center gap-1.5">
            <GitHub className="w-3 h-3" />
            PyGithub GitPython
          </span>
        </div>
      </div>
    </main>
  );
}

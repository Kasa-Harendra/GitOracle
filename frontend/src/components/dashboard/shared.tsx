"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Inline Custom SVGs for premium cyber branding
export const GitHub = ({ className = "w-4 h-4" }: { className?: string }) => (
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

export const AIChatTabIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} text-cyan-400`}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="m10 8-3 3 3 3" />
    <path d="m14 8 3 3-3 3" />
  </svg>
);

export const AIBotIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} text-[#00F0FF] filter drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]`}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="12" x2="12" y2="7" />
    <line x1="12" y1="12" x2="8" y2="10" />
    <line x1="12" y1="12" x2="16" y2="10" />
  </svg>
);

export const AIUserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} text-[#BD00FF] filter drop-shadow-[0_0_8px_rgba(189,0,255,0.4)]`}
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const MermaidRenderer = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).mermaid) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      try {
        (window as any).mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true }
        });
        setLoaded(true);
      } catch (e) {
        console.error("Error initializing mermaid:", e);
      }
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    let active = true;
    const renderDiagram = async () => {
      const cleanCode = code.trim();
      if (!cleanCode) return;

      const randomId = "mermaid-" + Math.floor(Math.random() * 1000000);
      try {
        const { svg: renderedSvg } = await (window as any).mermaid.render(randomId, cleanCode);
        if (active) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (err: any) {
        if (active) {
          setError("Synthesizing system flowchart visualizer...");
          const bindEl = document.getElementById("d" + randomId);
          if (bindEl) bindEl.remove();
          const badEl = document.getElementById(randomId);
          if (badEl) badEl.remove();
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [code, loaded]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#0D1117]/80 rounded-xl border border-[#30363D] text-[11px] text-[#8B949E] font-mono">
        <Loader2 className="w-4 h-4 animate-spin text-[#2EA043] mr-2" />
        Loading Mermaid drawing engine...
      </div>
    );
  }

  if (error && !svg) {
    return (
      <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-500 font-mono">
        <div className="flex items-center gap-1.5 mb-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>{error}</span>
        </div>
        <pre className="text-[10px] text-[#8B949E] p-2 bg-[#0D1117] rounded overflow-auto max-h-[150px]">{code}</pre>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#161B22]/80 border border-[#30363D] rounded-xl flex justify-center items-center overflow-auto shadow-inner my-4">
      <div className="w-full max-w-full text-center" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

// Client-Side Markdown Parser Helpers
export const parseInlineStyles = (content: string) => {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = content.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="bg-[#161B22] border border-[#30363D] px-1.5 py-0.5 rounded font-mono text-[10px] text-pink-400">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

export const parseMarkdownToReact = (text: string) => {
  if (!text) return null;
  const parts = text.split("```");
  return parts.map((part, index) => {
    const isCodeBlock = index % 2 === 1;

    if (isCodeBlock) {
      const firstNewLine = part.indexOf("\n");
      const lang = firstNewLine !== -1 ? part.substring(0, firstNewLine).trim() : "";
      const code = firstNewLine !== -1 ? part.substring(firstNewLine + 1) : part;

      if (lang.toLowerCase() === "mermaid") {
        return (
          <div key={index} className="my-5">
            <span className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Mermaid Flowchart Diagram
            </span>
            <MermaidRenderer code={code} />
          </div>
        );
      } else {
        return (
          <div key={index} className="my-4 rounded-xl border border-[#30363D] overflow-hidden bg-[#0b0e14] font-mono text-xs">
            <div className="h-8 px-4 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-sans">
              <span>{lang || "code"}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-[#C9D1D9] whitespace-pre tab-size-4 select-text">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
    }

    const lines = part.split("\n");
    return (
      <div key={index} className="space-y-2.5 my-3 font-sans text-xs text-[#C9D1D9] leading-relaxed">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={lineIdx} className="text-xl font-bold text-white border-b border-[#30363D] pb-2 mt-6 mb-4 flex items-center gap-2">
                {trimmed.substring(2)}
              </h1>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={lineIdx} className="text-base font-bold text-white mt-5 mb-3 flex items-center gap-1.5">
                {trimmed.substring(3)}
              </h2>
            );
          }
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={lineIdx} className="text-sm font-bold text-[#F0F6FC] mt-4 mb-2">
                {trimmed.substring(4)}
              </h3>
            );
          }
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const content = trimmed.substring(2);
            return (
              <ul key={lineIdx} className="list-disc pl-5 my-1 space-y-1">
                <li className="text-[#C9D1D9]">
                  {parseInlineStyles(content)}
                </li>
              </ul>
            );
          }
          if (trimmed === "") {
            return <div key={lineIdx} className="h-2" />;
          }

          return <p key={lineIdx} className="my-1.5">{parseInlineStyles(trimmed)}</p>;
        })}
      </div>
    );
  });
};

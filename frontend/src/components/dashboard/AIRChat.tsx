"use client";

import React from "react";
import { Terminal, RefreshCw, Loader2, Send } from "lucide-react";
import { AIBotIcon, AIUserIcon, AIChatTabIcon } from "./shared";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AIRChatProps {
  githubRepos: any[];
  repos: any[];
  selectedRepo: any;
  selectRepository: (repo: any) => void;
  messages: any[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  chatLoading: boolean;
  traceActive: boolean;
  traceLogs: string[];
  setTraceLogs: React.Dispatch<React.SetStateAction<string[]>>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  traceEndRef: React.RefObject<HTMLDivElement | null>;
}

export const AIRChat: React.FC<AIRChatProps> = ({
  githubRepos,
  repos,
  selectedRepo,
  selectRepository,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatLoading,
  traceActive,
  traceLogs,
  setTraceLogs,
  messagesEndRef,
  traceEndRef
}) => {
  const [isTraceOpen, setIsTraceOpen] = React.useState<boolean>(true);
  const [traceWidth, setTraceWidth] = React.useState<number>(320);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = traceWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Dragging left (negative clientX delta) increases width of right-side panel
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      if (newWidth >= 240 && newWidth <= 600) {
        setTraceWidth(newWidth);
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
    <div className="flex-1 flex overflow-hidden relative">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0D1117]">
        <div className="h-14 border-b border-[#30363D] bg-[#161B22] px-6 flex items-center justify-between gap-4 shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Repository:</span>
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

          {traceActive && !isTraceOpen && (
            <button
              onClick={() => setIsTraceOpen(true)}
              className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363D] hover:bg-[#30363d] text-[#8B949E] hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              title="Show Reasoning Trace Panel"
            >
              <Terminal className="w-3.5 h-3.5 text-[#2EA043]" />
              <span>Show Trace</span>
            </button>
          )}
        </div>

        {selectedRepo ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center max-w-[460px] mx-auto font-sans">
                    <div className="w-14 h-14 bg-cyan-950/20 rounded-2xl border border-cyan-800/40 flex items-center justify-center mb-4 glow-active">
                      <AIBotIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-[#F0F6FC]">Chat with {selectedRepo.name} using TreeRAG</h3>
                    <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
                      Ask complex questions about classes, system flows, dependencies, or config files. The TreeRAG retriever will search MongoDB summaries to output reasoning logs.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className={`flex gap-4 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      {m.sender === "bot" ? (
                        <div className="w-8 h-8 rounded-full bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-center shrink-0">
                          <AIBotIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-center shrink-0 order-2">
                          <AIUserIcon className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className={`text-sm leading-relaxed ${
                        m.sender === "user" 
                          ? "max-w-[75%] rounded-xl p-4 border border-[#30363D] bg-[#21262d] text-[#F0F6FC] order-1" 
                          : "w-full max-w-[90%] bg-transparent border-none p-0 text-[#C9D1D9]"
                      }`}>
                        {m.content ? (
                          m.sender === "user" ? (
                            <div className="whitespace-pre-wrap font-mono text-[13px]">{m.content}</div>
                          ) : (
                            parseMarkdown(m.content)
                          )
                        ) : (
                          <div className="flex items-center gap-2.5 text-xs text-[#8B949E] py-1 select-none font-sans">
                            <Loader2 className="w-4 h-4 animate-spin text-[#2F81F7]" />
                            <span className="animate-pulse tracking-wide font-medium">Thinking, traversing index...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#30363D] bg-[#161B22] shrink-0 font-sans">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask TreeRAG about this codebase..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-lg bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] focus:outline-none focus:ring-1 focus:ring-[#2F81F7] text-sm text-[#F0F6FC] placeholder-[#484f58]"
                  />
                  <button type="submit" className="absolute inset-y-1.5 right-1.5 px-3 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md flex items-center justify-center transition-all cursor-pointer">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-[460px] mx-auto font-sans">
            <AIChatTabIcon className="w-12 h-12 text-[#30363D] mb-4 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Select a Repository</h3>
            <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
              Please select an active repository from the top dropdown to query and chat semantically.
            </p>
          </div>
        )}
      </div>

      {/* Column 3: Main chat reasoning trace sidebar */}
      {traceActive && isTraceOpen && selectedRepo && (
        <aside 
          style={{ width: `${traceWidth}px` }}
          className="border-l border-[#30363D] bg-[#161B22] flex flex-col shrink-0 overflow-hidden animate-fade-in font-mono transition-all duration-300 relative select-none"
        >
          {/* Draggable border resize handle */}
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 left-0 w-[5px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30" 
          />

          <div className="h-12 border-b border-[#30363D] px-4 flex items-center justify-between shrink-0 font-sans bg-[#1f242d]/30">

            <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#2EA043]" />
              Reasoning Trace
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTraceLogs([])}
                className="p-1 hover:bg-[#30363D] rounded text-[#8B949E] hover:text-[#C9D1D9] transition-all cursor-pointer"
                title="Clear Trace"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsTraceOpen(false)}
                className="p-1 hover:bg-[#30363D] rounded text-[#8B949E] hover:text-[#C9D1D9] transition-all cursor-pointer"
                title="Collapse Trace"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[11px] text-[#C9D1D9] bg-[#0b0e14] scrollbar-thin">
            {traceLogs.map((log, index) => {
              let logClass = "text-[#C9D1D9]";
              if (log.includes("[Exploring Folder]")) {
                logClass = "text-[#2F81F7] font-semibold pt-1 border-t border-[#30363D]/40";
              } else if (log.includes("[Retrieving File]")) {
                logClass = "text-[#2EA043] font-semibold";
              } else if (log.includes("[LLM Decision]") || log.includes("[LLM Reasoning]")) {
                logClass = "text-[#8B949E] italic pl-2 border-l border-[#30363D]";
              }
              return (
                <div key={index} className={`whitespace-pre-wrap leading-relaxed animate-fade-in ${logClass}`}>
                  {log}
                </div>
              );
            })}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8B949E] pt-2 animate-pulse font-sans">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2EA043]" />
                Searching summaries...
              </div>
            )}
            <div ref={traceEndRef} />
          </div>
        </aside>
      )}
    </div>
  );
};

const parseMarkdown = (text: string) => {
  if (!text) return null;
  
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLanguage = "";
  
  let inTable = false;
  let tableRows: string[][] = [];
  let tableCounter = 0;
  
  const elements: React.ReactNode[] = [];

  const handleFlushTable = () => {
    if (inTable && tableRows.length > 0) {
      flushTable(elements, tableRows, tableCounter++);
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    // If in code block, tables don't get parsed
    if (line.trim().startsWith("```")) {
      handleFlushTable();
      if (inCodeBlock) {
        elements.push(
            <div key={`code-${index}`} className="my-3">
              {codeLanguage && (
                <div className="text-[10px] text-[#8B949E] uppercase mb-1 border-b border-[#30363D]/60 pb-1 font-sans font-bold tracking-wide">
                  {codeLanguage}
                </div>
              )}
              <SyntaxHighlighter language={codeLanguage || undefined} style={atomDark} customStyle={{ background: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", padding: "12px", fontSize: "12px" }}>
                {codeBlockContent.join("\n")}
              </SyntaxHighlighter>
            </div>
          );
        codeBlockContent = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Check for tables
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
      const parts = parseTableRow(trimmedLine);
      if (isDividerRow(parts)) {
        return; // Divider row, just skip
      }
      
      if (!inTable) {
        inTable = true;
      }
      tableRows.push(parts);
      return;
    } else {
      handleFlushTable();
    }

    // Horizontal Rule
    if (trimmedLine === "---" || trimmedLine === "***" || trimmedLine === "___") {
      elements.push(<hr key={index} className="border-t border-[#30363D] my-4" />);
      return;
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(<h1 key={index} className="text-xl font-bold text-white mt-4 mb-2 font-sans">{line.slice(2)}</h1>);
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={index} className="text-lg font-bold text-white mt-4 mb-2 font-sans">{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={index} className="text-base font-bold text-white mt-3 mb-1 font-sans">{line.slice(4)}</h3>);
      return;
    }

    // List item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().slice(2);
      elements.push(
        <li key={index} className="ml-4 list-disc text-sm text-[#C9D1D9] my-1 font-sans">
          {renderInlineStyles(content)}
        </li>
      );
      return;
    }

    // Regular line
    if (line.trim() === "") {
      elements.push(<div key={index} className="h-2" />);
    } else {
      elements.push(<p key={index} className="text-sm text-[#C9D1D9] my-1 leading-relaxed font-sans">{renderInlineStyles(line)}</p>);
    }
  });

  // Flush table if file ends inside a table block
  handleFlushTable();

  return <div className="space-y-1 select-text">{elements}</div>;
};

const parseTableRow = (line: string): string[] => {
  const rawParts = line.split("|");
  let parts = [...rawParts];
  if (parts[0] === "") parts.shift();
  if (parts[parts.length - 1] === "") parts.pop();
  return parts.map(p => p.trim());
};

const isDividerRow = (parts: string[]): boolean => {
  return parts.length > 0 && parts.every(p => p.replace(/[:\- ]/g, "") === "");
};

const flushTable = (elementsList: React.ReactNode[], rows: string[][], tableIdx: number) => {
  if (rows.length === 0) return;
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  elementsList.push(
    <div key={`table-wrapper-${tableIdx}`} className="overflow-x-auto my-4 border border-[#30363D] rounded-lg">
      <table className="min-w-full divide-y divide-[#30363D] font-sans text-xs">
        <thead className="bg-[#161B22]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2 text-left font-bold text-[#F0F6FC] border-r border-[#30363D] last:border-r-0">
                {renderInlineStyles(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30363D] bg-[#0D1117]">
          {dataRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-[#161B22]/40">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-[#C9D1D9] border-r border-[#30363D] last:border-r-0 whitespace-normal">
                  {renderInlineStyles(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderInlineStyles = (text: string) => {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  while (currentText) {
    const boldIdx = currentText.indexOf("**");
    const codeIdx = currentText.indexOf("`");

    if (boldIdx === -1 && codeIdx === -1) {
      parts.push(currentText);
      break;
    }

    if (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) {
      if (boldIdx > 0) {
        parts.push(currentText.substring(0, boldIdx));
      }
      const nextBold = currentText.indexOf("**", boldIdx + 2);
      if (nextBold !== -1) {
        parts.push(<strong key={keyIdx++} className="font-bold text-[#F0F6FC]">{currentText.substring(boldIdx + 2, nextBold)}</strong>);
        currentText = currentText.substring(nextBold + 2);
      } else {
        parts.push(currentText.substring(boldIdx));
        break;
      }
    } else {
      if (codeIdx > 0) {
        parts.push(currentText.substring(0, codeIdx));
      }
      const nextCode = currentText.indexOf("`", codeIdx + 1);
      if (nextCode !== -1) {
        parts.push(<code key={keyIdx++} className="bg-[#21262d] px-1.5 py-0.5 rounded font-mono text-xs text-[#E6EDF2] border border-[#30363D]">{currentText.substring(codeIdx + 1, nextCode)}</code>);
        currentText = currentText.substring(nextCode + 1);
      } else {
        parts.push(currentText.substring(codeIdx));
        break;
      }
    }
  }

  return parts;
};

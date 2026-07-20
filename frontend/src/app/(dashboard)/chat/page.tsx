"use client";
import React from "react";
import { AIRChat } from "../../../components/dashboard/AIRChat";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const {
    githubRepos, repos, selectedRepo, selectRepository, messages, chatInput, setChatInput,
    handleSendMessage, chatLoading, traceActive, traceLogs, setTraceLogs, messagesEndRef, traceEndRef,
    branches, activeBranch, handleBranchSwitch
  } = useDashboard();

  return (
    <AIRChat 
      githubRepos={githubRepos}
      repos={repos}
      selectedRepo={selectedRepo}
      selectRepository={selectRepository}
      messages={messages}
      chatInput={chatInput}
      setChatInput={setChatInput}
      handleSendMessage={handleSendMessage}
      chatLoading={chatLoading}
      traceActive={traceActive}
      traceLogs={traceLogs}
      setTraceLogs={setTraceLogs}
      messagesEndRef={messagesEndRef}
      traceEndRef={traceEndRef}
      branches={branches}
      activeBranch={activeBranch}
      handleBranchSwitch={handleBranchSwitch}
    />
  );
}

"use client";
import React from "react";
import { CodeExplorer } from "../../../components/dashboard/CodeExplorer";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const {
    githubRepos, repos, selectedRepo, selectRepository, isFileChatOpen, setIsFileChatOpen,
    isTreePanelOpen, setIsTreePanelOpen, selectedFilePath, selectedFileContent, handleExplainFile,
    fileExplainLoading, fileChatMessages, fileChatInput, setFileChatInput, handleSendFileChatMessage,
    fileChatLoading, fileTree, expandedFolders, toggleFolder, handleFileSelect, fileChatEndRef
  } = useDashboard();

  return (
    <CodeExplorer 
      githubRepos={githubRepos}
      repos={repos}
      selectedRepo={selectedRepo}
      selectRepository={selectRepository}
      isFileChatOpen={isFileChatOpen}
      setIsFileChatOpen={setIsFileChatOpen}
      isTreePanelOpen={isTreePanelOpen}
      setIsTreePanelOpen={setIsTreePanelOpen}
      selectedFilePath={selectedFilePath}
      selectedFileContent={selectedFileContent}
      handleExplainFile={handleExplainFile}
      fileExplainLoading={fileExplainLoading}
      fileChatMessages={fileChatMessages}
      fileChatInput={fileChatInput}
      setFileChatInput={setFileChatInput}
      handleSendFileChatMessage={handleSendFileChatMessage}
      fileChatLoading={fileChatLoading}
      fileTree={fileTree}
      expandedFolders={expandedFolders}
      toggleFolder={toggleFolder}
      handleFileSelect={handleFileSelect}
      fileChatEndRef={fileChatEndRef}
    />
  );
}

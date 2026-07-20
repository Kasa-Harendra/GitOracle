"use client";
import React from "react";
import { RepositoriesHub } from "../../../components/dashboard/RepositoriesHub";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const { 
    githubRepos, githubLoading, fetchGithubRepos, token, selectedRepo, selectRepository, repos,
    isRepoPanelOpen, setIsRepoPanelOpen, activeBranch, branches, handleBranchSwitch, fileTree,
    expandedFolders, toggleFolder, allowedExtensions, setAllowedExtensions,
    handleIndexRepo, handleDeleteIndex, indexing, indexingLogs, selectedFilePath, handleFileSelect
  } = useDashboard();

  return (
    <RepositoriesHub 
      githubRepos={githubRepos}
      githubLoading={githubLoading}
      fetchGithubRepos={fetchGithubRepos}
      token={token}
      selectedRepo={selectedRepo}
      selectRepository={selectRepository}
      repos={repos}
      isRepoPanelOpen={isRepoPanelOpen}
      setIsRepoPanelOpen={setIsRepoPanelOpen}
      activeBranch={activeBranch}
      branches={branches}
      handleBranchSwitch={handleBranchSwitch}
      fileTree={fileTree}
      expandedFolders={expandedFolders}
      toggleFolder={toggleFolder}
      allowedExtensions={allowedExtensions}
      setAllowedExtensions={setAllowedExtensions}
      handleIndexRepo={handleIndexRepo}
      handleDeleteIndex={handleDeleteIndex}
      indexing={indexing}
      indexingLogs={indexingLogs}
      selectedFilePath={selectedFilePath}
      handleFileSelect={handleFileSelect}
    />
  );
}

"use client";
import React from "react";
import { ReadmeGenerator } from "../../../components/dashboard/ReadmeGenerator";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const {
    token, githubRepos, repos, selectedRepo, selectRepository, readmePrompt, setReadmePrompt,
    handleGenerateReadme, readmeLoading, generatedReadme, setGeneratedReadme
  } = useDashboard();

  return (
    <ReadmeGenerator 
      token={token}
      githubRepos={githubRepos}
      repos={repos}
      selectedRepo={selectedRepo}
      selectRepository={selectRepository}
      readmePrompt={readmePrompt}
      setReadmePrompt={setReadmePrompt}
      handleGenerateReadme={handleGenerateReadme}
      readmeLoading={readmeLoading}
      generatedReadme={generatedReadme}
      setGeneratedReadme={setGeneratedReadme}
    />
  );
}

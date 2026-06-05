"use client";
import React from "react";
import { PullRequests } from "../../../components/dashboard/PullRequests";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const {
    selectedRepo, pullRequests, selectedPR, handlePRSelect, prDetails,
    handlePRSummary, prSummaryLoading, prSummary
  } = useDashboard();

  return (
    <PullRequests 
      selectedRepo={selectedRepo}
      pullRequests={pullRequests}
      selectedPR={selectedPR}
      handlePRSelect={handlePRSelect}
      prDetails={prDetails}
      handlePRSummary={handlePRSummary}
      prSummaryLoading={prSummaryLoading}
      prSummary={prSummary}
    />
  );
}

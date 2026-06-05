"use client";
import React from "react";
import { DashboardOverview } from "../../../components/dashboard/DashboardOverview";
import { useDashboard } from "../../../context/DashboardContext";

export default function Page() {
  const { user, totalStarsCount, totalReposCount, publicReposCount, privateReposCount } = useDashboard();
  return (
    <DashboardOverview 
      user={user}
      totalStarsCount={totalStarsCount}
      totalReposCount={totalReposCount}
      publicReposCount={publicReposCount}
      privateReposCount={privateReposCount}
    />
  );
}

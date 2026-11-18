/**
 * @file screen-outlet.tsx
 * @description View switcher rendering the active feature screen component.
 */

import React from "react";
import { SnapshotView } from "@/components/feature/snapshot/snapshot-view";
import { PlanView } from "@/components/feature/plan/plan-view";
import { ImpactView } from "@/components/feature/impact/impact-view";
import { HomeToolkitView } from "@/components/feature/home-toolkit/home-toolkit-view";
import { AlternativesView } from "@/components/feature/alternatives/alternatives-view";
import { ProfileView } from "@/components/feature/household/profile-view";
import { AskView } from "@/components/feature/ask/ask-view";
import { CommunityView } from "@/components/feature/community/community-view";
import { PrivacyView } from "@/components/feature/privacy/privacy-view";

export function ScreenOutlet({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "snapshot":
      return <SnapshotView />;
    case "plan":
      return <PlanView />;
    case "community":
      return <CommunityView />;
    case "impact":
      return <ImpactView />;
    case "hacks":
      return <HomeToolkitView />;
    case "alternatives":
      return <AlternativesView />;
    case "household":
      return <ProfileView />;
    case "ask":
      return <AskView />;
    case "privacy":
      return <PrivacyView />;
    default:
      return <SnapshotView />;
  }
}

/**
 * @file axe.test.tsx
 * @description Accessibility testing of Tier 1 feature screens with jest-axe (WCAG 2.2 AA).
 * Addresses problem-statement: Accessibility (WCAG 2.2 AA), component tests with jest-axe.
 */

import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AlternativesView } from "../alternatives/alternatives-view";
import { HomeToolkitView } from "../home-toolkit/home-toolkit-view";
import { PrivacyView } from "../privacy/privacy-view";
import { PlanView } from "../plan/plan-view";
import { ProfileView } from "../household/profile-view";
import { AskView } from "../ask/ask-view";

expect.extend(toHaveNoViolations);

describe("Tier 1 Components Accessibility (WCAG 2.2 AA via jest-axe)", () => {
  it("renders AlternativesView with no accessibility violations", async () => {
    const { container } = render(<AlternativesView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders HomeToolkitView with no accessibility violations", async () => {
    const { container } = render(<HomeToolkitView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders PrivacyView with no accessibility violations", async () => {
    const { container } = render(<PrivacyView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders PlanView with no accessibility violations", async () => {
    const { container } = render(<PlanView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders ProfileView with no accessibility violations", async () => {
    const { container } = render(<ProfileView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders AskView with no accessibility violations", async () => {
    const { container } = render(<AskView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

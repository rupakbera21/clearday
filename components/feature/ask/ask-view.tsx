/**
 * @file ask-view.tsx
 * @description Ask Clearday Q&A interface with symptom interception and multi-lingual options.
 * Addresses problem-statement: Ask Clearday, grounded Q&A, Health safety (red-flag symptoms).
 */

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { AskResponse } from "@/schemas/ai";
import { getKnowledgeItemDisplay } from "@/data/knowledge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

const QUICK_QUESTIONS = [
  "Are cloth masks effective against smog?",
  "When is it safe to jog or exercise outdoors?",
  "Should I run my air purifier all night?",
  "How can I seal windows without weatherstripping?",
];

type SupportedLang = "en" | "hi" | "bn" | "ur" | "pa";

function QuickQuestionsBar({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap pt-1">
      <span style={{ color: "var(--text-muted)" }} className="text-xs font-medium mr-1 select-none">
        Common questions:
      </span>
      {QUICK_QUESTIONS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
          className="px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer text-left font-medium shadow-2xs hover:bg-black/5 dark:hover:bg-white/5"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function AskAnswerCard({ response, onSpeak }: { response: AskResponse; onSpeak?: (text: string) => void }) {
  const isEmergency = response.citedKnowledgeIds.includes("kb_symptoms_urgent_care");

  return (
    <div
      style={{
        backgroundColor: isEmergency ? "var(--bg-aqi-very-poor)" : "var(--bg-surface-elevated)",
        borderColor: isEmergency ? "var(--color-aqi-very-poor)" : "var(--border-subtle)",
      }}
      className="p-5 rounded-2xl border transition-colors space-y-4 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          style={{ color: isEmergency ? "var(--color-aqi-very-poor)" : "var(--accent)" }}
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
        >
          <Icon name={isEmergency ? "alert-triangle" : "shield-check"} size={16} />
          {isEmergency ? "Emergency Notice" : "Clearday Advisory"}
        </span>
        <div className="flex items-center gap-2">
          {onSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(response.answer)}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
              className="text-2xs flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="Read answer aloud"
            >
              <Icon name="volume" size={13} />
              Read Aloud
            </button>
          )}
          {response.isRuleBased && (
            <Badge variant="outline" showShape={false}>Rule-Based</Badge>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{response.answer}</p>

      {response.citedKnowledgeIds.length > 0 && (
        <div className="flex items-center gap-2 text-2xs pt-2 border-t flex-wrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          <span>Knowledge References:</span>
          {response.citedKnowledgeIds.map((id) => {
            const display = getKnowledgeItemDisplay(id);
            return (
              <span
                key={id}
                title={id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
                className="px-2 py-0.5 rounded-md border font-medium"
              >
                {display.title}
              </span>
            );
          })}
        </div>
      )}

      <div className="pt-1 text-2xs italic" style={{ color: "var(--text-muted)" }}>
        {response.safetyNotice}
      </div>
    </div>
  );
}

function AskSearchBar({
  question,
  setQuestion,
  language,
  setLanguage,
  onAsk,
  isLoading,
}: {
  question: string;
  setQuestion: (v: string) => void;
  language: SupportedLang;
  setLanguage: (v: SupportedLang) => void;
  onAsk: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question (e.g. When can children play outside?)..."
          onKeyDown={(e) => e.key === "Enter" && onAsk()}
        />
      </div>

      <div className="flex gap-2">
        <Select
          aria-label="Response language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLang)}
          options={[
            { value: "en", label: "English" },
            { value: "hi", label: "Hindi" },
            { value: "bn", label: "Bengali" },
            { value: "ur", label: "Urdu" },
            { value: "pa", label: "Punjabi" },
          ]}
          className="text-xs w-36"
        />
        <Button
          variant="primary"
          onClick={onAsk}
          isLoading={isLoading}
          disabled={question.trim().length < 3}
        >
          Ask
        </Button>
      </div>
    </div>
  );
}

function speakAnswer(text: string, language: SupportedLang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-US";
  window.speechSynthesis.speak(utterance);
}

function useAskApi() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
  const profile = useAppStore((state) => state.householdProfile);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (textToAsk: string, language: SupportedLang) => {
    const q = textToAsk.trim();
    if (q.length < 3) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          locationName: selectedLocation?.name ?? "Current City",
          currentAqi: airSnapshot?.current.aqi.aqi,
          currentPm25: airSnapshot?.current.pm25,
          sensitiveGroupPresent: profile.members.some((m) => m.hasSensitiveCondition),
          language,
        }),
      });

      if (!res.ok) throw new Error("Failed to get an answer");
      const result = await res.json();
      if (result.data) setResponse(result.data as AskResponse);
    } catch {
      setError("Unable to answer at the moment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, response, error, handleAsk };
}

export function AskView() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<SupportedLang>("en");
  const { isLoading, response, error, handleAsk } = useAskApi();

  return (
    <section aria-label="Ask Clearday Q&A" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Ask Clearday
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Grounded air quality explanations, mask fit verification, and smog protection guidance.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-6 rounded-2xl border space-y-5 shadow-2xs"
      >
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span style={{ color: "var(--accent)" }}>
              <Icon name="message-square" size={20} />
            </span>
            <span>Community & Expert Q&A</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Ask practical questions on winter air pollution, household protection, masks, and purifier usage.
          </p>
        </div>

        <AskSearchBar
          question={question}
          setQuestion={setQuestion}
          language={language}
          setLanguage={setLanguage}
          onAsk={() => handleAsk(question, language)}
          isLoading={isLoading}
        />

        <QuickQuestionsBar
          onSelect={(q) => {
            setQuestion(q);
            void handleAsk(q, language);
          }}
        />

        {error && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium p-3 rounded-lg border" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)" }}>
            {error}
          </p>
        )}

        {response && <AskAnswerCard response={response} onSpeak={(text) => speakAnswer(text, language)} />}
      </div>
    </section>
  );
}

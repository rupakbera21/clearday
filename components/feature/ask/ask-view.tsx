/**
 * @file ask-view.tsx
 * @description Ask Clearday Q&A interface with symptom interception and multi-lingual options.
 * Addresses problem-statement: Ask Clearday, grounded Q&A, Health safety (red-flag symptoms).
 */

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { AskResponse } from "@/schemas/ai";
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
      <span className="text-xs text-slate-400 font-medium">Common questions:</span>
      {QUICK_QUESTIONS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className="px-2.5 py-1 text-xs rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer text-left"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function AskAnswerCard({ response }: { response: AskResponse }) {
  const isEmergency = response.citedKnowledgeIds.includes("kb_symptoms_urgent_care");

  return (
    <div
      className={`p-5 rounded-2xl border transition-colors space-y-4 ${
        isEmergency
          ? "bg-rose-950/80 border-rose-600 text-rose-100"
          : "bg-slate-800/70 border-slate-700 text-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <Icon name={isEmergency ? "alert-triangle" : "shield-check"} size={16} />
          {isEmergency ? "Emergency Notice" : "Clearday Advisory"}
        </span>
        {response.isRuleBased && (
          <Badge variant="outline" showShape={false}>Rule-Based</Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed">{response.answer}</p>

      {response.citedKnowledgeIds.length > 0 && (
        <div className="flex items-center gap-2 text-2xs text-slate-400 pt-2 border-t border-slate-700/60 flex-wrap">
          <span>Knowledge References:</span>
          {response.citedKnowledgeIds.map((id) => (
            <span key={id} className="px-1.5 py-0.5 rounded-sm bg-slate-900 text-slate-300 border border-slate-700">
              {id}
            </span>
          ))}
        </div>
      )}

      <div className="pt-1 text-2xs text-slate-400 italic">
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

export function AskView() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
  const profile = useAppStore((state) => state.householdProfile);

  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<SupportedLang>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (textToAsk: string) => {
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
          currentAqi: airSnapshot?.current.aqi.aqi ?? 250,
          currentPm25: airSnapshot?.current.pm25 ?? 150,
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

  return (
    <section aria-label="Ask Clearday Q&A" className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icon name="message-square" size={20} className="text-sky-400" />
            <span>Ask Clearday</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ask practical questions on winter air pollution, household protection, masks, and purifier usage.
          </p>
        </div>

        <AskSearchBar
          question={question}
          setQuestion={setQuestion}
          language={language}
          setLanguage={setLanguage}
          onAsk={() => handleAsk(question)}
          isLoading={isLoading}
        />

        <QuickQuestionsBar
          onSelect={(q) => {
            setQuestion(q);
            void handleAsk(q);
          }}
        />

        {error && (
          <p role="alert" className="text-xs text-rose-400 font-medium p-3 rounded-lg bg-rose-950/40 border border-rose-800">
            {error}
          </p>
        )}

        {response && <AskAnswerCard response={response} />}
      </div>
    </section>
  );
}

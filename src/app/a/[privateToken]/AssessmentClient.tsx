"use client";

import { useMemo, useState } from "react";

type QuestionView = {
  id: string;
  stem: string;
  options: { id: string; text: string }[];
  selectedOptionId?: string | null;
};

export function AssessmentClient({
  privateToken,
  questions
}: {
  privateToken: string;
  questions: QuestionView[];
}) {
  const firstUnanswered = Math.max(
    0,
    questions.findIndex((question) => !question.selectedOptionId)
  );
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>(
    Object.fromEntries(questions.map((question) => [question.id, question.selectedOptionId ?? undefined]))
  );
  const [startedAtByQuestion, setStartedAtByQuestion] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = questions[index];
  const completed = useMemo(
    () => questions.every((question) => answers[question.id]),
    [answers, questions]
  );

  async function choose(questionId: string, optionId: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: optionId }));
    setSaving(true);
    setError(null);
    const startedAt = startedAtByQuestion[questionId] ?? Date.now();
    setStartedAtByQuestion((currentStarted) => ({ ...currentStarted, [questionId]: startedAt }));
    const response = await fetch(`/api/assessments/${privateToken}/answers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questionId,
        selectedOptionId: optionId,
        responseTimeMs: Math.max(500, Date.now() - startedAt)
      })
    });
    setSaving(false);
    if (!response.ok) {
      setError("We could not save this answer. Please try again.");
    }
  }

  async function submit() {
    const response = await fetch(`/api/assessments/${privateToken}/submit`, { method: "POST" });
    if (response.ok) {
      window.location.reload();
      return;
    }
    setError("Please answer all 10 questions before submitting.");
  }

  return (
    <main className="shell stack question">
      <p className="pill">
        Question {index + 1} of {questions.length}
      </p>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <section className="panel">
        <h1>{current.stem}</h1>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="option"
              data-selected={answers[current.id] === option.id}
              onClick={() => choose(current.id, option.id)}
            >
              <strong>{option.id}</strong>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
        {saving ? <p className="lead">Saving...</p> : null}
        {error ? <p className="lead">{error}</p> : null}
      </section>
      <div className="grid">
        <button className="secondary" type="button" onClick={() => setIndex(Math.max(0, index - 1))}>
          Previous
        </button>
        {index < questions.length - 1 ? (
          <button type="button" onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}>
            Next
          </button>
        ) : (
          <button type="button" disabled={!completed} onClick={submit}>
            Submit
          </button>
        )}
      </div>
    </main>
  );
}

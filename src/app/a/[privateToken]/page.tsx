import Link from "next/link";
import { getAssessmentByToken } from "@/services/assessments";
import { getOwnershipHashFromCookie } from "@/services/identity";
import { messages } from "@/i18n/messages";
import { AssessmentClient } from "./AssessmentClient";
import { ReportActions } from "./ReportActions";

export default async function AssessmentPage({ params }: { params: Promise<{ privateToken: string }> }) {
  const { privateToken } = await params;
  const ownershipHash = await getOwnershipHashFromCookie();
  const result = await getAssessmentByToken(privateToken, ownershipHash);
  if (result.state === "missing") {
    return (
      <main className="shell stack">
        <h1>Assessment not found</h1>
        <Link className="button" href="/r/demo">
          Start My Own Readiness Check
        </Link>
      </main>
    );
  }
  if (result.state === "foreign_started") {
    return (
      <main className="shell stack">
        <h1>This assessment has already been started on another session.</h1>
        <Link className="button" href="/r/demo">
          Start My Own Readiness Check
        </Link>
      </main>
    );
  }

  const locale = result.assessment.language === "HI" ? "hi" : "en";
  const copy = messages[locale];
  const order = result.assessment.presentedOrder as { questionId: string; optionOrder: string[] }[];
  const answersByQuestion = new Map(result.assessment.answers.map((answer) => [answer.questionId, answer]));
  const questionsById = new Map(
    result.assessment.questionSet.questions.map((item) => [item.questionId, item.question])
  );

  if (result.state === "completed") {
    const snapshot = result.assessment.snapshots[0];
    const narrative = snapshot.narrative as { strongest: string; improvement: string; insight: string };
    const dimensions = snapshot.dimensionScores as Record<string, { label: string; score: number }>;
    return (
      <main className="shell stack">
        <section className="panel">
          <p className="pill">{copy.smallSample}</p>
          <h1>{copy.reportTitle}</h1>
          <div className="score">{snapshot.overallScore} / 100</div>
          <p className="lead">{narrative.insight}</p>
          <div className="grid">
            <div>
              <strong>Strongest area</strong>
              <p>{narrative.strongest}</p>
            </div>
            <div>
              <strong>Improvement area</strong>
              <p>{narrative.improvement}</p>
            </div>
            <div>
              <strong>Accuracy</strong>
              <p>
                {snapshot.rawCorrect} / {snapshot.totalQuestions}
              </p>
            </div>
          </div>
        </section>
        <section className="grid">
          {Object.entries(dimensions).map(([key, dimension]) => (
            <div className="panel" key={key}>
              <strong>{dimension.label}</strong>
              <p>{dimension.score}/100</p>
              <div className="bar">
                <span style={{ width: `${dimension.score}%` }} />
              </div>
            </div>
          ))}
        </section>
        <section className="panel stack">
          <h2>Question review</h2>
          {order.map((item, index) => {
            const question = questionsById.get(item.questionId);
            const answer = answersByQuestion.get(item.questionId);
            if (!question) return null;
            const options = question.options as { id: string; text: string }[];
            return (
              <details key={item.questionId}>
                <summary>
                  {index + 1}. {answer?.selectedOptionId === question.correctOptionId ? "Correct" : "Review"} -{" "}
                  {question.topicCode}
                </summary>
                <p>{question.stem}</p>
                <p>Your answer: {answer?.selectedOptionId ?? "Skipped"}</p>
                <p>Correct answer: {question.correctOptionId}</p>
                <p>{question.explanation}</p>
                <ul>
                  {item.optionOrder.map((optionId) => {
                    const option = options.find((candidate) => candidate.id === optionId);
                    return option ? <li key={option.id}>{`${option.id}. ${option.text}`}</li> : null;
                  })}
                </ul>
              </details>
            );
          })}
        </section>
        <ReportActions assessmentId={result.assessment.id} score={snapshot.overallScore} privateToken={privateToken} />
      </main>
    );
  }

  const questions = order.map((item) => {
    const question = questionsById.get(item.questionId);
    if (!question) throw new Error("Question order is invalid");
    const options = question.options as { id: string; text: string }[];
    return {
      id: question.id,
      stem: question.stem,
      selectedOptionId: answersByQuestion.get(question.id)?.selectedOptionId,
      options: item.optionOrder.map((id) => options.find((option) => option.id === id)).filter(Boolean) as {
        id: string;
        text: string;
      }[]
    };
  });
  return <AssessmentClient privateToken={privateToken} questions={questions} />;
}

import { prisma } from "@/db/client";
import { getExistingIdentity } from "@/services/identity";

export default async function ProgressPage() {
  const identity = await getExistingIdentity();
  if (!identity) {
    return (
      <main className="shell stack">
        <h1>Progress</h1>
        <section className="panel">
          <p className="lead">No readiness snapshots yet.</p>
        </section>
      </main>
    );
  }
  const snapshots = await prisma.readinessSnapshot.findMany({
    where: { visitorId: identity.visitor.id },
    orderBy: { createdAt: "asc" },
    include: { assessment: true }
  });
  return (
    <main className="shell stack">
      <h1>Progress</h1>
      <section className="panel stack">
        {snapshots.length === 0 ? <p className="lead">No readiness snapshots yet.</p> : null}
        {snapshots.map((snapshot, index) => (
          <div key={snapshot.id}>
            <strong>Check {index + 1}</strong>
            <p>
              {snapshot.assessment.examType} {snapshot.assessment.stageCode}: {snapshot.overallScore}/100
              {index > 0 ? ` (${snapshot.overallScore - snapshots[index - 1].overallScore >= 0 ? "+" : ""}${snapshot.overallScore - snapshots[index - 1].overallScore})` : ""}
            </p>
            <div className="bar">
              <span style={{ width: `${snapshot.overallScore}%` }} />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getExistingIdentity } from "@/services/identity";
import { openCheckpoint } from "@/services/assessments";

export default async function NextCheckpointPage({ params }: { params: Promise<{ signedToken: string }> }) {
  const { signedToken } = await params;
  const identity = await getExistingIdentity();
  if (!identity) {
    return (
      <main className="shell stack">
        <h1>This checkpoint needs the browser that created it.</h1>
        <Link className="button" href="/r/demo">
          Start My Own Readiness Check
        </Link>
      </main>
    );
  }
  const result = await openCheckpoint(signedToken, identity.ownershipKeyHash);
  if (result.state === "created") redirect(`/a/${result.privateToken}`);
  if (result.state === "not_ready") {
    return (
      <main className="shell stack">
        <h1>Your next checkpoint is not ready yet.</h1>
        <p className="lead">Come back on {result.checkpoint.dueAt.toLocaleString()}.</p>
      </main>
    );
  }
  if (result.state === "consumed") {
    return (
      <main className="shell stack">
        <h1>This checkpoint has already been used.</h1>
        <a className="button" href="/progress">
          View Progress
        </a>
      </main>
    );
  }
  return (
    <main className="shell stack">
      <h1>This checkpoint link is invalid or expired.</h1>
      <Link className="button" href="/r/demo">
        Start My Own Readiness Check
      </Link>
    </main>
  );
}

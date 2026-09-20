import { prisma } from "@/db/client";
import { requireAdmin } from "@/security/admin";

export default async function QuestionsAdminPage() {
  await requireAdmin();
  const sets = await prisma.questionSet.findMany({
    include: { questions: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return (
    <main className="shell stack">
      <h1>Question Sets</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Cache key</th>
            <th>Status</th>
            <th>Source</th>
            <th>Usage</th>
            <th>Questions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => (
            <tr key={set.id}>
              <td>{set.cacheKey}</td>
              <td>{set.validationStatus}</td>
              <td>{set.sourceType}</td>
              <td>{set.usageCount}</td>
              <td>{set.questions.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

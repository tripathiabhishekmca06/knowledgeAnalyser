"use client";

import { useState } from "react";

export function ReportActions({
  assessmentId,
  score,
  privateToken
}: {
  assessmentId: string;
  score: number;
  privateToken: string;
}) {
  const [days, setDays] = useState<7 | 10>(7);
  const [slot, setSlot] = useState<"morning" | "afternoon" | "evening">("morning");
  const [links, setLinks] = useState<{ nextUrl: string; googleUrl: string; icsUrl: string; whatsappUrl: string } | null>(
    null
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function createCheckpoint() {
    const response = await fetch("/api/checkpoints", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assessmentId, days, slot })
    });
    if (response.ok) setLinks(await response.json());
  }

  async function createShare(includeScore: boolean) {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assessmentId, includeScore })
    });
    if (response.ok) {
      const data = (await response.json()) as { publicUrl: string };
      setShareUrl(data.publicUrl);
    }
  }

  return (
    <section className="panel stack">
      <h2>Choose your next readiness checkpoint</h2>
      <div className="grid">
        <label>
          Days
          <select value={days} onChange={(event) => setDays(Number(event.target.value) as 7 | 10)}>
            <option value={7}>7 days</option>
            <option value={10}>10 days</option>
          </select>
        </label>
        <label>
          Time
          <select value={slot} onChange={(event) => setSlot(event.target.value as "morning")}>
            <option value="morning">Morning 08:00</option>
            <option value="afternoon">Afternoon 15:00</option>
            <option value="evening">Evening 19:00</option>
          </select>
        </label>
      </div>
      <button type="button" onClick={createCheckpoint}>
        Set My Next Check
      </button>
      {links ? (
        <div className="grid">
          <a className="button secondary" href={links.googleUrl} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
          <a className="button secondary" href={links.icsUrl}>
            Add to Calendar
          </a>
          <a className="button secondary" href={links.whatsappUrl} target="_blank" rel="noreferrer">
            Save on WhatsApp
          </a>
          <a className="button secondary" href={links.nextUrl}>
            Copy Reminder Link
          </a>
        </div>
      ) : null}
      <p className="lead">We will not send automated WhatsApp messages unless you explicitly enable that feature in the future.</p>
      <div className="grid">
        <button type="button" className="secondary" onClick={() => createShare(false)}>
          Share without score
        </button>
        <button type="button" className="secondary" onClick={() => createShare(true)}>
          Share with score
        </button>
      </div>
      {shareUrl ? (
        <p className="lead">
          Share challenge: <a href={shareUrl}>{shareUrl}</a>
        </p>
      ) : null}
      <a className="button warn" href={`/a/${privateToken}`}>
        Review answers and explanations ({score}/100)
      </a>
    </section>
  );
}

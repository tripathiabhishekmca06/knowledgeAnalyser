import { createEvent } from "ics";
import { env } from "@/config/env";

export interface ReminderProvider {
  createReminder(input: ReminderInput): Promise<ReminderArtifact>;
}

export type ReminderInput = {
  title: string;
  description: string;
  dueAt: Date;
  continueUrl: string;
};

export type ReminderArtifact = {
  googleUrl: string;
  icsText: string;
};

export class CalendarReminderProvider implements ReminderProvider {
  async createReminder(input: ReminderInput): Promise<ReminderArtifact> {
    const dates: [number, number, number, number, number] = [
      input.dueAt.getFullYear(),
      input.dueAt.getMonth() + 1,
      input.dueAt.getDate(),
      input.dueAt.getHours(),
      input.dueAt.getMinutes()
    ];
    const description = `${input.description}\n\nContinue:\n${input.continueUrl}`;
    const googleUrl = new URL("https://calendar.google.com/calendar/render");
    googleUrl.searchParams.set("action", "TEMPLATE");
    googleUrl.searchParams.set("text", input.title);
    googleUrl.searchParams.set("details", description);
    googleUrl.searchParams.set("dates", `${toGoogleDate(input.dueAt)}/${toGoogleDate(new Date(input.dueAt.getTime() + 20 * 60 * 1000))}`);
    const { value } = createEvent({
      title: input.title,
      description,
      start: dates,
      duration: { minutes: 20 },
      url: input.continueUrl
    });
    return { googleUrl: googleUrl.toString(), icsText: value ?? "" };
  }
}

export class WhatsAppSelfShareProvider {
  buildDeepLink(input: { text: string }) {
    const base = env.WHATSAPP_NUMBER ? `https://wa.me/${env.WHATSAPP_NUMBER}` : "https://wa.me/";
    const url = new URL(base);
    url.searchParams.set("text", input.text);
    return url.toString();
  }
}

export class ManualReminderProvider {
  createCopyText(input: ReminderInput) {
    return `${input.title}\n\n${input.description}\n\nContinue:\n${input.continueUrl}`;
  }
}

function toGoogleDate(date: Date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

export type Locale = "en" | "hi";

export const messages = {
  en: {
    brand: "Readiness",
    landingTitle: "How ready are you for your government exam?",
    landingSub: "10 questions • 4–8 minutes • First readiness check free",
    cta: "Check My Readiness",
    trust: ["No app download", "No long registration", "Instant readiness snapshot"],
    exam: "Target exam",
    stage: "Preparation stage",
    language: "Language",
    start: "Start assessment",
    reportTitle: "Your Current Readiness Snapshot",
    smallSample: "Initial readiness snapshot based on this diagnostic.",
    nextCheck: "Set My Next Check",
    saveWhatsapp: "Save on WhatsApp",
    calendar: "Add to Google Calendar",
    downloadIcs: "Add to Calendar",
    copyLink: "Copy Reminder Link"
  },
  hi: {
    brand: "Readiness",
    landingTitle: "आप अपनी सरकारी परीक्षा के लिए कितने तैयार हैं?",
    landingSub: "10 प्रश्न • 4–8 मिनट • पहली readiness check free",
    cta: "मेरी तैयारी जांचें",
    trust: ["ऐप डाउनलोड नहीं", "लंबा registration नहीं", "तुरंत readiness snapshot"],
    exam: "लक्ष्य परीक्षा",
    stage: "तैयारी का चरण",
    language: "भाषा",
    start: "Assessment शुरू करें",
    reportTitle: "आपका Current Readiness Snapshot",
    smallSample: "यह शुरुआती snapshot इस diagnostic पर आधारित है.",
    nextCheck: "Next Check सेट करें",
    saveWhatsapp: "WhatsApp पर सेव करें",
    calendar: "Google Calendar में जोड़ें",
    downloadIcs: "Calendar में जोड़ें",
    copyLink: "Reminder Link Copy करें"
  }
} satisfies Record<Locale, Record<string, string | string[]>>;

export function t(locale: Locale, key: keyof typeof messages.en): string {
  const value = messages[locale][key];
  return Array.isArray(value) ? value.join(" ") : value;
}

export type ExamSeed = {
  examType: string;
  displayName: string;
  stages: { code: string; labelEn: string; labelHi: string }[];
  topics: { code: string; nameEn: string; nameHi: string }[];
};

export const examSeeds: ExamSeed[] = [
  {
    examType: "UPSC_CSE",
    displayName: "UPSC Civil Services",
    stages: [
      { code: "JUST_STARTED", labelEn: "Just Started", labelHi: "अभी शुरू किया" },
      { code: "PRELIMS", labelEn: "Preparing for Prelims", labelHi: "Prelims की तैयारी" },
      { code: "MAINS", labelEn: "Preparing for Mains", labelHi: "Mains की तैयारी" },
      { code: "BOTH", labelEn: "Preparing for Both", labelHi: "Prelims और Mains दोनों" },
      { code: "ATTEMPTED", labelEn: "Already Attempted UPSC", labelHi: "UPSC attempt कर चुके हैं" }
    ],
    topics: [
      { code: "POLITY", nameEn: "Polity", nameHi: "राजव्यवस्था" },
      { code: "HISTORY", nameEn: "History", nameHi: "इतिहास" },
      { code: "GEOGRAPHY", nameEn: "Geography", nameHi: "भूगोल" },
      { code: "ECONOMY", nameEn: "Economy", nameHi: "अर्थव्यवस्था" },
      { code: "ENVIRONMENT", nameEn: "Environment", nameHi: "पर्यावरण" },
      { code: "SCIENCE", nameEn: "Science and Technology", nameHi: "विज्ञान और तकनीक" },
      { code: "REASONING", nameEn: "CSAT / Reasoning", nameHi: "CSAT / Reasoning" }
    ]
  },
  {
    examType: "UPPSC_PCS",
    displayName: "UPPSC PCS",
    stages: [
      { code: "FOUNDATION", labelEn: "Foundation", labelHi: "Foundation" },
      { code: "PRELIMS", labelEn: "Preparing for Prelims", labelHi: "Prelims की तैयारी" },
      { code: "MAINS", labelEn: "Preparing for Mains", labelHi: "Mains की तैयारी" }
    ],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "UP_GK", nameEn: "Uttar Pradesh GK", nameHi: "उत्तर प्रदेश GK" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  },
  {
    examType: "UPSSSC_PET",
    displayName: "UPSSSC PET",
    stages: [{ code: "GENERAL", labelEn: "General Preparation", labelHi: "सामान्य तैयारी" }],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "HINDI", nameEn: "Hindi", nameHi: "हिन्दी" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  },
  {
    examType: "SSC_CGL",
    displayName: "SSC CGL",
    stages: [{ code: "TIER_1", labelEn: "Tier 1", labelHi: "Tier 1" }],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "QUANT", nameEn: "Quantitative Aptitude", nameHi: "गणित" },
      { code: "ENGLISH", nameEn: "English", nameHi: "English" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  },
  {
    examType: "SSC_CHSL",
    displayName: "SSC CHSL",
    stages: [{ code: "TIER_1", labelEn: "Tier 1", labelHi: "Tier 1" }],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "QUANT", nameEn: "Quantitative Aptitude", nameHi: "गणित" },
      { code: "ENGLISH", nameEn: "English", nameHi: "English" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  },
  {
    examType: "RRB_NTPC",
    displayName: "RRB NTPC",
    stages: [{ code: "CBT_1", labelEn: "CBT 1", labelHi: "CBT 1" }],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "MATH", nameEn: "Mathematics", nameHi: "गणित" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  },
  {
    examType: "OTHER_GOVT",
    displayName: "Other Government Exam",
    stages: [{ code: "GENERAL", labelEn: "General Preparation", labelHi: "सामान्य तैयारी" }],
    topics: [
      { code: "GA", nameEn: "General Awareness", nameHi: "सामान्य जागरूकता" },
      { code: "REASONING", nameEn: "Reasoning", nameHi: "Reasoning" }
    ]
  }
];

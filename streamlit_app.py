import math
import time
import urllib.parse

import streamlit as st


CAMPAIGN_CODE = "UPSC-AZM-001"

QUESTIONS = [
    {
        "domain": "Polity",
        "prompt": "Which part of the Constitution of India contains the Fundamental Duties?",
        "options": [
            "Part III",
            "Part IVA",
            "Part V",
            "Part IX",
        ],
        "answer": "Part IVA",
        "explanation": "Fundamental Duties are listed in Part IVA, Article 51A.",
    },
    {
        "domain": "Polity",
        "prompt": "The power of judicial review in India is mainly associated with which institution?",
        "options": [
            "Election Commission",
            "Supreme Court and High Courts",
            "Comptroller and Auditor General",
            "Finance Commission",
        ],
        "answer": "Supreme Court and High Courts",
        "explanation": "Constitutional courts can examine laws and executive action for constitutional validity.",
    },
    {
        "domain": "Modern History",
        "prompt": "The Non-Cooperation Movement was withdrawn after which event?",
        "options": [
            "Jallianwala Bagh massacre",
            "Chauri Chaura incident",
            "Dandi March",
            "Poona Pact",
        ],
        "answer": "Chauri Chaura incident",
        "explanation": "Gandhi withdrew the movement in 1922 after violence at Chauri Chaura.",
    },
    {
        "domain": "Ancient History",
        "prompt": "Ashoka's inscriptions were mostly written in which script in the north-western region?",
        "options": [
            "Brahmi",
            "Kharosthi",
            "Devanagari",
            "Grantha",
        ],
        "answer": "Kharosthi",
        "explanation": "Most inscriptions used Brahmi, but the north-west also used Kharosthi.",
    },
    {
        "domain": "Geography",
        "prompt": "The Western Ghats are an important factor for rainfall on India's west coast mainly because they:",
        "options": [
            "block the north-east monsoon",
            "cause orographic rainfall from south-west monsoon winds",
            "create winter cyclones",
            "reduce humidity over the Arabian Sea",
        ],
        "answer": "cause orographic rainfall from south-west monsoon winds",
        "explanation": "Moist south-west monsoon winds rise over the Ghats and produce heavy orographic rain.",
    },
    {
        "domain": "Geography",
        "prompt": "Which soil type is generally associated with the Deccan Trap region?",
        "options": [
            "Alluvial soil",
            "Black cotton soil",
            "Laterite soil",
            "Desert soil",
        ],
        "answer": "Black cotton soil",
        "explanation": "Black soil is linked with basaltic parent material of the Deccan Trap.",
    },
    {
        "domain": "Economy",
        "prompt": "If the Reserve Bank of India increases the repo rate, the likely immediate objective is to:",
        "options": [
            "increase money supply",
            "control inflationary pressure",
            "reduce tax revenue",
            "increase fiscal deficit",
        ],
        "answer": "control inflationary pressure",
        "explanation": "A higher repo rate can make borrowing costlier and help moderate inflation.",
    },
    {
        "domain": "Economy",
        "prompt": "Which of the following is a direct tax?",
        "options": [
            "Goods and Services Tax",
            "Customs duty",
            "Income tax",
            "Excise duty",
        ],
        "answer": "Income tax",
        "explanation": "Income tax is levied directly on income; GST and customs are indirect taxes.",
    },
    {
        "domain": "Environment",
        "prompt": "The term 'ecotone' refers to:",
        "options": [
            "a protected wetland",
            "a transition zone between two ecosystems",
            "a species found only in deserts",
            "a type of air pollutant",
        ],
        "answer": "a transition zone between two ecosystems",
        "explanation": "An ecotone is the transition area where two ecosystems meet.",
    },
    {
        "domain": "Environment",
        "prompt": "Which gas is the largest contributor to the natural greenhouse effect?",
        "options": [
            "Oxygen",
            "Nitrogen",
            "Water vapour",
            "Hydrogen",
        ],
        "answer": "Water vapour",
        "explanation": "Water vapour contributes significantly to the natural greenhouse effect.",
    },
    {
        "domain": "Science and Tech",
        "prompt": "In vaccines, an antigen is used mainly to:",
        "options": [
            "increase blood sugar",
            "trigger an immune response",
            "reduce oxygen level",
            "destroy red blood cells",
        ],
        "answer": "trigger an immune response",
        "explanation": "Antigens stimulate the immune system to recognize a pathogen or pathogen-like material.",
    },
    {
        "domain": "International Relations",
        "prompt": "The term 'Most Favoured Nation' in trade generally means:",
        "options": [
            "a country receives exclusive military support",
            "a country gets non-discriminatory trade treatment",
            "a country is exempt from all tariffs",
            "a country controls another country's currency",
        ],
        "answer": "a country gets non-discriminatory trade treatment",
        "explanation": "MFN means a trading partner is treated no worse than other comparable partners.",
    },
    {
        "domain": "Governance",
        "prompt": "Social audit is most closely associated with:",
        "options": [
            "citizen review of public programmes",
            "audit of private company profits",
            "military inspection",
            "judicial appointment",
        ],
        "answer": "citizen review of public programmes",
        "explanation": "Social audit enables citizens and communities to scrutinize public schemes and delivery.",
    },
    {
        "domain": "Ethics",
        "prompt": "A civil servant refusing a valuable gift from a contractor primarily reflects:",
        "options": [
            "conflict of interest avoidance",
            "delegated legislation",
            "fiscal federalism",
            "judicial activism",
        ],
        "answer": "conflict of interest avoidance",
        "explanation": "Avoiding gifts from interested parties helps preserve integrity and impartiality.",
    },
    {
        "domain": "CSAT",
        "prompt": "A train covers 180 km in 3 hours. What is its average speed?",
        "options": [
            "45 km/h",
            "50 km/h",
            "60 km/h",
            "90 km/h",
        ],
        "answer": "60 km/h",
        "explanation": "Average speed = distance / time = 180 / 3 = 60 km/h.",
    },
]


def readiness_band(score_percent: int) -> tuple[str, str]:
    if score_percent < 35:
        return (
            "Foundation Knowledge",
            "Your current score shows that core concepts need rebuilding before full-length test practice.",
        )
    if score_percent < 60:
        return (
            "Developing Knowledge",
            "You have some coverage, but the result shows clear gaps across static and applied areas.",
        )
    if score_percent < 80:
        return (
            "Prelims-Aware Knowledge",
            "Your base is useful. Now improve accuracy with PYQs, revision, and mixed-subject practice.",
        )
    return (
        "Strong Knowledge Readiness",
        "Your accuracy is strong for a quick diagnostic. Keep sharpening weak areas with timed practice.",
    )


def reset_scan() -> None:
    st.session_state.answers = {}
    st.session_state.submitted = False
    st.session_state.plan_requested = False


def unique_subjects(subjects: list[str], limit: int = 5) -> list[str]:
    return list(dict.fromkeys(subjects))[:limit]


def show_loading_overlay() -> None:
    overlay = st.empty()
    overlay.markdown(
        """
        <div class="loading-overlay">
          <div class="loading-card">
            <div class="spinner"></div>
            <div class="loading-title">Analyzing your UPSC knowledge snapshot</div>
            <div class="loading-copy">Checking accuracy, weak areas, and next-step plan...</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    time.sleep(1.4)
    overlay.empty()


def main() -> None:
    st.set_page_config(
        page_title="UPSC Readiness Scan",
        page_icon="RS",
        layout="centered",
        initial_sidebar_state="collapsed",
    )

    st.markdown(
        """
        <style>
        .main .block-container { max-width: 900px; padding-top: 2rem; }
        .metric-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            background: #ffffff;
        }
        .campaign {
            color: #475569;
            font-size: 0.9rem;
            margin-bottom: 0.4rem;
        }
        .result-band {
            border-left: 6px solid #0f766e;
            padding: 1rem;
            background: #ecfeff;
            border-radius: 8px;
        }
        .loading-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(6px);
        }
        .loading-card {
            width: min(92vw, 520px);
            border-radius: 8px;
            background: #ffffff;
            padding: 1.5rem;
            border: 1px solid #dbe4ef;
            text-align: center;
            box-shadow: 0 24px 80px rgba(15, 23, 42, 0.32);
        }
        .spinner {
            width: 46px;
            height: 46px;
            margin: 0 auto 1rem;
            border: 5px solid #ccfbf1;
            border-top-color: #0f766e;
            border-radius: 50%;
            animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.35rem;
        }
        .loading-copy { color: #475569; font-size: 0.95rem; }
        .paywall-card {
            border: 1px solid #fed7aa;
            background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
        }
        .price-pill {
            display: inline-block;
            background: #dc2626;
            color: #ffffff;
            border-radius: 999px;
            padding: 0.25rem 0.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .locked-preview {
            border: 1px dashed #fb923c;
            background: rgba(255, 247, 237, 0.75);
            border-radius: 8px;
            padding: 0.9rem;
            margin: 0.8rem 0;
        }
        .muted-note { color: #64748b; font-size: 0.92rem; }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(f"<div class='campaign'>Campaign {CAMPAIGN_CODE}</div>", unsafe_allow_html=True)
    st.title("UPSC Readiness Scan")
    st.caption("A quick knowledge diagnostic across common UPSC areas.")

    if "answers" not in st.session_state:
        st.session_state.answers = {}
    if "submitted" not in st.session_state:
        st.session_state.submitted = False

    with st.expander("Privacy note", expanded=False):
        st.write(
            "The free readiness scan does not ask for phone number, email, OTP, Aadhaar, or address. "
            "WhatsApp is requested only if you choose to activate the paid improvement plan. "
            "Answers are held only in your current browser session."
        )

    with st.form("readiness_scan"):
        for idx, question in enumerate(QUESTIONS, start=1):
            labels = question["options"]
            st.radio(
                f"{idx}. {question['prompt']}",
                labels,
                key=f"q_{idx}",
                index=None,
            )
        submitted = st.form_submit_button("See my knowledge snapshot", type="primary")

    if submitted:
        unanswered = [idx for idx in range(1, len(QUESTIONS) + 1) if st.session_state.get(f"q_{idx}") is None]
        if unanswered:
            st.warning(f"Please answer all questions before submitting. Missing: {', '.join(map(str, unanswered))}")
            st.session_state.submitted = False
        else:
            show_loading_overlay()
            st.session_state.submitted = True

    if st.session_state.submitted:
        correct = 0
        weak_domains: list[str] = []
        review_rows = []

        for idx, question in enumerate(QUESTIONS, start=1):
            selected = st.session_state.get(f"q_{idx}")
            is_correct = selected == question["answer"]
            correct += int(is_correct)
            review_rows.append((idx, question, selected, is_correct))
            if not is_correct:
                weak_domains.append(question["domain"])

        percent = math.floor((correct / len(QUESTIONS)) * 100)
        band, summary = readiness_band(percent)
        priority_subjects = unique_subjects(weak_domains)
        st.divider()
        st.markdown("<p class='muted-note'>Free diagnostic snapshot</p>", unsafe_allow_html=True)
        st.markdown(f"<div class='result-band'><h3>{band}</h3><p>{summary}</p></div>", unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("Knowledge score", f"{percent}%")
        col2.metric("Correct", f"{correct}/{len(QUESTIONS)}")
        col3.metric("Campaign", CAMPAIGN_CODE)

        st.subheader("Priority subject areas")
        if priority_subjects:
            for domain in priority_subjects:
                st.write(f"- {domain}")
        else:
            st.write("- Keep solving mixed-topic PYQs and timed mini-tests.")

        st.subheader("Free next steps")
        if priority_subjects:
            first_subjects = ", ".join(priority_subjects[:2])
            st.write(f"- Start with: {first_subjects}.")
        st.write("- Review the concepts behind wrong answers before solving more questions.")
        st.write("- Attempt one 30-minute mixed mini-test within the next 48 hours.")

        locked_subjects = ", ".join(priority_subjects) if priority_subjects else "revision and timed practice"
        st.markdown(
            f"""
            <div class="paywall-card">
              <div class="price-pill">Unlock for ₹29/month</div>
              <h3>Detailed UPSC improvement plan</h3>
              <p>Your free score is ready. The paid plan unlocks a 30-day roadmap based on: <b>{locked_subjects}</b>.</p>
              <div class="locked-preview">
                <b>Included after activation</b><br />
                - Full answer review with correct options and explanations<br />
                - 30-day subject-wise study plan<br />
                - Daily micro targets and practice prompts<br />
                - Weekly re-test reminder on WhatsApp
              </div>
              <p class="muted-note">First diagnostic is free. Detailed plan and follow-up support continue at ₹29/month.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("paid_plan_request"):
            st.subheader("Activate ₹29/month plan")
            name = st.text_input("Name")
            city = st.text_input("City")
            target_year = st.selectbox("Target exam year", ["2027", "2028", "2029", "Not sure yet"])
            whatsapp_number = st.text_input("WhatsApp number")
            plan_requested = st.form_submit_button("Continue on WhatsApp", type="primary")

        if plan_requested:
            missing_fields = [
                label
                for label, value in [
                    ("name", name),
                    ("city", city),
                    ("WhatsApp number", whatsapp_number),
                ]
                if not value.strip()
            ]
            if missing_fields:
                st.warning(f"Please enter: {', '.join(missing_fields)}.")
            else:
                st.session_state.plan_requested = True
                weak_text = ", ".join(priority_subjects) if priority_subjects else "no major weak area in this scan"
                activation_text = (
                    f"Hi, I want to activate the ₹29/month UPSC improvement plan. "
                    f"Name: {name}. City: {city}. Target year: {target_year}. "
                    f"Score: {percent}% ({correct}/{len(QUESTIONS)}). Weak areas: {weak_text}. "
                    f"Campaign: {CAMPAIGN_CODE}."
                )
                st.success("Your activation message is ready. Send it on WhatsApp to continue payment and onboarding.")
                st.link_button("Open WhatsApp activation", "https://wa.me/?text=" + urllib.parse.quote(activation_text))

        with st.expander("What unlocks after ₹29/month?", expanded=False):
            st.write("- Full answer key and explanations for this scan.")
            st.write("- Personal 30-day plan from your weak areas.")
            st.write("- Daily WhatsApp study target.")
            st.write("- Weekly progress check and repeat scan.")

        if st.session_state.get("plan_requested"):
            with st.expander("Paid-plan answer preview", expanded=False):
                for idx, question, selected, is_correct in review_rows:
                    marker = "Correct" if is_correct else "Review"
                    st.write(f"**{idx}. {question['domain']} - {marker}**")
                    st.write(f"Your answer: {selected}")
                    if not is_correct:
                        st.write(f"Correct answer: {question['answer']}")
                    st.caption(question["explanation"])

        share_text = (
            f"I completed the UPSC Knowledge Readiness Scan ({CAMPAIGN_CODE}) and scored {percent}% "
            f"as {band}."
        )
        whatsapp_url = "https://wa.me/?text=" + urllib.parse.quote(share_text)
        st.link_button("Share on WhatsApp", whatsapp_url)
        st.button("Restart scan", on_click=reset_scan)


if __name__ == "__main__":
    main()

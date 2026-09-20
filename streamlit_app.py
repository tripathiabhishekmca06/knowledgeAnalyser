import math
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
            "This public readiness scan does not ask for phone number, email, OTP, Aadhaar, or address. "
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
        st.divider()
        st.markdown(f"<div class='result-band'><h3>{band}</h3><p>{summary}</p></div>", unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("Knowledge score", f"{percent}%")
        col2.metric("Correct", f"{correct}/{len(QUESTIONS)}")
        col3.metric("Campaign", CAMPAIGN_CODE)

        st.subheader("Priority subject areas")
        if weak_domains:
            for domain in list(dict.fromkeys(weak_domains))[:5]:
                st.write(f"- {domain}")
        else:
            st.write("- Keep solving mixed-topic PYQs and timed mini-tests.")

        st.subheader("7-day action plan")
        st.write("- Day 1: Review every wrong question and write the concept behind it.")
        st.write("- Day 2-3: Revise the weakest two subjects from NCERT/basic notes.")
        st.write("- Day 4: Solve 25 PYQs from Polity, Economy, Geography, and Environment.")
        st.write("- Day 5: Make one-page error notes for repeated mistakes.")
        st.write("- Day 6: Attempt a mixed 30-minute mini-test.")
        st.write("- Day 7: Repeat a knowledge diagnostic and compare accuracy.")

        with st.expander("Answer review", expanded=False):
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

import math
import urllib.parse

import streamlit as st


CAMPAIGN_CODE = "UPSC-AZM-001"

QUESTIONS = [
    {
        "domain": "Study consistency",
        "prompt": "How many focused study hours did you average per day this week?",
        "options": [
            ("Less than 2 hours", 1),
            ("2 to 4 hours", 2),
            ("4 to 6 hours", 3),
            ("More than 6 hours", 4),
        ],
    },
    {
        "domain": "Syllabus coverage",
        "prompt": "How clearly can you map the UPSC CSE syllabus to your current notes?",
        "options": [
            ("I am still unsure about the syllabus", 1),
            ("I know the broad areas", 2),
            ("I can map most subjects", 3),
            ("I can map subjects, gaps, and revision status", 4),
        ],
    },
    {
        "domain": "Concept clarity",
        "prompt": "When you read a Polity or Economy topic, what usually happens?",
        "options": [
            ("I memorize lines without confidence", 1),
            ("I understand after repeated reading", 2),
            ("I can explain most concepts simply", 3),
            ("I can connect concepts with PYQs and current affairs", 4),
        ],
    },
    {
        "domain": "Current affairs",
        "prompt": "How often do you connect news with static subjects?",
        "options": [
            ("Rarely", 1),
            ("Sometimes", 2),
            ("Most weeks", 3),
            ("Almost daily", 4),
        ],
    },
    {
        "domain": "PYQ practice",
        "prompt": "How do you use previous year questions?",
        "options": [
            ("I have not started PYQs", 1),
            ("I solve them occasionally", 2),
            ("I solve and review them by topic", 3),
            ("I use them to guide notes, revision, and tests", 4),
        ],
    },
    {
        "domain": "Revision",
        "prompt": "What does your revision cycle look like?",
        "options": [
            ("No fixed revision cycle", 1),
            ("Revision happens near tests", 2),
            ("Weekly revision for important topics", 3),
            ("Planned spaced revision with error notes", 4),
        ],
    },
    {
        "domain": "Mock analysis",
        "prompt": "After a mock test, what do you do?",
        "options": [
            ("Only check the score", 1),
            ("Review some wrong answers", 2),
            ("Classify mistakes and update notes", 3),
            ("Track mistake patterns and change strategy", 4),
        ],
    },
    {
        "domain": "Answer writing",
        "prompt": "How comfortable are you writing structured mains answers?",
        "options": [
            ("Not started", 1),
            ("Can write but struggle with structure", 2),
            ("Can write a basic intro-body-conclusion", 3),
            ("Can write with examples, balance, and time control", 4),
        ],
    },
    {
        "domain": "Time management",
        "prompt": "How predictable is your weekly study plan?",
        "options": [
            ("Mostly unplanned", 1),
            ("Planned but often missed", 2),
            ("Mostly followed with small misses", 3),
            ("Tracked and adjusted every week", 4),
        ],
    },
    {
        "domain": "Exam confidence",
        "prompt": "If prelims were announced 90 days from now, how would you feel?",
        "options": [
            ("Very anxious and directionless", 1),
            ("Concerned but ready to start seriously", 2),
            ("Somewhat ready with clear gaps", 3),
            ("Prepared with a focused 90-day plan", 4),
        ],
    },
]


def readiness_band(score_percent: int) -> tuple[str, str]:
    if score_percent < 35:
        return (
            "Foundation Builder",
            "Your first win is structure: syllabus map, daily study blocks, and basic PYQ exposure.",
        )
    if score_percent < 60:
        return (
            "Momentum Builder",
            "You have started moving. The next leap comes from revision rhythm and mistake tracking.",
        )
    if score_percent < 80:
        return (
            "Exam Ready Builder",
            "Your base is strong. Focus now on mock analysis, speed, and weak-area precision.",
        )
    return (
        "High Readiness",
        "You are operating with strong habits. Protect consistency and refine edge cases.",
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
    st.caption("A quick self-check for aspirants to understand current preparation readiness.")

    if "answers" not in st.session_state:
        st.session_state.answers = {}
    if "submitted" not in st.session_state:
        st.session_state.submitted = False

    with st.expander("Privacy note", expanded=False):
        st.write(
            "This Streamlit preview does not ask for phone number, email, OTP, Aadhaar, or address. "
            "Answers are held only in your current browser session."
        )

    with st.form("readiness_scan"):
        for idx, question in enumerate(QUESTIONS, start=1):
            labels = [option[0] for option in question["options"]]
            st.radio(
                f"{idx}. {question['prompt']}",
                labels,
                key=f"q_{idx}",
            )
        submitted = st.form_submit_button("See my readiness snapshot", type="primary")

    if submitted:
        st.session_state.submitted = True

    if st.session_state.submitted:
        earned = 0
        maximum = len(QUESTIONS) * 4
        weak_domains: list[tuple[str, int]] = []

        for idx, question in enumerate(QUESTIONS, start=1):
            selected = st.session_state.get(f"q_{idx}")
            score = next(score for label, score in question["options"] if label == selected)
            earned += score
            if score <= 2:
                weak_domains.append((question["domain"], score))

        percent = math.floor((earned / maximum) * 100)
        band, summary = readiness_band(percent)
        st.divider()
        st.markdown(f"<div class='result-band'><h3>{band}</h3><p>{summary}</p></div>", unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("Readiness", f"{percent}%")
        col2.metric("Answered", f"{len(QUESTIONS)}")
        col3.metric("Campaign", CAMPAIGN_CODE)

        st.subheader("Priority focus")
        if weak_domains:
            for domain, _score in weak_domains[:4]:
                st.write(f"- {domain}")
        else:
            st.write("- Maintain consistency and increase full-length timed practice.")

        st.subheader("7-day action plan")
        st.write("- Day 1: Map syllabus gaps and mark three weak areas.")
        st.write("- Day 2-3: Revise one static subject block with PYQs.")
        st.write("- Day 4: Take a short sectional test.")
        st.write("- Day 5: Create an error-note page from test mistakes.")
        st.write("- Day 6: Connect current affairs to static notes.")
        st.write("- Day 7: Repeat the scan and compare your readiness.")

        share_text = (
            f"I completed the UPSC Readiness Scan ({CAMPAIGN_CODE}) and scored {percent}% "
            f"as {band}."
        )
        whatsapp_url = "https://wa.me/?text=" + urllib.parse.quote(share_text)
        st.link_button("Share on WhatsApp", whatsapp_url)
        st.button("Restart scan", on_click=reset_scan)


if __name__ == "__main__":
    main()

"""
HealthBridge_Al — Streamlit UI
Hinglish Symptom Checker with AI-powered preliminary diagnosis
"""

import os
import sys
import streamlit as st

# ── Working directory must be training/ so all relative paths resolve ─────────
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

# ─────────────────────────────────────────────────────────────────────────────
# 1. PAGE CONFIG  (must be very first Streamlit call)
# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="HealthBridge_Al",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────────────────────────────────────
# CSS — dark-friendly styling
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* Global font */
html, body, [class*="css"] { font-family: 'Segoe UI', sans-serif; }

/* Header gradient */
.header-box {
    background: linear-gradient(135deg, #1a6e3c 0%, #145a32 60%, #0b3d26 100%);
    border-radius: 14px;
    padding: 24px 32px;
    margin-bottom: 18px;
    color: #fff;
}
.header-box h1 { margin: 0; font-size: 2.2rem; }
.header-box p  { margin: 4px 0 0; opacity: 0.85; font-size: 1rem; }

/* Metric cards */
[data-testid="stMetric"] {
    background: rgba(26,110,60,0.12);
    border: 1px solid rgba(26,110,60,0.35);
    border-radius: 10px;
    padding: 10px 14px;
}

/* Progress bar labels */
.disease-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
}
.badge-high   { background: #c0392b; }
.badge-medium { background: #d35400; }
.badge-low    { background: #27ae60; }

/* Symptom tags */
.sym-tag {
    display: inline-block;
    background: #1a6e3c22;
    border: 1px solid #1a6e3c88;
    color: #2ecc71;
    border-radius: 20px;
    padding: 3px 12px;
    margin: 3px;
    font-size: 0.82rem;
}

/* Test card */
.test-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 16px;
    height: 100%;
}
.test-card h4 { margin: 0 0 6px; font-size: 1rem; }
.test-card p  { margin: 0; font-size: 0.85rem; opacity: 0.8; }

/* History timeline dot */
.timeline-dot { color: #2ecc71; font-size: 1.1rem; margin-right: 6px; }

/* Footer */
.footer { text-align:center; opacity:0.45; font-size:0.78rem; margin-top:30px; }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# Lazy imports (after chdir so modules resolve correctly)
# ─────────────────────────────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def _load_modules():
    from main         import diagnose
    from history_db   import get_all_patients, get_history_summary, get_history
    from report_generator import TEST_MAP, URGENCY_ADVICE
    return diagnose, get_all_patients, get_history_summary, get_history, TEST_MAP, URGENCY_ADVICE

try:
    diagnose, get_all_patients, get_history_summary, get_history, TEST_MAP, URGENCY_ADVICE = _load_modules()
except Exception as e:
    st.error(f"Pipeline load error: {e}")
    st.info("Make sure preprocess.py has been run and data/disease_profiles.json exists.")
    st.stop()

# ─────────────────────────────────────────────────────────────────────────────
# Session state defaults
# ─────────────────────────────────────────────────────────────────────────────
for key, default in {
    "last_result"        : None,
    "current_patient_id" : "P001",
    "input_text"         : "",
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# ─────────────────────────────────────────────────────────────────────────────
# 2. HEADER
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="header-box">
  <h1>🏥 HealthBridge_Al</h1>
  <p>Hinglish Symptom Checker &mdash; AI-powered preliminary diagnosis</p>
</div>
""", unsafe_allow_html=True)

st.warning("⚠️ Ye sirf AI suggestion hai. Hamesha registered doctor se milein.")

# ─────────────────────────────────────────────────────────────────────────────
# 3. SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🏥 HealthBridge_Al")
    st.markdown("---")

    # Patient ID input
    patient_id = st.text_input("**Patient ID**", value=st.session_state.current_patient_id)
    st.session_state.current_patient_id = patient_id

    st.markdown("---")

    # Previous patients list
    st.markdown("### 👥 Previous Patients")
    try:
        all_patients = get_all_patients()
    except Exception:
        all_patients = []

    if all_patients:
        for p in all_patients:
            if st.button(f"👤 {p}", key=f"pat_{p}", use_container_width=True):
                st.session_state.current_patient_id = p
                st.rerun()
    else:
        st.caption("No patients yet.")

    st.markdown("---")

    # Patient history timeline
    st.markdown(f"### 📅 History: {patient_id}")
    try:
        hist = get_history_summary(patient_id)
        summary = hist.get("summary", {})
        if summary:
            st.caption(f"Total days sick: **{hist['total_days_sick']}**")
            for date, syms in sorted(summary.items(), reverse=True)[:5]:
                st.markdown(f"📅 **{date}**: {', '.join(syms)}")
        else:
            st.caption("No history found for this patient.")
    except Exception:
        st.caption("History unavailable.")

    st.markdown("---")
    if st.button("🗑️ Clear my history", use_container_width=True):
        st.info("History clear feature coming soon!")

# ─────────────────────────────────────────────────────────────────────────────
# 4. MAIN INPUT SECTION
# ─────────────────────────────────────────────────────────────────────────────
col_left, col_right = st.columns([2, 1])

with col_left:
    st.markdown("### 💬 Apne symptoms describe karein")

    # Example buttons row
    ex_col1, ex_col2, ex_col3, ex_col4 = st.columns(4)
    examples = {
        "🤒 Bukhar + Sar dard"   : "2 din se bukhar hai aur sar mein dard ho raha hai",
        "🤢 Pet dard + Ulti"     : "pet mein dard hai, dast lag rahe hain, ulti bhi ho rahi hai",
        "😮 Khansi + Chest dard" : "khansi aa rahi hai aur chest mein dard hai, saans lene mein takleef",
        "🤕 Chakkar + Kamzori"   : "chakkar aa rahe hain aur bahut thakaan hai, aankhon ke peeche dard",
    }
    for col, (label, text) in zip([ex_col1, ex_col2, ex_col3, ex_col4], examples.items()):
        with col:
            if st.button(label, use_container_width=True):
                st.session_state.input_text = text

    # Text area
    user_text = st.text_area(
        "Symptoms (Hindi/English/Hinglish)",
        value=st.session_state.input_text,
        placeholder="Jaise: 2 din se bukhar hai, sar dard ho raha hai aur thakaan hai",
        height=120,
        label_visibility="collapsed",
    )
    st.session_state.input_text = user_text

    diagnose_btn = st.button("🔍 Diagnose Karein", type="primary", use_container_width=True)

with col_right:
    st.markdown("### 📊 Quick Stats")
    result = st.session_state.last_result

    if result and result.get("status") == "success":
        sym_count = len(result["detected_symptoms"])
        top_dis   = result["top_disease"]
        score     = result["top_score"]
        urgency   = result["urgency"]
        method    = result.get("method_used", "keyword")
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            st.metric("Symptoms Found", sym_count)
            st.metric("Confidence", f"{score:.1f}%")
        with col_m2:
            st.metric("Top Match", top_dis[:14] + ("…" if len(top_dis) > 14 else ""))
            color_map = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}
            st.metric("Urgency", f"{color_map.get(urgency, '')} {urgency}")
        st.metric("NLP Method", method.upper())
    else:
        st.info("Diagnosis ke baad stats yahan dikhenge.")

# ─────────────────────────────────────────────────────────────────────────────
# Run diagnosis on button click
# ─────────────────────────────────────────────────────────────────────────────
if diagnose_btn:
    if not user_text.strip():
        st.warning("Kuch toh likhein! Symptoms describe karein.")
    else:
        with st.spinner("🔍 Analyzing symptoms..."):
            result = diagnose(patient_id, user_text)
        st.session_state.last_result = result

        if result.get("status") == "no_symptoms":
            st.warning(f"⚠️ {result['message']}")
        elif result.get("status") == "error":
            st.error(f"❌ Error: {result['message']}")
        else:
            st.success("✅ Diagnosis ready!")
        st.rerun()

# ─────────────────────────────────────────────────────────────────────────────
# 5. RESULTS SECTION
# ─────────────────────────────────────────────────────────────────────────────
result = st.session_state.last_result

if result and result.get("status") == "success":
    st.markdown("---")
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Diagnosis Results",
        "📋 Full Report",
        "🧪 Recommended Tests",
        "📅 Symptom History",
    ])

    # ── TAB 1: Diagnosis Results ─────────────────────────────────────────────
    with tab1:
        # NLP Method badge
        _method = result.get("method_used", "keyword")
        _bconf  = result.get("bert_confidence", 0.0)
        _bsug   = result.get("bert_suggestion")
        if _method == "bert":
            st.success(f"BERT Neural Engine used ({_bconf:.0%} confidence)")
        elif _method == "hybrid":
            st.info("Hybrid: BERT + Keyword used")
        else:
            st.warning("Keyword Matching used (BERT confidence low)")
        if _bsug and _bconf >= 0.40:
            st.caption(f"BERT Suggestion: {_bsug} ({_bconf:.0%})")

        # Detected symptoms as tags
        st.markdown("#### ✅ Detected Symptoms")
        sym_html = "".join(
            f'<span class="sym-tag">{s} <small>[{w}]</small></span>'
            for s, w in result["detected_symptoms"].items()
        )
        st.markdown(sym_html, unsafe_allow_html=True)

        dur = result["duration_days"]
        st.markdown(f"**⏱️ Duration:** {dur} din ({dur} days)" if dur >= 0
                    else "**⏱️ Duration:** Unknown")

        st.markdown("---")
        st.markdown("#### 🏆 Top Disease Matches")

        badge_cls = {"HIGH": "badge-high", "MEDIUM": "badge-medium", "LOW": "badge-low"}

        # Re-fetch top 5 for display
        from matcher import match_with_history as _mwh
        matches = _mwh(patient_id, result["detected_symptoms"], top_k=5)

        for i, m in enumerate(matches, 1):
            urg   = m.get("urgency", "LOW")
            score = m["score"]
            badge = f'<span class="badge {badge_cls[urg]}">{urg}</span>'
            boost = " 🔁" if m.get("history_boost") else ""

            col_a, col_b = st.columns([3, 1])
            with col_a:
                st.markdown(
                    f'**#{i} {m["disease"]}** &nbsp; {badge}{boost}',
                    unsafe_allow_html=True
                )
                st.progress(score / 100)
            with col_b:
                st.metric("Score", f"{score:.1f}%")

            if m.get("missing_critical"):
                st.markdown(
                    f"⚠️ **Missing critical:** {', '.join(m['missing_critical'][:4])}",
                    unsafe_allow_html=True
                )
            st.markdown("")

    # ── TAB 2: Full Report ───────────────────────────────────────────────────
    with tab2:
        st.markdown("#### 📋 Full Medical Report")
        st.code(result["report"], language="text")
        st.download_button(
            label     = "📥 Report Download Karein",
            data      = result["report"],
            file_name = f"HealthBridge_{patient_id}.txt",
            mime      = "text/plain",
            use_container_width=True,
        )

    # ── TAB 3: Recommended Tests ─────────────────────────────────────────────
    with tab3:
        st.markdown("#### 🧪 Recommended Tests")

        from matcher import match_with_history as _mwh2
        top3 = _mwh2(patient_id, result["detected_symptoms"], top_k=3)

        cols = st.columns(3)
        badge_emoji = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}

        for col, m in zip(cols, top3):
            disease = m["disease"]
            tests   = TEST_MAP.get(disease, "Consult doctor for appropriate tests")
            urg     = m.get("urgency", "LOW")
            score   = m["score"]
            with col:
                st.markdown(f"""
<div class="test-card">
  <h4>{badge_emoji[urg]} {disease}</h4>
  <p><strong>Score:</strong> {score:.1f}%</p>
  <p><strong>Urgency:</strong> {urg}</p>
  <hr style="opacity:0.2;margin:8px 0">
  <p><strong>Tests:</strong><br>{tests}</p>
  <p><i>{URGENCY_ADVICE.get(urg, '')}</i></p>
</div>
""", unsafe_allow_html=True)

    # ── TAB 4: Symptom History ───────────────────────────────────────────────
    with tab4:
        st.markdown("#### 📅 Symptom History Timeline")
        try:
            full_hist = get_history(patient_id, days=30)
            hist_sum  = get_history_summary(patient_id)
            summary   = hist_sum.get("summary", {})

            if not summary:
                st.info("Is patient ka koi history nahi mila.")
            else:
                for date in sorted(summary.keys(), reverse=True):
                    day_entries = [e for e in full_hist
                                   if e["logged_at"].startswith(date)]
                    with st.expander(f"📅 {date}  ({len(day_entries)} symptoms)"):
                        for e in day_entries:
                            st.markdown(
                                f"• **{e['symptom']}** &nbsp; "
                                f"<small>[weight: {e['weight']} | duration: {e['duration_days']}d]</small>",
                                unsafe_allow_html=True
                            )
        except Exception as ex:
            st.warning(f"History load karne mein problem: {ex}")

# ─────────────────────────────────────────────────────────────────────────────
# 6. FOOTER
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    '<div class="footer">HealthBridge_Al v1.0 &nbsp;|&nbsp; '
    'Built with Streamlit + Python &nbsp;|&nbsp; '
    'Not a substitute for medical advice</div>',
    unsafe_allow_html=True
)

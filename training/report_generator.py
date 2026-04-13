"""
HealthBridge_Al - Medical Report Generator
Produces formatted diagnostic reports from NLP + matcher pipeline
"""

import os
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ─────────────────────────────────────────────────────────────────────────────
# 1. TEST MAP — 41 diseases → recommended tests
# ─────────────────────────────────────────────────────────────────────────────
TEST_MAP = {
    "Fungal infection"                      : "KOH test, Skin biopsy",
    "Allergy"                               : "Skin prick test, IgE blood test",
    "GERD"                                  : "Endoscopy, pH monitoring",
    "Chronic cholestasis"                   : "LFT, Ultrasound abdomen",
    "Drug Reaction"                         : "Allergy panel, Liver function test",
    "Peptic ulcer disease"                  : "Endoscopy, H.pylori test",
    "AIDS"                                  : "HIV ELISA, CD4 count, Viral load",
    "Diabetes"                              : "FBS, HbA1c, OGTT",
    "Gastroenteritis"                       : "Stool culture, CBC",
    "Bronchial Asthma"                      : "Spirometry, Peak flow, Chest X-ray",
    "Hypertension"                          : "BP monitoring, ECG, Kidney function",
    "Migraine"                              : "MRI brain, CT scan",
    "Cervical spondylosis"                  : "X-ray cervical spine, MRI",
    "Paralysis (brain hemorrhage)"          : "MRI brain, CT scan, Neurologist consult",
    "Jaundice"                              : "LFT, Bilirubin, Ultrasound abdomen",
    "Malaria"                               : "RDT, Peripheral smear, CBC",
    "Chicken pox"                           : "Clinical diagnosis, Tzanck smear",
    "Dengue"                                : "CBC, NS1 antigen, Dengue IgM/IgG",
    "Typhoid"                               : "CBC, Widal test, Blood culture",
    "hepatitis A"                           : "LFT, Anti-HAV IgM",
    "hepatitis B"                           : "HBsAg, LFT, Viral load",
    "hepatitis C"                           : "Anti-HCV, HCV RNA, LFT",
    "hepatitis D"                           : "Anti-HDV, LFT",
    "hepatitis E"                           : "Anti-HEV IgM, LFT",
    "Alcoholic hepatitis"                   : "LFT, GGT, Ultrasound",
    "Tuberculosis"                          : "Chest X-ray, Sputum AFB, Mantoux test",
    "Common Cold"                           : "Clinical diagnosis, rest recommended",
    "Pneumonia"                             : "Chest X-ray, CBC, Sputum culture",
    "Dimorphic hemmorhoids(piles)"          : "Proctoscopy, Colonoscopy",
    "Heart attack"                          : "ECG, Troponin, Echo",
    "Varicose veins"                        : "Doppler ultrasound",
    "Hypothyroidism"                        : "TSH, T3, T4",
    "Hyperthyroidism"                       : "TSH, T3, T4, Thyroid scan",
    "Hypoglycemia"                          : "FBS, HbA1c, Insulin level",
    "Osteoarthritis"                        : "X-ray joints, ESR, CRP",
    "Arthritis"                             : "RA factor, Anti-CCP, X-ray",
    "(vertigo) Paroymsal  Positional Vertigo": "ENT consult, Dix-Hallpike test",
    "Acne"                                  : "Clinical diagnosis, Hormonal panel",
    "Urinary tract infection"               : "Urine culture, Urine R/M",
    "Psoriasis"                             : "Skin biopsy, Clinical diagnosis",
    "Impetigo"                              : "Swab culture, Clinical diagnosis",
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. URGENCY ADVICE
# ─────────────────────────────────────────────────────────────────────────────
URGENCY_ADVICE = {
    "HIGH"  : "Aaj hi doctor se milein. Ye symptoms serious ho sakte hain.",
    "MEDIUM": "2-3 din mein doctor se milein. Symptoms monitor karte rahein.",
    "LOW"   : "Ghar pe rest karein. Agar 3 din mein theek na ho toh doctor se milein.",
}

URGENCY_TAG = {
    "HIGH"  : "[!!] HIGH",
    "MEDIUM": "[ !] MEDIUM",
    "LOW"   : "[  ] LOW",
}

# ─────────────────────────────────────────────────────────────────────────────
# Helper — lookup tests for a disease (fuzzy-ish key match)
# ─────────────────────────────────────────────────────────────────────────────
def _get_tests(disease_name: str) -> str:
    # Exact match first
    if disease_name in TEST_MAP:
        return TEST_MAP[disease_name]
    # Case-insensitive partial match
    dl = disease_name.lower()
    for key, val in TEST_MAP.items():
        if key.lower() in dl or dl in key.lower():
            return val
    return "Consult doctor for appropriate diagnostic tests"


# ─────────────────────────────────────────────────────────────────────────────
# 3. GENERATE REPORT
# ─────────────────────────────────────────────────────────────────────────────
def generate_report(
    patient_id      : str,
    user_text       : str,
    detected_syms   : dict,
    duration_days   : int,
    matches         : list,
    history_summary : dict,
    method_used     : str   = "keyword",
    bert_suggestion : str   = None,
    bert_conf       : float = 0.0,
) -> str:
    """
    Builds a formatted plain-text medical report.

    Args:
        patient_id      : e.g. "P001"
        user_text       : Original input string from patient
        detected_syms   : {symptom: weight} from extract_symptoms()
        duration_days   : from get_duration()
        matches         : list from match_diseases() or match_with_history()
        history_summary : dict from get_history_summary()["summary"]

    Returns:
        Formatted report string
    """
    now        = datetime.now()
    time_str   = now.strftime("%d %b %Y, %I:%M %p")
    dur_str    = f"{duration_days} day(s)" if duration_days >= 0 else "Unknown"
    top_match  = matches[0] if matches else None

    W = 60
    border_top    = "=" * W
    border_mid    = "-" * W
    section_line  = lambda title: f"-- {title} " + "-" * (W - len(title) - 4)

    lines = []
    lines.append(border_top)
    lines.append("       HEALTHBRIDGE AI  --  MEDICAL REPORT")
    lines.append(border_top)
    lines.append("")
    lines.append(f"  Patient ID   : {patient_id}")
    lines.append(f"  Report Time  : {time_str}")
    lines.append(f"  Input Text   : \"{user_text}\"")
    lines.append(f"  Duration     : {dur_str}")
    # NLP method line
    if method_used == "bert" and bert_conf >= 0.70:
        lines.append(f"  NLP Method   : BERT Neural Engine ({bert_conf:.0%} confidence)")
    elif method_used == "hybrid":
        lines.append(f"  NLP Method   : Hybrid (BERT + Keyword)")
    else:
        lines.append(f"  NLP Method   : Keyword Matching")
    if bert_suggestion and bert_conf >= 0.40:
        lines.append(f"  BERT Suggest : {bert_suggestion} ({bert_conf:.0%})")
    lines.append("")

    # ── Symptoms Detected ────────────────────────────────────────────────────
    lines.append(section_line("SYMPTOMS DETECTED"))
    if detected_syms:
        for sym, wt in detected_syms.items():
            lines.append(f"  * {sym:<35} [weight: {wt}]")
    else:
        lines.append("  No symptoms detected.")
    lines.append("")

    # ── Symptom History ──────────────────────────────────────────────────────
    lines.append(section_line("SYMPTOM HISTORY (last 7 days)"))
    summary = history_summary.get("summary", {})
    if summary:
        for date, syms in summary.items():
            lines.append(f"  {date} : {', '.join(syms)}")
    else:
        lines.append("  No history found.")
    lines.append("")

    # ── Top Diagnoses ────────────────────────────────────────────────────────
    lines.append(section_line("TOP DIAGNOSIS"))
    for i, m in enumerate(matches[:3], 1):
        urgency  = m.get("urgency", "LOW")
        tag      = URGENCY_TAG[urgency]
        boost    = "  [history boost]" if m.get("history_boost") else ""
        lines.append(f"  #{i}  {m['disease']:<30} {m['score']:>5.1f}%  {tag}{boost}")
        if m.get("matched_symptoms"):
            lines.append(f"       Matched  : {', '.join(m['matched_symptoms'])}")
        if m.get("missing_critical"):
            crit = m["missing_critical"][:4]   # show max 4
            lines.append(f"       Missing  : {', '.join(crit)}")
        lines.append("")

    # ── Recommended Tests ────────────────────────────────────────────────────
    lines.append(section_line("RECOMMENDED TESTS"))
    if top_match:
        tests = _get_tests(top_match["disease"])
        lines.append(f"  Based on top diagnosis ({top_match['disease']}):")
        lines.append(f"  -> {tests}")
    else:
        lines.append("  Insufficient data for test recommendation.")
    lines.append("")

    # ── Doctor Advice ────────────────────────────────────────────────────────
    lines.append(section_line("DOCTOR ADVICE"))
    if top_match:
        advice = URGENCY_ADVICE.get(top_match["urgency"], URGENCY_ADVICE["LOW"])
        lines.append(f"  [!] {advice}")
    lines.append("")

    # ── Disclaimer ───────────────────────────────────────────────────────────
    lines.append(section_line("DISCLAIMER"))
    lines.append("  Ye report sirf AI-based suggestion hai.")
    lines.append("  Kisi bhi nischay ke liye registered doctor se milein.")
    lines.append(border_top)

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# 4. SAVE REPORT
# ─────────────────────────────────────────────────────────────────────────────
def save_report(report_str: str, patient_id: str) -> str:
    """
    Saves report to reports/<patient_id>_<timestamp>.txt
    Returns saved file path.
    """
    os.makedirs("reports", exist_ok=True)
    ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename  = f"{patient_id}_{ts}.txt"
    filepath  = os.path.join("reports", filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report_str)

    return filepath


# ─────────────────────────────────────────────────────────────────────────────
# 5. TEST SEQUENCE
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from nlp_extractor  import extract_symptoms, get_duration
    from history_db     import log_symptoms, get_history_summary
    from matcher        import match_with_history

    PATIENT_ID = "P001"
    INPUT_TEXT = "2 din se bukhar hai, sar dard aur ulti bhi ho rahi hai"

    print("=" * 60)
    print("  REPORT GENERATOR — FULL PIPELINE TEST")
    print("=" * 60)

    # a) Extract symptoms from text
    detected = extract_symptoms(INPUT_TEXT)
    duration = get_duration(INPUT_TEXT)
    print(f"\n[a] Symptoms extracted : {detected}")
    print(f"    Duration           : {duration} day(s)")

    # b) Log to DB
    inserted = log_symptoms(PATIENT_ID, detected, duration_days=duration)
    print(f"\n[b] Logged {inserted} symptom row(s) for {PATIENT_ID}")

    # c) Get history summary
    hist_result = get_history_summary(PATIENT_ID)
    print(f"\n[c] History summary ({hist_result['total_days_sick']} day(s) sick):")
    for date, syms in hist_result["summary"].items():
        print(f"    {date} : {syms}")

    # d) Match with history
    matches = match_with_history(PATIENT_ID, detected, top_k=5)
    print(f"\n[d] Top match : {matches[0]['disease']} — {matches[0]['score']}%  [{matches[0]['urgency']}]")

    # e) Generate report
    report = generate_report(
        patient_id      = PATIENT_ID,
        user_text       = INPUT_TEXT,
        detected_syms   = detected,
        duration_days   = duration,
        matches         = matches,
        history_summary = hist_result,
    )
    print("\n[e] FULL REPORT:")
    print(report)

    # f) Save report
    path = save_report(report, PATIENT_ID)
    print(f"\n[f] Report saved to: {path}\n")

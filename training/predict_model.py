"""
SehatSetu AI - Disease Prediction
Loads the best trained model and predicts diseases from symptoms.
"""
import joblib
import json
import numpy as np
import sys
import os

# ============================================================================
# CONFIG
# ============================================================================
MODELS_DIR = "e:/SehatSetu AI/training/models"
ENCODINGS_FILE = "e:/SehatSetu AI/training/label_encodings.json"
RESULTS_DIR = "e:/SehatSetu AI/training/results"

# ============================================================================
# LOAD MODEL & ENCODINGS
# ============================================================================
print("=" * 60)
print("SehatSetu AI - Disease Prediction System")
print("=" * 60)

# Load encodings
try:
    with open(ENCODINGS_FILE, 'r', encoding='utf-8') as f:
        encodings = json.load(f)
    all_symptoms = encodings['symptoms']
    print(f"\n[OK] Loaded {len(all_symptoms)} symptoms from encodings")
except Exception as e:
    print(f"[FAIL] Failed to load encodings: {e}")
    exit(1)

# Load best model info
best_model_info_path = os.path.join(RESULTS_DIR, 'best_model_info.json')
try:
    with open(best_model_info_path, 'r') as f:
        best_info = json.load(f)
    best_model_name = best_info['model_name']
    print(f"   Best model: {best_model_name} (Accuracy: {best_info['accuracy']:.4f})")
except Exception:
    best_model_name = "Random Forest"
    print(f"   [WARN] Using default: {best_model_name}")

# Load model
try:
    if best_model_name == 'LSTM':
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        import tensorflow as tf
        tf.get_logger().setLevel('ERROR')
        model = tf.keras.models.load_model(os.path.join(MODELS_DIR, 'lstm_model.keras'))
        scaler = joblib.load(os.path.join(MODELS_DIR, 'lstm_scaler.pkl'))
        is_lstm = True
    else:
        model = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
        is_lstm = False
    print(f"   [OK] Model loaded successfully")
except Exception as e:
    print(f"[FAIL] Failed to load model: {e}")
    exit(1)

# Load label encoder
le = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))

# ============================================================================
# SYMPTOM ENCODING
# ============================================================================
def encode_symptoms(symptom_text):
    """Convert user symptom text into binary feature vector."""
    # Parse input symptoms
    input_symptoms = [s.strip().lower() for s in symptom_text.replace(',', ' ').split()]

    # Match against known symptoms (fuzzy matching)
    feature_vector = np.zeros(len(all_symptoms))
    matched = []
    unmatched = []

    for input_sym in input_symptoms:
        found = False
        for idx, known_sym in enumerate(all_symptoms):
            known_lower = known_sym.lower()
            # Exact or partial match
            if input_sym in known_lower or known_lower in input_sym:
                feature_vector[idx] = 1
                matched.append(known_sym)
                found = True
                break
        if not found:
            # Try word-level matching
            for idx, known_sym in enumerate(all_symptoms):
                known_words = known_sym.lower().split()
                if input_sym in known_words:
                    feature_vector[idx] = 1
                    matched.append(known_sym)
                    found = True
                    break
        if not found:
            unmatched.append(input_sym)

    # Add engineered features
    severity_map = encodings.get('severity_map', {})
    matched_severities = [severity_map.get(s, 1) for s in matched]
    avg_severity = np.mean(matched_severities) if matched_severities else 1.0
    symptom_count = sum(feature_vector)

    # Append engineered features
    full_vector = np.append(feature_vector, [avg_severity, symptom_count])

    return full_vector, matched, unmatched


# ============================================================================
# PREDICTION
# ============================================================================
def predict_disease(symptom_text, top_n=5):
    """Predict diseases from symptom text."""
    feature_vector, matched, unmatched = encode_symptoms(symptom_text)

    print(f"\n>> Input: \"{symptom_text}\"")
    print(f"   Matched symptoms ({len(matched)}): {', '.join(matched) if matched else 'None'}")
    if unmatched:
        print(f"   [WARN] Unmatched words: {', '.join(unmatched)}")

    if len(matched) == 0:
        print("   [FAIL] No symptoms matched. Please try different terms.")
        return None

    # Predict
    X = feature_vector.reshape(1, -1)

    if is_lstm:
        X_scaled = scaler.transform(X)
        X_lstm = X_scaled.reshape((1, 1, X_scaled.shape[1]))
        proba = model.predict(X_lstm, verbose=0)[0]
    else:
        proba = model.predict_proba(X)[0]

    # Get top-N predictions
    top_indices = np.argsort(proba)[-top_n:][::-1]

    print(f"\n{'-' * 55}")
    print(f" Top {top_n} Disease Predictions:")
    print(f"{'-' * 55}")
    for rank, idx in enumerate(top_indices, 1):
        disease = le.classes_[idx]
        confidence = proba[idx] * 100
        bar = '#' * int(confidence / 2)
        print(f"   {rank}. {disease:<40s} {confidence:6.2f}% {bar}")

    top_disease = le.classes_[top_indices[0]]

    # Feature importance (for non-LSTM models)
    if not is_lstm and hasattr(model, 'named_steps'):
        clf = model.named_steps.get('clf')
        if hasattr(clf, 'feature_importances_'):
            importances = clf.feature_importances_
            symptom_names = all_symptoms + ['avg_severity', 'symptom_count']
            active_features = [(symptom_names[i], importances[i])
                             for i in range(len(feature_vector))
                             if feature_vector[i] > 0 and i < len(symptom_names)]
            active_features.sort(key=lambda x: x[1], reverse=True)

            if active_features:
                print(f"\n Key Contributing Symptoms:")
                for name, imp in active_features[:5]:
                    print(f"   - {name}: importance = {imp:.4f}")

    predictions = []
    for idx in top_indices:
        predictions.append({
            "disease": le.classes_[idx],
            "confidence": float(proba[idx] * 100)
        })

    key_symptoms = []
    if 'active_features' in locals() and active_features:
        for name, imp in active_features[:5]:
            key_symptoms.append({"name": name, "importance": float(imp)})

    return {
        "top_disease": top_disease,
        "matched_symptoms": matched,
        "unmatched_symptoms": unmatched,
        "predictions": predictions,
        "key_symptoms": key_symptoms
    }


# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_symptoms = " ".join(sys.argv[1:])
        predict_disease(user_symptoms)
    else:
        # Interactive mode
        print("\n" + "=" * 60)
        print(" Enter symptoms (comma or space separated)")
        print("   Examples: 'fever, headache, chills'")
        print("   Type 'quit' to exit")
        print("=" * 60)

        while True:
            user_symptoms = input("\n>> Enter symptoms: ").strip()
            if user_symptoms.lower() in ('quit', 'exit', 'q'):
                print("\nGoodbye!")
                break
            if user_symptoms:
                predict_disease(user_symptoms)
            else:
                print("   [WARN] Please enter at least one symptom.")

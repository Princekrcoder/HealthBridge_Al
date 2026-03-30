"""
SehatSetu AI — Data Preprocessing (with Augmentation)
Converts raw CSV (Symptom → Diseases) into augmented binary feature matrix for ML training.

Problem: Each disease has only ~1-3 symptoms mapped, giving 1 sample per disease.
Solution: Data augmentation — create multiple samples per disease by:
  1. Generating subsets of symptoms (partial symptom presentation)
  2. Creating duplicate rows with noise
"""
import pandas as pd
import numpy as np
import json
import os
import random
from itertools import combinations

# ============================================================================
# CONFIG
# ============================================================================
INPUT_FILE = "e:/SehatSetu AI/Indian-Healthcare-Symptom-Disease-Dataset - Sheet1 (2).csv"
OUTPUT_DIR = "e:/SehatSetu AI/training"
FEATURES_FILE = os.path.join(OUTPUT_DIR, "processed_features.csv")
ENCODINGS_FILE = os.path.join(OUTPUT_DIR, "label_encodings.json")

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# ============================================================================
# STEP 1: Load Raw Dataset
# ============================================================================
print("=" * 60)
print("SehatSetu AI - Data Preprocessing Pipeline")
print("=" * 60)

try:
    df = pd.read_csv(INPUT_FILE)
    print(f"\n[OK] Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
    print(f"   Columns: {list(df.columns)}")
except Exception as e:
    print(f"[FAIL] Failed to load dataset: {e}")
    exit(1)

# ============================================================================
# STEP 2: Extract Disease-Symptom Pairs
# ============================================================================
print("\n[2] Extracting Disease-Symptom pairs...")

disease_symptom_map = {}  # disease -> set of symptoms
severity_map = {}         # symptom -> severity level

for _, row in df.iterrows():
    symptom = str(row['Symptom']).strip()
    diseases_str = row['Possible Diseases']
    severity = str(row.get('Severity', 'Mild')).strip()

    if pd.isna(diseases_str):
        continue

    severity_map[symptom] = severity

    disease_list = [d.strip() for d in str(diseases_str).split(',')]
    for disease in disease_list:
        if disease not in disease_symptom_map:
            disease_symptom_map[disease] = set()
        disease_symptom_map[disease].add(symptom)

print(f"   Found {len(disease_symptom_map)} unique diseases")
print(f"   Found {len(severity_map)} unique symptoms")

# Stats on symptoms per disease
sym_counts = [len(v) for v in disease_symptom_map.values()]
print(f"   Avg symptoms/disease: {np.mean(sym_counts):.1f}")
print(f"   Min: {min(sym_counts)}, Max: {max(sym_counts)}")

# ============================================================================
# STEP 3: Data Augmentation
# ============================================================================
print("\n[3] Augmenting data...")

all_symptoms = sorted(severity_map.keys())
symptom_to_idx = {s: i for i, s in enumerate(all_symptoms)}
severity_encoding = {'Mild': 1, 'Moderate': 2, 'Severe': 3}

augmented_rows = []
augmented_labels = []

for disease, symptoms in disease_symptom_map.items():
    symptom_list = sorted(symptoms)
    n_symptoms = len(symptom_list)

    # 1. Full symptom vector (original)
    full_vector = np.zeros(len(all_symptoms))
    for s in symptom_list:
        if s in symptom_to_idx:
            full_vector[symptom_to_idx[s]] = 1
    augmented_rows.append(full_vector)
    augmented_labels.append(disease)

    # 2. Generate subsets (partial symptom presentations)
    # Patients rarely show ALL symptoms - they show subsets
    if n_symptoms >= 2:
        # Generate subsets of size (n-1) — missing one symptom each
        for i in range(n_symptoms):
            subset = [s for j, s in enumerate(symptom_list) if j != i]
            v = np.zeros(len(all_symptoms))
            for s in subset:
                if s in symptom_to_idx:
                    v[symptom_to_idx[s]] = 1
            augmented_rows.append(v)
            augmented_labels.append(disease)

    if n_symptoms >= 3:
        # Generate some subsets of size (n-2) — missing two symptoms
        for combo in combinations(range(n_symptoms), n_symptoms - 2):
            subset = [symptom_list[j] for j in combo]
            v = np.zeros(len(all_symptoms))
            for s in subset:
                if s in symptom_to_idx:
                    v[symptom_to_idx[s]] = 1
            augmented_rows.append(v)
            augmented_labels.append(disease)
            if len(augmented_rows) - len(disease_symptom_map) > 15 * len(disease_symptom_map):
                break  # Cap augmentation

    # 3. Add noise variants (slight perturbation)
    for _ in range(3):
        v = full_vector.copy()
        # Randomly drop 1 symptom (if possible)
        active = np.where(v == 1)[0]
        if len(active) > 1:
            drop_idx = random.choice(active.tolist())
            v[drop_idx] = 0
        augmented_rows.append(v)
        augmented_labels.append(disease)

print(f"   Generated {len(augmented_rows)} total samples (from {len(disease_symptom_map)} diseases)")
print(f"   Augmentation ratio: {len(augmented_rows)/len(disease_symptom_map):.1f}x")

# ============================================================================
# STEP 4: Build Feature Matrix
# ============================================================================
print("\n[4] Building feature matrix...")

X = np.array(augmented_rows)
feature_df = pd.DataFrame(X, columns=all_symptoms)
feature_df.insert(0, 'Disease', augmented_labels)

# Add engineered features
avg_severity_list = []
for idx, row in feature_df.iterrows():
    active_symptoms = [all_symptoms[i] for i in range(len(all_symptoms)) if row[all_symptoms[i]] == 1]
    severities = [severity_encoding.get(severity_map.get(s, 'Mild'), 1) for s in active_symptoms]
    avg_severity_list.append(np.mean(severities) if severities else 1.0)

feature_df['avg_severity'] = avg_severity_list
feature_df['symptom_count'] = feature_df[all_symptoms].sum(axis=1)

print(f"   Feature matrix shape: {feature_df.shape}")
print(f"   Features: {len(all_symptoms)} symptoms + 2 engineered")

# ============================================================================
# STEP 5: Check minimum samples per class
# ============================================================================
class_counts = feature_df['Disease'].value_counts()
print(f"\n[5] Class distribution:")
print(f"   Min samples/class: {class_counts.min()}")
print(f"   Max samples/class: {class_counts.max()}")
print(f"   Mean samples/class: {class_counts.mean():.1f}")
print(f"   Classes with >= 4 samples: {(class_counts >= 4).sum()}")

# ============================================================================
# STEP 6: Save Processed Data
# ============================================================================
print("\n[6] Saving processed data...")

os.makedirs(OUTPUT_DIR, exist_ok=True)

feature_df.to_csv(FEATURES_FILE, index=False)
print(f"   [OK] Features saved to: {FEATURES_FILE}")

encodings = {
    "symptoms": all_symptoms,
    "diseases": sorted(set(augmented_labels)),
    "severity_map": {k: severity_encoding.get(v, 1) for k, v in severity_map.items()},
    "symptom_count": len(all_symptoms),
    "disease_count": len(set(augmented_labels)),
}
with open(ENCODINGS_FILE, 'w', encoding='utf-8') as f:
    json.dump(encodings, f, indent=2, ensure_ascii=False)
print(f"   [OK] Encodings saved to: {ENCODINGS_FILE}")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "=" * 60)
print("PREPROCESSING SUMMARY")
print("=" * 60)
print(f"   Total Diseases:       {len(set(augmented_labels))}")
print(f"   Total Symptoms:       {len(all_symptoms)}")
print(f"   Total Samples:        {len(augmented_rows)}")
print(f"   Feature Dims:         {feature_df.shape[1] - 1}")
print(f"   Avg Samples/Disease:  {class_counts.mean():.1f}")

print("\n[OK] Preprocessing complete! Ready for model training.")

"""
SehatSetu AI - Train All Models
Trains LR, RF, XGBoost, SVM + LSTM and compares them.
"""
import pandas as pd
import numpy as np
import joblib
import json
import os
import warnings
import time

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

warnings.filterwarnings('ignore')

# ============================================================================
# CONFIG
# ============================================================================
FEATURES_FILE = "e:/SehatSetu AI/training/processed_features.csv"
ENCODINGS_FILE = "e:/SehatSetu AI/training/label_encodings.json"
MODELS_DIR = "e:/SehatSetu AI/training/models"
RESULTS_DIR = "e:/SehatSetu AI/training/results"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# ============================================================================
# STEP 1: Load Data
# ============================================================================
print("=" * 70)
print("SehatSetu AI - Model Training Pipeline")
print("=" * 70)

df = pd.read_csv(FEATURES_FILE)
print(f"\n[OK] Data loaded: {df.shape}")

with open(ENCODINGS_FILE, 'r', encoding='utf-8') as f:
    encodings = json.load(f)

# Separate features and target
X = df.drop(columns=['Disease']).values
y = df['Disease'].values

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)
n_classes = len(le.classes_)

print(f"   Features: {X.shape[1]}")
print(f"   Samples:  {X.shape[0]}")
print(f"   Classes:  {n_classes}")

# Save label encoder
joblib.dump(le, os.path.join(MODELS_DIR, 'label_encoder.pkl'))

# ============================================================================
# STEP 2: Train-Test Split (Stratified)
# ============================================================================
print("\n[2] Splitting data (80/20 stratified)...")

# Filter out classes with very few samples for stratified split
class_counts = pd.Series(y_encoded).value_counts()
min_samples = 2
valid_classes = class_counts[class_counts >= min_samples].index
mask = np.isin(y_encoded, valid_classes)

if mask.sum() < len(y_encoded):
    print(f"   Note: Filtering {len(y_encoded) - mask.sum()} samples from classes with < {min_samples} samples")
    X_filtered = X[mask]
    y_filtered = y_encoded[mask]
else:
    X_filtered = X
    y_filtered = y_encoded

X_train, X_test, y_train, y_test = train_test_split(
    X_filtered, y_filtered, test_size=0.2, random_state=42, stratify=y_filtered
)

print(f"   Train: {X_train.shape[0]} samples")
print(f"   Test:  {X_test.shape[0]} samples")
print(f"   Train classes: {len(np.unique(y_train))}")
print(f"   Test classes:  {len(np.unique(y_test))}")

# Save test data for evaluation
np.savez(os.path.join(RESULTS_DIR, 'test_data.npz'),
         X_test=X_test, y_test=y_test)

# ============================================================================
# STEP 3: Define Models
# ============================================================================
print("\n[3] Defining model pipelines...")

models = {
    'Logistic Regression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(
            max_iter=2000,
            multi_class='multinomial',
            solver='lbfgs',
            C=1.0,
            random_state=42
        ))
    ]),
    'Random Forest': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1
        ))
    ]),
    'SVM': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', SVC(
            kernel='rbf',
            C=10.0,
            gamma='scale',
            probability=True,
            random_state=42,
            decision_function_shape='ovr'
        ))
    ]),
}

# Try to import XGBoost
try:
    from xgboost import XGBClassifier
    models['XGBoost'] = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            eval_metric='mlogloss',
            random_state=42,
            n_jobs=-1,
            verbosity=0
        ))
    ])
    print("   [OK] XGBoost available")
except ImportError:
    print("   [WARN] XGBoost not installed, skipping.")

print(f"   Models to train: {list(models.keys())}")

# ============================================================================
# STEP 4: Train & Evaluate Each Model
# ============================================================================
print("\n" + "=" * 70)
print("STEP 4: Training Models")
print("=" * 70)

results = []

for name, pipeline in models.items():
    print(f"\n{'---' * 17}")
    print(f"Training: {name}")
    print(f"{'---' * 17}")

    start_time = time.time()

    # Train
    pipeline.fit(X_train, y_train)
    train_time = time.time() - start_time

    # Predict
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
    rec_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
    f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
    prec_weighted = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec_weighted = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)

    # ROC-AUC (one-vs-rest)
    try:
        roc_auc = roc_auc_score(y_test, y_proba, multi_class='ovr', average='macro')
    except Exception:
        roc_auc = 0.0

    # Cross-validation
    try:
        cv_folds = min(3, len(np.unique(y_filtered)))
        if cv_folds >= 2:
            cv_scores = cross_val_score(pipeline, X_filtered, y_filtered, cv=cv_folds, scoring='accuracy', n_jobs=-1)
            cv_mean = cv_scores.mean()
            cv_std = cv_scores.std()
        else:
            cv_mean = 0.0
            cv_std = 0.0
    except Exception:
        cv_mean = 0.0
        cv_std = 0.0

    # Print results
    print(f"   Accuracy:       {acc:.4f}")
    print(f"   Precision (W):  {prec_weighted:.4f}")
    print(f"   Recall (W):     {rec_weighted:.4f}")
    print(f"   F1-Score (W):   {f1_weighted:.4f}")
    print(f"   ROC-AUC:        {roc_auc:.4f}")
    print(f"   Cross-Val:      {cv_mean:.4f} +/- {cv_std:.4f}")
    print(f"   Train Time:     {train_time:.2f}s")

    # Save model
    model_path = os.path.join(MODELS_DIR, f"{name.lower().replace(' ', '_')}.pkl")
    joblib.dump(pipeline, model_path)
    print(f"   Saved to: {model_path}")

    # Save confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    np.save(os.path.join(RESULTS_DIR, f"cm_{name.lower().replace(' ', '_')}.npy"), cm)

    # Save predictions for evaluation
    np.save(os.path.join(RESULTS_DIR, f"pred_{name.lower().replace(' ', '_')}.npy"), y_pred)
    np.save(os.path.join(RESULTS_DIR, f"proba_{name.lower().replace(' ', '_')}.npy"), y_proba)

    # Store results
    results.append({
        'Model': name,
        'Accuracy': round(acc, 4),
        'Precision_Macro': round(prec_macro, 4),
        'Recall_Macro': round(rec_macro, 4),
        'F1_Macro': round(f1_macro, 4),
        'Precision_Weighted': round(prec_weighted, 4),
        'Recall_Weighted': round(rec_weighted, 4),
        'F1_Weighted': round(f1_weighted, 4),
        'ROC_AUC': round(roc_auc, 4),
        'CV_Mean': round(cv_mean, 4),
        'CV_Std': round(cv_std, 4),
        'Train_Time_Sec': round(train_time, 2),
    })

# ============================================================================
# STEP 5: LSTM Model
# ============================================================================
print(f"\n{'---' * 17}")
print(f"Training: LSTM (Deep Learning)")
print(f"{'---' * 17}")

try:
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    import tensorflow as tf
    tf.get_logger().setLevel('ERROR')
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM as LSTMLayer, Dense, Dropout
    from tensorflow.keras.utils import to_categorical
    from tensorflow.keras.callbacks import EarlyStopping

    # Scale data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Reshape for LSTM: (samples, timesteps, features)
    n_features = X_train_scaled.shape[1]
    timesteps = 1
    X_train_lstm = X_train_scaled.reshape((X_train_scaled.shape[0], timesteps, n_features))
    X_test_lstm = X_test_scaled.reshape((X_test_scaled.shape[0], timesteps, n_features))

    # One-hot encode targets — use n_classes for proper sizing
    y_train_cat = to_categorical(y_train, num_classes=n_classes)
    y_test_cat = to_categorical(y_test, num_classes=n_classes)

    # Build LSTM Model
    lstm_model = Sequential([
        LSTMLayer(128, input_shape=(timesteps, n_features), return_sequences=True),
        Dropout(0.3),
        LSTMLayer(64, return_sequences=False),
        Dropout(0.3),
        Dense(128, activation='relu'),
        Dropout(0.2),
        Dense(n_classes, activation='softmax')
    ])

    lstm_model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    print(f"   LSTM Parameters: {lstm_model.count_params():,}")

    # Train
    start_time = time.time()
    early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=0)

    history = lstm_model.fit(
        X_train_lstm, y_train_cat,
        validation_data=(X_test_lstm, y_test_cat),
        epochs=100,
        batch_size=32,
        callbacks=[early_stop],
        verbose=0
    )
    train_time = time.time() - start_time

    # Evaluate
    y_pred_proba_lstm = lstm_model.predict(X_test_lstm, verbose=0)
    y_pred_lstm = np.argmax(y_pred_proba_lstm, axis=1)

    acc = accuracy_score(y_test, y_pred_lstm)
    prec_macro = precision_score(y_test, y_pred_lstm, average='macro', zero_division=0)
    rec_macro = recall_score(y_test, y_pred_lstm, average='macro', zero_division=0)
    f1_macro = f1_score(y_test, y_pred_lstm, average='macro', zero_division=0)
    prec_weighted = precision_score(y_test, y_pred_lstm, average='weighted', zero_division=0)
    rec_weighted = recall_score(y_test, y_pred_lstm, average='weighted', zero_division=0)
    f1_weighted = f1_score(y_test, y_pred_lstm, average='weighted', zero_division=0)

    try:
        roc_auc = roc_auc_score(y_test, y_pred_proba_lstm, multi_class='ovr', average='macro')
    except Exception:
        roc_auc = 0.0

    print(f"   Accuracy:       {acc:.4f}")
    print(f"   Precision (W):  {prec_weighted:.4f}")
    print(f"   Recall (W):     {rec_weighted:.4f}")
    print(f"   F1-Score (W):   {f1_weighted:.4f}")
    print(f"   ROC-AUC:        {roc_auc:.4f}")
    print(f"   Train Time:     {train_time:.2f}s")
    print(f"   Epochs Run:     {len(history.history['loss'])}")

    # Save LSTM model
    lstm_model.save(os.path.join(MODELS_DIR, 'lstm_model.keras'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'lstm_scaler.pkl'))
    print(f"   LSTM model saved")

    # Save predictions
    np.save(os.path.join(RESULTS_DIR, 'pred_lstm.npy'), y_pred_lstm)
    np.save(os.path.join(RESULTS_DIR, 'proba_lstm.npy'), y_pred_proba_lstm)

    cm = confusion_matrix(y_test, y_pred_lstm)
    np.save(os.path.join(RESULTS_DIR, 'cm_lstm.npy'), cm)

    results.append({
        'Model': 'LSTM',
        'Accuracy': round(acc, 4),
        'Precision_Macro': round(prec_macro, 4),
        'Recall_Macro': round(rec_macro, 4),
        'F1_Macro': round(f1_macro, 4),
        'Precision_Weighted': round(prec_weighted, 4),
        'Recall_Weighted': round(rec_weighted, 4),
        'F1_Weighted': round(f1_weighted, 4),
        'ROC_AUC': round(roc_auc, 4),
        'CV_Mean': 0.0,
        'CV_Std': 0.0,
        'Train_Time_Sec': round(train_time, 2),
    })

except ImportError:
    print("   [WARN] TensorFlow not installed, skipping LSTM.")
except Exception as e:
    print(f"   [WARN] LSTM training failed: {e}")
    import traceback
    traceback.print_exc()

# ============================================================================
# STEP 6: Model Comparison & Best Model Selection
# ============================================================================
print("\n" + "=" * 70)
print("STEP 6: MODEL COMPARISON")
print("=" * 70)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('Accuracy', ascending=False).reset_index(drop=True)

# Print comparison table
print("\n" + results_df.to_string(index=False))

# Save comparison
results_df.to_csv(os.path.join(RESULTS_DIR, 'model_comparison.csv'), index=False)

# Best model
best_model_name = results_df.iloc[0]['Model']
best_accuracy = results_df.iloc[0]['Accuracy']

print(f"\n[BEST] Best Model: {best_model_name} (Accuracy: {best_accuracy:.4f})")

# Copy best model as best_model.pkl
if best_model_name == 'LSTM':
    print("   (LSTM is best - use lstm_model.keras for deployment)")
else:
    best_model_file = os.path.join(MODELS_DIR, f"{best_model_name.lower().replace(' ', '_')}.pkl")
    best_model = joblib.load(best_model_file)
    joblib.dump(best_model, os.path.join(MODELS_DIR, 'best_model.pkl'))
    print(f"   Best model copied to: {os.path.join(MODELS_DIR, 'best_model.pkl')}")

# Save best model info
best_info = {
    'model_name': best_model_name,
    'accuracy': float(best_accuracy),
    'all_results': results
}
with open(os.path.join(RESULTS_DIR, 'best_model_info.json'), 'w') as f:
    json.dump(best_info, f, indent=2)

print("\n[OK] All models trained and compared! Run evaluate_models.py for visualizations.")

"""
SehatSetu AI — Model Evaluation & Visualization
Generates ROC curves, confusion matrices, and comparison charts.
"""
import pandas as pd
import numpy as np
import json
import os
import joblib
import warnings

warnings.filterwarnings('ignore')

# ============================================================================
# CONFIG
# ============================================================================
MODELS_DIR = "e:/SehatSetu AI/training/models"
RESULTS_DIR = "e:/SehatSetu AI/training/results"
CM_DIR = os.path.join(RESULTS_DIR, "confusion_matrices")
ROC_DIR = os.path.join(RESULTS_DIR, "roc_curves")

os.makedirs(CM_DIR, exist_ok=True)
os.makedirs(ROC_DIR, exist_ok=True)

print("=" * 70)
print("🏥 SehatSetu AI — Model Evaluation & Visualization")
print("=" * 70)

# ============================================================================
# STEP 1: Load Data
# ============================================================================
print("\n📊 Loading test data and results...")

test_data = np.load(os.path.join(RESULTS_DIR, 'test_data.npz'))
X_test = test_data['X_test']
y_test = test_data['y_test']

le = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
comparison_df = pd.read_csv(os.path.join(RESULTS_DIR, 'model_comparison.csv'))

print(f"   Test samples: {len(y_test)}")
print(f"   Classes: {len(le.classes_)}")

# ============================================================================
# STEP 2: Import Visualization Libraries
# ============================================================================
try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns

    plt.style.use('seaborn-v0_8-darkgrid')
    PLOTTING = True
    print("   ✅ Matplotlib & Seaborn available")
except ImportError:
    PLOTTING = False
    print("   ⚠️  Matplotlib/Seaborn not available. Skipping plots.")

# ============================================================================
# STEP 3: Model Comparison Bar Chart
# ============================================================================
if PLOTTING:
    print("\n📈 Generating comparison charts...")

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('SehatSetu AI — Model Performance Comparison', fontsize=16, fontweight='bold')

    # Accuracy comparison
    colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0']
    models_list = comparison_df['Model'].tolist()

    axes[0].barh(models_list, comparison_df['Accuracy'], color=colors[:len(models_list)])
    axes[0].set_xlabel('Accuracy')
    axes[0].set_title('Accuracy')
    for i, v in enumerate(comparison_df['Accuracy']):
        axes[0].text(v + 0.005, i, f'{v:.3f}', va='center', fontweight='bold')

    # F1-Score comparison
    axes[1].barh(models_list, comparison_df['F1_Weighted'], color=colors[:len(models_list)])
    axes[1].set_xlabel('F1-Score (Weighted)')
    axes[1].set_title('F1-Score (Weighted)')
    for i, v in enumerate(comparison_df['F1_Weighted']):
        axes[1].text(v + 0.005, i, f'{v:.3f}', va='center', fontweight='bold')

    # ROC-AUC comparison
    axes[2].barh(models_list, comparison_df['ROC_AUC'], color=colors[:len(models_list)])
    axes[2].set_xlabel('ROC-AUC')
    axes[2].set_title('ROC-AUC (Macro)')
    for i, v in enumerate(comparison_df['ROC_AUC']):
        axes[2].text(v + 0.005, i, f'{v:.3f}', va='center', fontweight='bold')

    plt.tight_layout()
    comparison_path = os.path.join(RESULTS_DIR, 'model_comparison_chart.png')
    plt.savefig(comparison_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Comparison chart saved: {comparison_path}")

# ============================================================================
# STEP 4: Confusion Matrices
# ============================================================================
if PLOTTING:
    print("\n🔲 Generating confusion matrices...")

    model_files = {
        'Logistic Regression': 'cm_logistic_regression.npy',
        'Random Forest': 'cm_random_forest.npy',
        'XGBoost': 'cm_xgboost.npy',
        'SVM': 'cm_svm.npy',
        'LSTM': 'cm_lstm.npy',
    }

    for name, cm_file in model_files.items():
        cm_path = os.path.join(RESULTS_DIR, cm_file)
        if not os.path.exists(cm_path):
            continue

        cm = np.load(cm_path)

        # For large number of classes, show top-N most common
        n_display = min(20, cm.shape[0])

        # Get top classes by total support
        class_support = cm.sum(axis=1)
        top_indices = np.argsort(class_support)[-n_display:]

        cm_subset = cm[np.ix_(top_indices, top_indices)]
        labels_subset = le.classes_[top_indices]

        fig, ax = plt.subplots(figsize=(12, 10))
        sns.heatmap(cm_subset, annot=True, fmt='d', cmap='Blues',
                    xticklabels=labels_subset, yticklabels=labels_subset, ax=ax)
        ax.set_xlabel('Predicted', fontsize=12)
        ax.set_ylabel('Actual', fontsize=12)
        ax.set_title(f'Confusion Matrix — {name} (Top {n_display} Classes)', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right', fontsize=8)
        plt.yticks(fontsize=8)
        plt.tight_layout()

        save_path = os.path.join(CM_DIR, f'cm_{name.lower().replace(" ", "_")}.png')
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"   ✅ {name}: {save_path}")

# ============================================================================
# STEP 5: ROC Curves (Combined)
# ============================================================================
if PLOTTING:
    print("\n📉 Generating ROC curves...")

    from sklearn.metrics import roc_curve, auc
    from sklearn.preprocessing import label_binarize

    y_test_bin = label_binarize(y_test, classes=range(len(le.classes_)))

    proba_files = {
        'Logistic Regression': 'proba_logistic_regression.npy',
        'Random Forest': 'proba_random_forest.npy',
        'XGBoost': 'proba_xgboost.npy',
        'SVM': 'proba_svm.npy',
        'LSTM': 'proba_lstm.npy',
    }

    fig, ax = plt.subplots(figsize=(10, 8))
    colors_roc = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0']

    for idx, (name, proba_file) in enumerate(proba_files.items()):
        proba_path = os.path.join(RESULTS_DIR, proba_file)
        if not os.path.exists(proba_path):
            continue

        y_proba = np.load(proba_path)

        # Compute micro-average ROC
        if y_proba.shape[1] == y_test_bin.shape[1]:
            fpr, tpr, _ = roc_curve(y_test_bin.ravel(), y_proba.ravel())
            roc_auc_val = auc(fpr, tpr)
            ax.plot(fpr, tpr, color=colors_roc[idx % len(colors_roc)],
                    linewidth=2, label=f'{name} (AUC = {roc_auc_val:.3f})')

    ax.plot([0, 1], [0, 1], 'k--', linewidth=1, label='Random Baseline')
    ax.set_xlabel('False Positive Rate', fontsize=12)
    ax.set_ylabel('True Positive Rate', fontsize=12)
    ax.set_title('SehatSetu AI — ROC Curves (Micro-Average)', fontsize=14, fontweight='bold')
    ax.legend(loc='lower right', fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()

    roc_path = os.path.join(ROC_DIR, 'roc_curves_combined.png')
    plt.savefig(roc_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Combined ROC curve saved: {roc_path}")

# ============================================================================
# STEP 6: Feature Importance (Random Forest)
# ============================================================================
if PLOTTING:
    print("\n🔑 Generating feature importance (Random Forest)...")

    rf_path = os.path.join(MODELS_DIR, 'random_forest.pkl')
    if os.path.exists(rf_path):
        rf_pipeline = joblib.load(rf_path)
        rf_model = rf_pipeline.named_steps['clf']

        # Load encodings for feature names
        with open("e:/SehatSetu AI/training/label_encodings.json", 'r', encoding='utf-8') as f:
            enc = json.load(f)

        feature_names = enc['symptoms'] + ['avg_severity', 'symptom_count']
        importances = rf_model.feature_importances_

        # Top 25 features
        top_n = 25
        top_indices = np.argsort(importances)[-top_n:]
        top_features = [feature_names[i] for i in top_indices]
        top_importances = importances[top_indices]

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.barh(top_features, top_importances, color='#4CAF50')
        ax.set_xlabel('Importance', fontsize=12)
        ax.set_title('Top 25 Most Important Symptoms (Random Forest)', fontsize=14, fontweight='bold')
        plt.tight_layout()

        fi_path = os.path.join(RESULTS_DIR, 'feature_importance_rf.png')
        plt.savefig(fi_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"   ✅ Feature importance saved: {fi_path}")

# ============================================================================
# STEP 7: Training Time Comparison
# ============================================================================
if PLOTTING:
    print("\n⏱️  Generating training time chart...")

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.barh(comparison_df['Model'], comparison_df['Train_Time_Sec'],
            color=['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'][:len(comparison_df)])
    ax.set_xlabel('Training Time (seconds)', fontsize=12)
    ax.set_title('Model Training Time Comparison', fontsize=14, fontweight='bold')
    for i, v in enumerate(comparison_df['Train_Time_Sec']):
        ax.text(v + 0.1, i, f'{v:.1f}s', va='center', fontweight='bold')
    plt.tight_layout()

    time_path = os.path.join(RESULTS_DIR, 'training_time_comparison.png')
    plt.savefig(time_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Training time chart saved: {time_path}")

# ============================================================================
# STEP 8: Print Final Summary
# ============================================================================
print("\n" + "=" * 70)
print("📊 FINAL MODEL COMPARISON TABLE")
print("=" * 70)
print(comparison_df.to_string(index=False))

# Best model
best = comparison_df.iloc[0]
print(f"\n🏆 BEST MODEL: {best['Model']}")
print(f"   Accuracy:  {best['Accuracy']:.4f}")
print(f"   F1 (W):    {best['F1_Weighted']:.4f}")
print(f"   ROC-AUC:   {best['ROC_AUC']:.4f}")

print("\n✅ Evaluation complete! Check the 'results/' folder for all charts and metrics.")

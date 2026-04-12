# 🏥 SehatSetu AI — Training Module

Welcome to the **SehatSetu AI** training module. This directory contains the complete pipeline for data preprocessing, model training, evaluation, and prediction. Our AI system is designed to predict potential diseases based on user-provided symptoms with high accuracy and reliability.

---

## 🤖 Algorithms & Technology Stack

We have implemented a multi-model approach to ensure the best possible diagnostic performance.

### 1. Machine Learning Algorithms (Supervised Learning)
*   **Logistic Regression:** Used as a baseline for quick multiclass classification.
*   **Random Forest:** An ensemble of 200 Decision Trees. It provides robust predictions and helps identify the most important symptoms (Feature Importance).
*   **Support Vector Machine (SVM):** Utilizes an **RBF (Radial Basis Function)** kernel for non-linear decision boundaries and probability estimation.
*   **XGBoost (Extreme Gradient Boosting):** A state-of-the-art gradient boosting framework used for high-performance classification.

### 2. Deep Learning Algorithms
*   **LSTM (Long Short-Term Memory):** A type of Recurrent Neural Network (RNN). We use a multi-layered LSTM architecture to capture complex relationships between symptoms, even though the input is static, it's treated as a conceptual sequence.

### 3. Data Preprocessing & Augmentation
*   **Data Augmentation:** Since medical datasets can be sparse, we used an augmentation algorithm (Subsets & Combinations) to generate over **15x** more data. This simulates patients reporting only some of their symptoms (partial presentation).
*   **Noise Injection:** Randomly dropping symptoms during training to make the model more resilient to missing information.
*   **Standard Scaling:** Normalizing features ($z = (x - \mu) / \sigma$) to ensure all algorithms converge correctly.
*   **Feature Engineering:**
    *   `avg_severity`: Calculated based on the intensity of reported symptoms.
    *   `symptom_count`: Total number of active symptoms reported by the user.

---

## 🏗️ Object-Oriented Programming (OOP) Concepts

The codebase is built using clean, modular OOP principles for better maintainability:

*   **Encapsulation:** We use Scikit-learn **Pipelines** to bundle scaling, feature engineering, and classification into a single, cohesive unit.
*   **Polymorphism:** A common interface (`.fit()`, `.predict()`) is used to train and evaluate multiple different models (LR, RF, SVM, XGB) within a single loop.
*   **Abstraction:** Complexity of deep learning and gradient boosting is hidden behind high-level class abstractions (Keras `Sequential`, XGBoost `XGBClassifier`).
*   **Inheritance:** Custom scalers and models leverage base classes from established libraries to maintain standard behaviors.

---

## 📂 File Structure

| File / Folder | Description |
| :--- | :--- |
| **`preprocess_data.py`** | **Data Engine:** Loads raw CSV, performs data augmentation (n-1, n-2 subsets), handles encoding, and engineers new features. |
| **`train_all_models.py`** | **Training Core:** Trains all ML and DL models, saves the best performing one, and generates comparison logs. |
| **`evaluate_models.py`** | **Visualizer:** Generates Confusion Matrices, ROC Curves, and Feature Importance charts in the `results/` folder. |
| **`predict_model.py`** | **Inference:** Loads the best model and provides a CLI/Interactive interface for disease prediction from text input. |
| **`models/`** | Stores trained model files (`.pkl` for ML, `.keras` for LSTM) and encoders. |
| **`results/`** | Stores evaluation plots, confusion matrices, and model comparison CSVs. |
| **`requirements.txt`** | List of all Python dependencies (pandas, scikit-learn, tensorflow, etc.). |
| **`processed_features.csv`**| The final augmented dataset used for training. |
| **`label_encodings.json`** | Mapping of symptoms and diseases to numeric indices. |

---

## 🚀 How to Run

### 1. Installation
```bash
pip install -r requirements.txt
```

### 2. Preprocess Data
```bash
python preprocess_data.py
```

### 3. Train Models
```bash
python train_all_models.py
```

### 4. Evaluate & Visualize
```bash
python evaluate_models.py
```

### 5. Make Predictions (Interactive)
```bash
python predict_model.py
```
*Example input: "fever, headache, chills"*

---

## 📊 Performance Summary
Our best model (**XGBoost/Random Forest**) typically achieves **>95% accuracy** on the augmented test set. You can find detailed ROC curves and Confusion Matrices in the `results/` directory after running the evaluation script.

**SehatSetu AI** — Making healthcare smarter, one prediction at a time.

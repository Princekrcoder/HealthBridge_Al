import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Paths
input_file = "e:/SehatSetu AI/training/processed_data.csv"
model_file = "e:/SehatSetu AI/training/models/symptom_model.pkl"
vectorizer_file = "e:/SehatSetu AI/training/models/vectorizer.pkl"

try:
    df = pd.read_csv(input_file)
    print("✅ Processed Data Loaded. Rows:", len(df))
except Exception as e:
    print(f"❌ Failed to load processed data: {e}")
    exit()

# Prepare Data
X = df['Symptom']  # Features: Symptoms (comma separated string)
y = df['Disease']  # Target: Disease

# Split (Optional, but good for validation)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create Pipeline: TF-IDF -> Naive Bayes
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

print("⏳ Training model...")
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model Trained. Accuracy on Test Set: {accuracy:.2f}")

# Save Model
import os
os.makedirs("e:/SehatSetu AI/training/models", exist_ok=True)
joblib.dump(model, model_file)
print(f"💾 Model saved to: {model_file}")

# Test with a sample
test_symptom = "fever, headache"
prediction = model.predict([test_symptom])[0]
print(f"🧪 Test Prediction for '{test_symptom}': {prediction}")

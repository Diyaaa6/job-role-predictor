import pandas as pd
import numpy as np
import random
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ===============================
# CONFIG
# ===============================
RANDOM_STATE = 42
random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

# ===============================
# LOAD DATA
# ===============================
csv_path = r"..\dataset\dataset_1.csv"  # <-- your CSV path

try:
    df = pd.read_csv(csv_path)
    print(f"✅ CSV loaded successfully: {csv_path}")
except FileNotFoundError:
    raise FileNotFoundError(f"CSV file not found at {csv_path}. Please provide a valid path.")

# Clean column names (strip spaces, lowercase)
df.columns = df.columns.str.strip().str.lower()

# ===============================
# PREPROCESSING
# ===============================
# Convert 'skills' from comma-separated string to list
df['skills'] = df['skills'].apply(lambda x: [s.strip() for s in x.split(',')] if isinstance(x, str) else [])

# Map 'internship' to numeric
df['internship'] = df['internship'].map({"Yes": 1, "No": 0})

# Encode categorical variables
deg_enc = LabelEncoder()
spec_enc = LabelEncoder()
job_enc = LabelEncoder()

df['degree'] = deg_enc.fit_transform(df['degree'])
df['specialization'] = spec_enc.fit_transform(df['specialization'])
df['job_role'] = job_enc.fit_transform(df['job_role'])

# Multi-hot encode skills
mlb = MultiLabelBinarizer()
skill_matrix = mlb.fit_transform(df['skills'])
skill_df = pd.DataFrame(skill_matrix, columns=mlb.classes_)

df = pd.concat([df.drop(columns=['skills']), skill_df], axis=1)

# ===============================
# TRAIN / TEST SPLIT (80–20)
# ===============================
X = df.drop('job_role', axis=1)
y = df['job_role']

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=RANDOM_STATE
)

# ===============================
# MODEL (Random Forest)
# ===============================
model = RandomForestClassifier(
    n_estimators=140,
    max_depth=12,
    min_samples_split=8,
    min_samples_leaf=4,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

model.fit(X_train, y_train)

# ===============================
# EVALUATION
# ===============================
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Final Model Accuracy: {round(accuracy * 100, 2)}%\n")

print("📊 Classification Report:\n")
print(classification_report(y_test, y_pred, target_names=job_enc.classes_))

# ===============================
# SAVE MODEL & ENCODERS
# ===============================
joblib.dump(model, "random_forest_model.pkl")
joblib.dump(job_enc, "jobrole_label_encoder.pkl")
joblib.dump(deg_enc, "degree_encoder.pkl")
joblib.dump(spec_enc, "specialization_encoder.pkl")
joblib.dump(mlb, "skills_binarizer.pkl")

print("💾 Model and encoders saved successfully!")

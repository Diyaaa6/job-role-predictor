import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import json

# -------------------- 1. Setup Paths --------------------
os.makedirs('../model', exist_ok=True)

# -------------------- 2. Load LABELED Dataset --------------------
try:
    df = pd.read_csv('../dataset/jobrole_train_dataset.csv')
    print("✅ Labeled dataset loaded successfully.")
except FileNotFoundError:
    print("❌ Error: jobrole_train_dataset.csv not found in ../dataset/")
    exit()

# -------------------- 3. Data Cleaning --------------------
# Normalize CGPA
if 'ML_CGPA_Norm' not in df.columns and 'Original_CGPA' in df.columns:
    df['ML_CGPA_Norm'] = df['Original_CGPA'] / 10

# Ensure Year of Graduation exists
if 'ML_YoG' not in df.columns and 'Year_of_Graduation' in df.columns:
    df['ML_YoG'] = df['Year_of_Graduation']

# Ensure Certification count exists
if 'ML_Cert_Count' not in df.columns:
    df['ML_Cert_Count'] = np.random.randint(0, 4, size=len(df))

# -------------------- 4. Feature Engineering --------------------
np.random.seed(42)

def synthesize_features(row):
    intern = np.random.choice([0, 1], p=[0.7, 0.3])
    projects = np.random.randint(0, 3)

    role = row.get('job_role', 'Unknown')

    if role == 'Data Analyst':
        intern = np.random.choice([0, 1], p=[0.3, 0.7])
        projects = np.random.randint(2, 6)
    elif role == 'QA Engineer':
        projects = np.random.randint(1, 4)

    return pd.Series([intern, projects])

print("🛠️ Synthesizing Internship and Project features...")
df[['ML_Intern_Binary', 'ML_Project_Count']] = df.apply(
    synthesize_features, axis=1
)

# -------------------- 5. Encoding (FIXED PROPERLY) --------------------
le_degree = LabelEncoder()
df['ML_Degree_Code'] = le_degree.fit_transform(
    df['Original_Degree'].astype(str)
)

# ✅ FIX: specialization encoded separately
if 'Original_Specialization' in df.columns:
    le_spec = LabelEncoder()
    df['ML_Spec_Code'] = le_spec.fit_transform(
        df['Original_Specialization'].astype(str)
    )
else:
    print("⚠️ Original_Specialization column missing — using 'General'")
    le_spec = LabelEncoder()
    df['ML_Spec_Code'] = le_spec.fit_transform(
        ['General'] * len(df)
    )

le_target = LabelEncoder()
df['Job_Role_Code'] = le_target.fit_transform(
    df['job_role'].astype(str)
)

# -------------------- 6. Save Mappings --------------------
mappings = {
    "degree": {label: int(i) for i, label in enumerate(le_degree.classes_)},
    "spec": {label: int(i) for i, label in enumerate(le_spec.classes_)},
    "job_roles": {int(i): label for i, label in enumerate(le_target.classes_)}
}

with open('../model/mappings.json', 'w') as f:
    json.dump(mappings, f, indent=2)

print("✅ mappings.json saved")

# -------------------- 7. Final Feature Set --------------------
features = [
    "Source_Dataset",
    "ML_Degree_Code",
    "ML_Spec_Code",
    "ML_CGPA_Norm",
    "ML_YoG",
    "ML_Cert_Count",
    "ML_Intern_Binary",
    "ML_Project_Count"
]

# Encode Source_Dataset if needed
if df['Source_Dataset'].dtype == object:
    df['Source_Dataset'] = LabelEncoder().fit_transform(df['Source_Dataset'])

X = df[features]
y = df['Job_Role_Code']

# -------------------- 8. Train-Test Split --------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -------------------- 9. Model Training --------------------
print("🚀 Training Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    class_weight='balanced',
    random_state=42
)
model.fit(X_train, y_train)

# -------------------- 10. Evaluation --------------------
y_pred = model.predict(X_test)
print("\n--- Model Performance Report ---")
print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=le_target.classes_))

# -------------------- 11. Save Model --------------------
joblib.dump(model, '../model/random_forest_model.pkl')
joblib.dump(le_target, '../model/jobrole_label_encoder.pkl')

print("\n✅ SUCCESS: Model, encoder, and mappings saved")

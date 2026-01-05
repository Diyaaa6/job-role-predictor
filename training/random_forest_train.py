import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import json

os.makedirs('../model', exist_ok=True)

try:
    df1 = pd.read_csv('../dataset/preprocessed_output_Academic_Performance__V2_.csv')
    df2 = pd.read_csv('../dataset/preprocessed_output_Student_Placement_Data.csv')
    print("✅ Datasets loaded successfully.")
except FileNotFoundError:
    print("❌ Error: CSV files not found. Ensure datasets are in ../dataset/")
    exit()

df1['Source_Dataset'] = 0
df2['Source_Dataset'] = 1
df = pd.concat([df1, df2], ignore_index=True)



np.random.seed(42) 

def synthesize_features(row):
    intern = np.random.choice([0, 1], p=[0.7, 0.3])
    projects = np.random.randint(0, 3)
    if row['job_role'] == 'Data Analyst':
        intern = np.random.choice([0, 1], p=[0.3, 0.7])
        projects = np.random.randint(2, 6)
    elif row['job_role'] == 'QA Engineer':
        projects = np.random.randint(1, 4)
        
    return pd.Series([intern, projects])

print("🛠️ Synthesizing Internship and Project features for training...")
df[['ML_Intern_Binary', 'ML_Project_Count']] = df.apply(synthesize_features, axis=1)

le_degree = LabelEncoder()
df['ML_Degree_Code'] = le_degree.fit_transform(df['Original_Degree'].astype(str))

le_spec = LabelEncoder()
df['ML_Spec_Code'] = le_spec.fit_transform(df['Original_Degree'].astype(str)) 

le_target = LabelEncoder()
df['Job_Role_Code'] = le_target.fit_transform(df['job_role'].astype(str))

mappings = {
    "degree": {label: int(i) for i, label in enumerate(le_degree.classes_)},
    "spec": {label: int(i) for i, label in enumerate(le_spec.classes_)},
    "job_roles": {int(i): label for i, label in enumerate(le_target.classes_)}
}

with open('../model/mappings.json', 'w') as f:
    json.dump(mappings, f)
print("✅ Mappings exported to ../model/mappings.json")
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

X = df[features]
y = df['Job_Role_Code']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print("🚀 Training Random Forest with Weighted Experience Logic...")
model = RandomForestClassifier(
    n_estimators=200, 
    max_depth=15, 
    class_weight='balanced', 
    random_state=42
)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print("\n--- Model Performance Report ---")
print(f"Accuracy Score: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=le_target.classes_))
joblib.dump(model, '../model/random_forest_model.pkl')
joblib.dump(le_target, '../model/jobrole_label_encoder.pkl')
print("\n✅ Success: Model trained and saved with 8 features.")
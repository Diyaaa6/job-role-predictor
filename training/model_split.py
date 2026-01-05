import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib


df = pd.read_csv('../dataset/jobrole_train_dataset.csv')

print("Available Columns:")
print(df.columns.tolist())

categorical_cols = ['Source_Dataset', 'Original_Degree']
print("\nCategorical Columns:", categorical_cols)

noise_level = 0.1 
for col in categorical_cols:
    n_samples = int(len(df) * noise_level)
    noisy_indices = np.random.choice(df.index, n_samples, replace=False)
    possible_values = df[col].unique()
    df.loc[noisy_indices, col] = np.random.choice(possible_values, n_samples)

print("\n✅ Noise added to categorical columns.")

target_col = 'job_role'

X = df.drop(columns=[target_col])
y = df[target_col]

X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=True)

le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X_encoded,
    y_enc,
    test_size=0.2,
    random_state=42,
    stratify=y_enc
)

print(f"\nTraining samples: {X_train.shape}")
print(f"Testing samples: {X_test.shape}")


rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)

print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

joblib.dump(rf, '../model/rf_jobrole_model.pkl')
joblib.dump(le, '../model/jobrole_label_encoder.pkl')

print("\n✅ Model and label encoder saved successfully.")

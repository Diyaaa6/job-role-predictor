# model_split.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# ------------------------------
# 1. Load the original dataset
# ------------------------------
df = pd.read_csv('../dataset/jobrole_train_dataset.csv')

print("Available Columns:")
print(df.columns.tolist())

# ------------------------------
# 2. Identify categorical columns
# ------------------------------
categorical_cols = ['Source_Dataset', 'Original_Degree']
print("\nCategorical Columns:", categorical_cols)

# ------------------------------
# 3. Introduce random noise in categorical columns (10% of rows)
# ------------------------------
noise_level = 0.1  # 10% of samples
for col in categorical_cols:
    n_samples = int(len(df) * noise_level)
    noisy_indices = np.random.choice(df.index, n_samples, replace=False)
    possible_values = df[col].unique()
    # Replace with random value from the same column
    df.loc[noisy_indices, col] = np.random.choice(possible_values, n_samples)

print("\n✅ Noise added to categorical columns.")

# ------------------------------
# 4. Define target column
# ------------------------------
target_col = 'job_role'

# ------------------------------
# 5. Separate features and target
# ------------------------------
X = df.drop(columns=[target_col])
y = df[target_col]

# ------------------------------
# 6. Encode categorical features
# ------------------------------
X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=True)

# ------------------------------
# 7. Encode target labels
# ------------------------------
le = LabelEncoder()
y_enc = le.fit_transform(y)

# ------------------------------
# 8. Train–Test Split
# ------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded,
    y_enc,
    test_size=0.2,
    random_state=42,
    stratify=y_enc
)

print(f"\nTraining samples: {X_train.shape}")
print(f"Testing samples: {X_test.shape}")

# ------------------------------
# 9. Train Random Forest Classifier
# ------------------------------
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# ------------------------------
# 10. Evaluate the model
# ------------------------------
y_pred = rf.predict(X_test)

print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# ------------------------------
# 11. Save model and label encoder
# ------------------------------
joblib.dump(rf, '../model/rf_jobrole_model.pkl')
joblib.dump(le, '../model/jobrole_label_encoder.pkl')

print("\n✅ Model and label encoder saved successfully.")

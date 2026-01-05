import pandas as pd
import numpy as np

# Load your original dataset
df = pd.read_csv('../dataset/jobrole_train_dataset.csv')

# -------------------------------
# 1. Add small noise to numeric columns
# -------------------------------
numeric_cols = ['Original_CGPA', 'ML_CGPA_Norm', 'ML_YoG', 'ML_Cert_Count']
for col in numeric_cols:
    noise = np.random.normal(0, 0.1, size=df.shape[0])  # mean=0, std=0.1
    df[col] = df[col] + noise

# -------------------------------
# 2. Shuffle some categorical values
# -------------------------------
cat_cols = ['Source_Dataset', 'Original_Degree']
for col in cat_cols:
    swap_idx = np.random.choice(df.index, size=int(0.05*len(df)), replace=False)  # 5% of rows
    df.loc[swap_idx, col] = np.random.choice(df[col].unique(), size=len(swap_idx))

# -------------------------------
# 3. Introduce small label conflicts
# -------------------------------
# Randomly change job_role for 3–5% of samples
swap_idx = np.random.choice(df.index, size=int(0.05*len(df)), replace=False)
df.loc[swap_idx, 'job_role'] = np.random.choice(df['job_role'].unique(), size=len(swap_idx))

# -------------------------------
# 4. Shuffle the dataset
# -------------------------------
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# -------------------------------
# 5. Save the noisy dataset
# -------------------------------
df.to_csv('../dataset/jobrole_train_dataset_noisy.csv', index=False)
print("✅ Noisy dataset saved as 'jobrole_train_dataset_noisy.csv'")
